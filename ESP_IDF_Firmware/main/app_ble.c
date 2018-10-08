/*
Author: Marco Martinez (927893)
2018-09-30
martinez.marco@tcs.com
*/
#include <stdint.h>
#include <string.h>
#include <stdbool.h>
#include <stdio.h>
#include "nvs_flash.h"

#include "esp_bt.h"
#include "esp_gap_ble_api.h"
#include "esp_gattc_api.h"
#include "esp_gatt_defs.h"
#include "esp_bt_main.h"
#include "esp_bt_defs.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/ringbuf.h"
#include "mbedtls/sha256.h"

//Custom Headers
#include "app_udp.h"
#include "app_mqtt.h"
#include "app_eth.h"

static const char *TAG = "BLE";
const uint8_t salt[10] = {0x4d, 0x61, 0x78, 0x70, 0x61, 0x79, 0x6e, 0x65, 0x33, 0x32};
static void print_hex(const char *title, const unsigned char buf[], size_t len);

//Functions
void ble_init(void);
void ble_deinit(void);
static void buff_callback(void* arg);
void ble_mem_release(void);
void ble_timmer_release(void);

//Buffer
static RingbufHandle_t buf_handle;

//Timmer
static esp_timer_handle_t periodic_timer;
static const esp_timer_create_args_t periodic_timer_args = {
        .callback = &buff_callback,
        .name = "BLE_UDP"
};
//BT Params
static esp_ble_scan_params_t ble_scan_params = {
    .scan_type              = BLE_SCAN_TYPE_ACTIVE,
    .own_addr_type          = BLE_ADDR_TYPE_PUBLIC,
    .scan_filter_policy     = BLE_SCAN_FILTER_ALLOW_ALL,
    .scan_interval          = CONFIG_BLE_INTERVAL,//N * 0.625 msec MIN 0x0004 MAX 0x4000 - 50 msec
    .scan_window            = CONFIG_BLE_WINDOW,//N * 0.625 msec MIN 0x0004 MAX 0x4000 - 30 msec
    .scan_duplicate         = BLE_SCAN_DUPLICATE_DISABLE//BLE_SCAN_DUPLICATE_DISABLE//BLE_SCAN_DUPLICATE_ENABLE
};

static void esp_gap_cb(esp_gap_ble_cb_event_t event, esp_ble_gap_cb_param_t *param) {
    esp_err_t err;
    switch (event) {
        case ESP_GAP_BLE_SCAN_STOP_COMPLETE_EVT: {
            if ((err = param->scan_stop_cmpl.status) != ESP_BT_STATUS_SUCCESS){
                ESP_LOGE(TAG, "Scan stop failed: %s", esp_err_to_name(err));
            }
            else {
                ESP_LOGI(TAG, "Stop successfully");
                mqtt_publish(getMacString(), "_BLE_STOPED", 0, 1, 0);
            }
            break;
        }
        case ESP_GAP_BLE_ADV_STOP_COMPLETE_EVT: {
            if ((err = param->adv_stop_cmpl.status) != ESP_BT_STATUS_SUCCESS){
                ESP_LOGE(TAG, "Adv stop failed: %s", esp_err_to_name(err));
            }
            else {
                ESP_LOGI(TAG, "Stop adv successfully");
            }
            break;
        }
        case ESP_GAP_BLE_SCAN_PARAM_SET_COMPLETE_EVT: {
            uint32_t duration = 0;
            esp_ble_gap_start_scanning(duration);
            break;
        }
        case ESP_GAP_BLE_SCAN_START_COMPLETE_EVT: {
            //scan start complete event to indicate scan start successfully or failed
            if ((err = param->scan_start_cmpl.status) != ESP_BT_STATUS_SUCCESS) {
                ESP_LOGE(TAG, "Scan start failed: %s", esp_err_to_name(err));
            }
            break;
        }
        case ESP_GAP_BLE_SCAN_RESULT_EVT: {
            esp_ble_gap_cb_param_t *scan_result = (esp_ble_gap_cb_param_t *)param;
            switch (scan_result->scan_rst.search_evt) {
                case ESP_GAP_SEARCH_INQ_RES_EVT: {
                    if(scan_result->scan_rst.adv_data_len == 31){
                        //Check if beacon is from fff9 manufacturer
                        if(scan_result->scan_rst.ble_adv[8] == 0xff && scan_result->scan_rst.ble_adv[9] == 0xf9){                            
                            uint8_t data[40];
                            uint8_t payload[62];
                            uint8_t sha[32];
                            uint8_t i;
                            uint8_t *mac;
                            mac = getMAC();
                            //Add Salt
                            for (i = 0; i < 41; i++) {
                                if(i == 0){
                                    data[i] = (scan_result->scan_rst.rssi + 128);//RSSI - 1 Byte [0]
                                }
                                else if(i < 7){
                                    data[i] = mac[i - 1];//MAC - 6 Bytes [1:6]
                                }
                                else if(i < 30){
                                    data[i] = scan_result->scan_rst.ble_adv[i + 1];//ADV - 23 Bytes [7:30]
                                }
                                else{
                                    data[i] = salt[i - 30];//SALT - 10 Bytes [31 - 40]
                                }
                            }
                            //print_hex("dataSalt ", data, sizeof data);           
                            mbedtls_sha256(data, 40, sha, 0);
                            //Merge Data and Sha
                            for(i = 0; i < 62; i++) {
                                if(i < 30){
                                    payload[i] = data[i];
                                }
                                else{
                                    payload[i] = sha[i - 30];
                                }
                            }                           
                            //Add payload to buffer
                            if(buf_handle != NULL){
                                UBaseType_t res =  xRingbufferSend(buf_handle, payload, sizeof(payload), pdMS_TO_TICKS(1000));
                                if(res != pdTRUE) {
                                    ESP_LOGE(TAG,"FAILED TO ADD PAYLOAD TO BUFF");
                                    esp_restart();
                                //ble_ibeacon_deinit();
                                }
                            }                         
                        }                        
                    }
                    break;
                }
                default:
                    ESP_LOGI(TAG, "EVENT SCAN RESUKLT %d", event);
                    break;
            }
            break;
        }
        default:
            ESP_LOGI(TAG, "EVENT GLOBAL %d", event);
            break;
    }
}


