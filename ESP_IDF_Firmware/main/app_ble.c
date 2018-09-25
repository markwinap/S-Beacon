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

static const char *TAG = "BLE";

static esp_ble_scan_params_t ble_scan_params = {
    .scan_type              = BLE_SCAN_TYPE_ACTIVE,
    .own_addr_type          = BLE_ADDR_TYPE_PUBLIC,
    .scan_filter_policy     = BLE_SCAN_FILTER_ALLOW_ALL,
    .scan_interval          = 0x50,//N * 0.625 msec MIN 0x0004 MAX 0x4000 - 50 msec
    .scan_window            = 0x30,//N * 0.625 msec MIN 0x0004 MAX 0x4000 - 30 msec
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
                        if(scan_result->scan_rst.ble_adv[8] == 0xff && scan_result->scan_rst.ble_adv[9] == 0xf9){
                            //Bluevision Beacon
                            ESP_LOGI(TAG, "----------sBeacon Found----------");
                            ESP_LOGI(TAG, "Line :%d", __LINE__);
                            esp_log_buffer_hex("IBEACON_DEMO: Device address:", scan_result->scan_rst.bda, ESP_BD_ADDR_LEN );
                            ESP_LOGI(TAG, "Data Leng %d ", scan_result->scan_rst.adv_data_len);
                            esp_log_buffer_hex( "ble_adv", scan_result->scan_rst.ble_adv, scan_result->scan_rst.adv_data_len);
                            ESP_LOGI(TAG, "RSSI of packet:%d dbm", scan_result->scan_rst.rssi);
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
    esp_bluedroid_init();
    esp_bluedroid_enable();
    ble_ibeacon_appRegister();
}

void app_ble_initialise(){
    esp_bt_controller_config_t bt_cfg = BT_CONTROLLER_INIT_CONFIG_DEFAULT();
    esp_bt_controller_init(&bt_cfg);
    esp_bt_controller_enable(ESP_BT_MODE_BLE);
    ble_ibeacon_init();
    //Enable Scan
    esp_ble_gap_set_scan_params(&ble_scan_params);
}