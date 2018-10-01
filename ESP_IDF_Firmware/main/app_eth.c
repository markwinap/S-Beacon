
/*
Author: Marco Martinez (927893)
2018-09-30
martinez.marco@tcs.com
*/
#include <stdio.h>

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "esp_system.h"
#include "esp_err.h"
#include "esp_event_loop.h"
#include "esp_event.h"
#include "esp_attr.h"
#include "esp_log.h"
#include "esp_eth.h"

#include "rom/ets_sys.h"
#include "rom/gpio.h"

#include "soc/dport_reg.h"
#include "soc/io_mux_reg.h"
#include "soc/rtc_cntl_reg.h"
#include "soc/gpio_reg.h"
#include "soc/gpio_sig_map.h"

#include "tcpip_adapter.h"
#include "nvs_flash.h"
#include "driver/gpio.h"

#include "eth_phy/phy_lan8720.h"


#include "app_mqtt.h"

#define PIN_SMI_MDC   23
#define PIN_SMI_MDIO  18
#define PIN_PHY_POWER 12

static const char *TAG = "ETHERNET";

static uint8_t mac[6];
static char mac_string[11];
uint8_t * getMAC(void);
char * getMacString(void);

static esp_err_t eth_event_handler(void *ctx, system_event_t *event){
    switch (event->event_id) {
		case SYSTEM_EVENT_ETH_CONNECTED:
			ESP_LOGI(TAG, "Ethernet Link Up");
			break;
		case SYSTEM_EVENT_ETH_DISCONNECTED:
			ESP_LOGI(TAG, "Ethernet Link Down");
			break;
		case SYSTEM_EVENT_ETH_START:
			ESP_LOGI(TAG, "Ethernet Started");
			break;
		case SYSTEM_EVENT_ETH_GOT_IP:
			ESP_LOGI(TAG, "GOT_IP");
			esp_read_mac(mac, ESP_MAC_ETH);   
			uint8_t i;
			for(i=0; i< 6;i++) {
				sprintf(&mac_string[i*2], "%02X", mac[i]);
			}
			ESP_LOGI(TAG, "[Ethernet] Mac Address = %02X:%02X:%02X:%02X:%02X:%02X\r\n", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
			mqtt_init();
			break;
		case SYSTEM_EVENT_ETH_STOP:
			ESP_LOGI(TAG, "Ethernet Stopped");
			break;
		default:
		ESP_LOGI(TAG, "Ethernet Stopped %d", event->event_id);
			break;
    }
    return ESP_OK;
}

static void phy_device_power_enable_via_gpio(bool enable){
	if (!enable){
        phy_lan8720_default_ethernet_config.phy_power_enable(false);
    }
	gpio_pad_select_gpio(PIN_PHY_POWER);
	gpio_set_direction(PIN_PHY_POWER,GPIO_MODE_OUTPUT);
	gpio_set_level(PIN_PHY_POWER, (int)enable);

	// Allow the power up/down to take effect, min 300us
	vTaskDelay(1);
	if (enable){
        phy_lan8720_default_ethernet_config.phy_power_enable(true);
    }
}

static void eth_gpio_config_rmii(void){
    phy_rmii_configure_data_interface_pins();
    phy_rmii_smi_configure_pins(PIN_SMI_MDC, PIN_SMI_MDIO);
}

uint8_t app_eth_initialise() {
	eth_config_t config = phy_lan8720_default_ethernet_config;
	esp_err_t ret = ESP_OK;

	/* Initialize adapter */
	tcpip_adapter_init();
	esp_event_loop_init(eth_event_handler, NULL);

	/* Set the PHY address in the example configuration */
	config.phy_addr = 0;
	config.gpio_config = eth_gpio_config_rmii;
	config.tcpip_input = tcpip_adapter_eth_input;
	config.phy_power_enable = phy_device_power_enable_via_gpio;

	/* Chanege clock mode */
	config.clock_mode = ETH_CLOCK_GPIO17_OUT;

	/* Initialize ethernet */
	ret = esp_eth_init(&config);
	if(ret != ESP_OK){
        return ret;
    }	
	/* Enable ethernet */
	return esp_eth_enable();
}
uint8_t * getMAC(void){
	return mac;
}
char * getMacString(void){
	return mac_string;
}