static void buff_callback(void* arg){
    size_t item_size;
    uint8_t *item = (uint8_t *)xRingbufferReceive(buf_handle, &item_size, pdMS_TO_TICKS(1000));
    if (item != NULL && buf_handle != NULL) {
        udp_send_data(item, item_size);
        vRingbufferReturnItem(buf_handle, (void *)item);
    } else {
        //No Item Received
        //ESP_LOGI(TAG,"Failed to receive item\n");
    }
}

void ble_init(void){
    esp_err_t err;
//BUFF
    buf_handle = xRingbufferCreate(600, RINGBUF_TYPE_NOSPLIT);
    if (buf_handle == NULL) {
        ESP_LOGI(TAG, "Failed to create ring buffer\n");
    }
//TIMER
    err = esp_timer_create(&periodic_timer_args, &periodic_timer);
    if (err) {
        ESP_LOGE(TAG, "esp_timer_create failed,  %s", esp_err_to_name(err));
        return;
    }
    err = esp_timer_start_periodic(periodic_timer, CONFIG_BLE_TIMER);
    if (err) {
        ESP_LOGE(TAG, "esp_timer_start_periodic failed,  %s", esp_err_to_name(err));
        return;
    }
//BT
    esp_bt_controller_config_t bt_cfg = BT_CONTROLLER_INIT_CONFIG_DEFAULT();
    err = esp_bt_controller_init(&bt_cfg);
    if (err) {
        ESP_LOGE(TAG, "esp_bt_controller_init failed,  %s", esp_err_to_name(err));
        return;
    }
    err = esp_bt_controller_enable(ESP_BT_MODE_BLE);
    if (err) {
        ESP_LOGE(TAG, "esp_bt_controller_enable failed, %s", esp_err_to_name(err));
        return;
    }
    err = esp_bluedroid_init();
    if (err) {
        ESP_LOGE(TAG, "esp_bluedroid_init failed, %s", esp_err_to_name(err));
        return;
    }
    err = esp_bluedroid_enable();
    if (err) {
        ESP_LOGE(TAG, "esp_bluedroid_enable, %s", esp_err_to_name(err));
        return;
    }
    err = esp_ble_gap_register_callback(esp_gap_cb);
    if (err) {
        ESP_LOGE(TAG, "esp_ble_gap_register_callback, %s", esp_err_to_name(err));
        return;
    }
    err = esp_ble_gap_set_scan_params(&ble_scan_params);
    if (err) {
        ESP_LOGE(TAG, "esp_ble_gap_set_scan_params, %s", esp_err_to_name(err));
        return;
    }    
    ESP_LOGI(TAG, "BLE INIT");
    mqtt_publish(getMacString(), "_BLE_INIT", 0, 1, 0);
}

void ble_deinit(void){
    esp_err_t err;
    err = esp_ble_gap_stop_scanning();
    if (err) {
        ESP_LOGE(TAG, "esp_ble_gap_stop_scanning failed,  %s", esp_err_to_name(err));
        return;
    }
    err = esp_bluedroid_disable();
    if (err) {
        ESP_LOGE(TAG, "esp_bluedroid_disable failed,  %s", esp_err_to_name(err));
        return;
    }
    err = esp_bluedroid_deinit();
    if (err) {
        ESP_LOGE(TAG, "esp_bluedroid_deinit failed,  %s", esp_err_to_name(err));
        return;
    }
    err = esp_bt_controller_disable();
    if (err) {
        ESP_LOGE(TAG, "esp_bt_controller_disable failed,  %s", esp_err_to_name(err));
        return;
    }
    err = esp_bt_controller_deinit();
    if (err) {
        ESP_LOGE(TAG, "esp_bt_controller_deinit failed,  %s", esp_err_to_name(err));
        return;
    }
    ESP_LOGI(TAG, "BLE DEINIT");
}
void ble_mem_release(void){
    esp_err_t err;
    err = esp_bt_mem_release(ESP_BT_MODE_BLE);
    if (err) {
        ESP_LOGE(TAG, "esp_bt_mem_release failed,  %s", esp_err_to_name(err));
        return;
    }
    else{
        mqtt_publish(getMacString(), "_BLE_MEMERELEASE", 0, 1, 0);
    }
}

void ble_timmer_release(void){
    esp_err_t err;
//TIMER
    err = esp_timer_stop(periodic_timer);
    if (err) {
        ESP_LOGE(TAG, "esp_timer_stop failed,  %s", esp_err_to_name(err));
        return;
    }
    else{
        err = esp_timer_delete(periodic_timer);
        if (err) {
            ESP_LOGE(TAG, "esp_timer_delete failed,  %s", esp_err_to_name(err));
            return;
        }
        else {
            //BUFF
            vRingbufferDelete(buf_handle);                        
            periodic_timer = NULL;
            buf_handle = NULL;
            mqtt_publish(getMacString(), "_BLE_TIMERRELEASE", 0, 1, 0);
        }
    }
}
static void print_hex(const char *title, const unsigned char buf[], size_t len)
{
    printf("%s: ", title);

    for (size_t i = 0; i < len; i++)
        printf("%02x", buf[i]);

    printf("\r\n");
}