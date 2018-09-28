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

//Custom Headers
#include "app_udp.h"

#define BUFF_TIMER 300000

static const char *TAG = "BLE";
static uint8_t mac[6];

//Buffer
static RingbufHandle_t buf_handle;

//Timmer
static void buff_callback(void* arg);
static const esp_timer_create_args_t periodic_timer_args = {
        .callback = &buff_callback,
        .name = "BLE_UDP"
};

static esp_ble_scan_params_t ble_scan_params = {
    .scan_type              = BLE_SCAN_TYPE_ACTIVE,
    .own_addr_type          = BLE_ADDR_TYPE_PUBLIC,
    .scan_filter_policy     = BLE_SCAN_FILTER_ALLOW_ALL,
    .scan_interval          = 0x640,//N * 0.625 msec MIN 0x0004 MAX 0x4000 - 50 msec
    .scan_window            = 0x640,//N * 0.625 msec MIN 0x0004 MAX 0x4000 - 30 msec
    .scan_duplicate         = BLE_SCAN_DUPLICATE_DISABLE
};

static void esp_gap_cb(esp_gap_ble_cb_event_t event, esp_ble_gap_cb_param_t *param) {
    esp_err_t err;
    switch (event) {
        case ESP_GAP_BLE_SCAN_STOP_COMPLETE_EVT: {
            if ((err = param->scan_stop_cmpl.status) != ESP_BT_STATUS_SUCCESS){
                ESP_LOGE(TAG, "Scan stop failed: %s", esp_err_to_name(err));
            }
            else {
                ESP_LOGI(TAG, "Stop scan successfully");
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
                            //Bluevision Beacon
                            //ESP_LOGI(TAG, "----------sBeacon Found----------");
                            //esp_log_buffer_hex("IBEACON_DEMO: Device address:", scan_result->scan_rst.bda, ESP_BD_ADDR_LEN );
                            //ESP_LOGI(TAG, "Data Leng %d ", scan_result->scan_rst.adv_data_len);
                            //ESP_LOGI(TAG, "RSSI of packet:%d dbm", scan_result->scan_rst.rssi);
                            //esp_log_buffer_hex( "ble_adv", scan_result->scan_rst.ble_adv, scan_result->scan_rst.adv_data_len);
                            uint8_t payload[30];
                            uint8_t i;
                            //Fill Payload
                            payload[0] = (scan_result->scan_rst.rssi + 128);
                            for (i = 0; i < 6; i++) {
                                payload[i + 1] = mac[i];
                            }
                            for (i = 8; i < 31; i++) {
                                payload[i - 1] = scan_result->scan_rst.ble_adv[i];
                            }
                            //esp_log_buffer_hex( "PAYLOAD", payload,  sizeof(payload));
                            //ESP_LOGI(TAG, "PAYLOAD Leng %d ",  sizeof(payload));

                            //Add payload to buffer
                            UBaseType_t res =  xRingbufferSend(buf_handle, payload, sizeof(payload), pdMS_TO_TICKS(1000));
                            if (res != pdTRUE) {
                               ESP_LOGE(TAG,"FAILED TO ADD PAYLOAD TO BUFF");
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
    if (item != NULL) {
        udp_send_data(item, item_size);
        vRingbufferReturnItem(buf_handle, (void *)item);
    } else {
        //No Item Received
        //ESP_LOGI(TAG,"Failed to receive item\n");
    }
}

void ble_ibeacon_appRegister(void){
    esp_err_t status;
    ESP_LOGI(TAG, "register callback");
    //register the scan callback function to the gap module
    if ((status = esp_ble_gap_register_callback(esp_gap_cb)) != ESP_OK) {
        ESP_LOGE(TAG, "gap register error: %s", esp_err_to_name(status));
        return;
    }
}

void ble_ibeacon_init(void){
    esp_err_t ret;
    ret = esp_bluedroid_init();
    if (ret) {
        ESP_LOGE(TAG, "%s init bluetooth failed, error code = %x\n", __func__, ret);
        return;
    }
    ret = esp_bluedroid_enable();
    if (ret) {
        ESP_LOGE(TAG, "%s enable bluetooth failed, error code = %x\n", __func__, ret);
        return;
    }
    ble_ibeacon_appRegister();
    esp_ble_gap_set_scan_params(&ble_scan_params);
    ESP_LOGI(TAG, "BLE INIT");
}
void ble_ibeacon_deinit(void){
    esp_bluedroid_disable();
    esp_bluedroid_deinit();
    ESP_LOGI(TAG, "BLE DEINIT");
}

void app_ble_initialise(){
    //GET MAC
    esp_read_mac(mac, ESP_MAC_ETH);    
    ESP_LOGI(TAG, "[Ethernet] Mac Address = %02X:%02X:%02X:%02X:%02X:%02X\r\n", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

    //BUFF STuFFF
    buf_handle = xRingbufferCreate(1028, RINGBUF_TYPE_NOSPLIT);
    if (buf_handle == NULL) {
        ESP_LOGI(TAG, "Failed to create ring buffer\n");
    }

    //TIMER STuFFF
    esp_timer_handle_t periodic_timer;
    ESP_ERROR_CHECK(esp_timer_create(&periodic_timer_args, &periodic_timer));
    ESP_ERROR_CHECK(esp_timer_start_periodic(periodic_timer, BUFF_TIMER));

    //BLE STuFFF
    esp_bt_controller_config_t bt_cfg = BT_CONTROLLER_INIT_CONFIG_DEFAULT();
    esp_bt_controller_init(&bt_cfg);
    esp_bt_controller_enable(ESP_BT_MODE_BLE);
    //Enable Scan
    
    
}
/*
uint8_t * merge(uint8_t *a, uint8_t *d, int i);

uint8_t * merge(uint8_t *a, uint8_t *d, int i){
    static uint8_t temp[37];
    temp[0] = a[0];
    //size_t n = sizeof(a) / sizeof(uint8_t);
    //ESP_LOGI(TAG, "ARRAT LEGTH %d", n);
    return temp;

}
*/