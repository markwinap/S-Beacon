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
#include "app_ble.h"
#include "app_ota.h"
#include "app_http.h"
#include "esp_timer.h"

#include "esp_http_client.h"
#include "eth_phy/phy_lan8720.h"

#define MAX_HTTP_RECV_BUFFER 512
//static const char *TAG = "HTTP_CLIENT";
static const char *TAG = "MAIN";


static void periodic_timer_callback(void* arg);




void app_main(){
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
      ESP_ERROR_CHECK(nvs_flash_erase());
      ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    const esp_timer_create_args_t periodic_timer_args = {
            .callback = &periodic_timer_callback,
            .name = "ota"
    };
    esp_timer_handle_t periodic_timer;
    ESP_ERROR_CHECK(esp_timer_create(&periodic_timer_args, &periodic_timer));

    ESP_ERROR_CHECK(esp_timer_start_periodic(periodic_timer, 5000000));//Start Timmer

    if(app_eth_initialise() != ESP_OK) {
        ESP_LOGI(TAG, "Error");
    }
    else{
        app_ble_initialise();
        ESP_LOGI(TAG, "Ethernet Connected");
        for( ;; )
        {
            char str1[12] = "Hello";
            http_send_request(str1);
            vTaskDelay( 1000 );
        }
    }    
}

static void periodic_timer_callback(void* arg){
    int64_t time_since_boot = esp_timer_get_time();
    ESP_LOGI(TAG, "Periodic timer called, time since boot: %lld us", time_since_boot);
}