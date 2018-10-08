/*
Author: Marco Martinez (927893)
2018-09-30
martinez.marco@tcs.com
*/
#include <stdio.h>
#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include "esp_system.h"
#include "nvs_flash.h"

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/semphr.h"
#include "freertos/queue.h"

#include "lwip/sockets.h"
#include "lwip/dns.h"
#include "lwip/netdb.h"

#include "esp_log.h"
#include "mqtt_client.h"

#include "app_ble.h"
#include "app_eth.h"
#include "app_ota.h"

static const char *TAG = "MQTT";
static uint8_t counter;

//Functions
void mqtt_init(void);
void mqtt_deinit(void);
void mqtt_publish(char *topic, char *data, int len, int qos, int retain);
void mqtt_subscribe(char *topic, int qos);

static esp_mqtt_client_handle_t client;

static esp_err_t mqtt_event_handler(esp_mqtt_event_handle_t event){
    switch (event->event_id) {
        case MQTT_EVENT_CONNECTED:
            ESP_LOGI(TAG, "MQTT_EVENT_CONNECTED");
            ESP_LOGI(TAG, "%s", getMacString());
            mqtt_publish(getMacString(), "_MQTT_OK", 0, 1, 0);
            mqtt_subscribe(getMacString(), 1);
            break;
        case MQTT_EVENT_DISCONNECTED:
            ESP_LOGI(TAG, "MQTT_EVENT_DISCONNECTED");
            if(counter == 3){
                esp_restart();
            }
            counter =  counter + 1;
            break;
        case MQTT_EVENT_SUBSCRIBED:
            ESP_LOGI(TAG, "MQTT_EVENT_SUBSCRIBED, msg_id=%d", event->msg_id);
            break;
        case MQTT_EVENT_UNSUBSCRIBED:
            ESP_LOGI(TAG, "MQTT_EVENT_UNSUBSCRIBED, msg_id=%d", event->msg_id);
            break;
        case MQTT_EVENT_PUBLISHED:
            //ESP_LOGI(TAG, "MQTT_EVENT_PUBLISHED, msg_id=%d", event->msg_id);
            break;
        case MQTT_EVENT_DATA:
            ESP_LOGI(TAG, "MQTT_EVENT_DATA");
            //printf("TOPIC=%.*s\r\n", event->topic_len, event->topic);
            //printf("DATA=%.*s\r\n", event->data_len, event->data);
            //tmp[14] = '\0';      
            switch (event->data[0]){
                case 'O'://OTA
                    ota_init();
                    break;
                case 'M'://MAC
                    mqtt_publish(getMacString(), getMacString(), 0, 1, 0);
                    break;
                case 'B'://BLE INIT
                    ble_init();
                    break;
                case 'b'://BLE DEINIT
                    ble_deinit();
                    break;
                case 'R'://RESTART
                    esp_restart();
                    break;
                case 'V'://Version
                    mqtt_publish(getMacString(), CONFIG_VERSION, 0, 1, 0);
                    break;
                case 'P'://Get Partition
                    mqtt_publish(getMacString(), get_partition(), 0, 1, 0);
                    break;
                case 'r'://mem release
                    ble_mem_release();
                    break;
                case 't'://timer release
                    ble_timmer_release();
                    break;
            }
            break;
        case MQTT_EVENT_ERROR:
            ESP_LOGI(TAG, "MQTT_EVENT_ERROR");
            esp_restart();
            break;
    }
    return ESP_OK;
}


void mqtt_init(void){
    esp_err_t err;
    esp_mqtt_client_config_t mqtt_cfg = {
        .uri = CONFIG_BROKER_URL,
        .event_handle = mqtt_event_handler,
    };
    client = esp_mqtt_client_init(&mqtt_cfg);
    err = esp_mqtt_client_start(client);
    if (err) {
        ESP_LOGE(TAG, "esp_mqtt_client_start, %s", esp_err_to_name(err));
        return;
    }
}
void mqtt_deinit(void){
    esp_err_t err;
    err = esp_mqtt_client_stop(client);
    if (err) {
        ESP_LOGE(TAG, "esp_mqtt_client_stop, %s", esp_err_to_name(err));
        return;
    }
    err = esp_mqtt_client_destroy(client);
    if (err) {
        ESP_LOGE(TAG, "esp_mqtt_client_destroy, %s", esp_err_to_name(err));
        return;
    }
}
void mqtt_publish(char *topic, char *data, int len, int qos, int retain){
    esp_mqtt_client_publish(client, topic, data, len, qos, retain);//return Int
}
void mqtt_subscribe(char *topic, int qos){
    esp_err_t err;
    err = esp_mqtt_client_subscribe(client, topic, qos);
    if (err) {
        ESP_LOGE(TAG, "esp_mqtt_client_subscribe, %s", esp_err_to_name(err));
        return;
    }
}