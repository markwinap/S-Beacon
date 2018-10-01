/*
Author: Marco Martinez (927893)
2018-09-30
martinez.marco@tcs.com
*/
#include <stdint.h>
#include <string.h>
#include <stdbool.h>
#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "esp_system.h"
#include "nvs_flash.h"
#include "app_eth.h"

static const char *TAG = "MAIN";

void app_main(){
    //START FLASH
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
      ESP_ERROR_CHECK(nvs_flash_erase());
      ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);
    if(app_eth_initialise() != ESP_OK) {
        ESP_LOGI(TAG, "Error");
    }
    else{
        ESP_LOGI(TAG, "VERSION %s", CONFIG_VERSION);
    }    
}