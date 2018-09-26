#include <string.h>
#include <sys/param.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "esp_system.h"
#include "esp_wifi.h"
#include "esp_event_loop.h"
#include "esp_log.h"
#include "nvs_flash.h"

#include "lwip/err.h"
#include "lwip/sockets.h"
#include "lwip/sys.h"
#include <lwip/netdb.h>

#define UDP_PORT 33333
#define SERVER_IP_ADDR "192.168.1.72"
#define MY_IP_ADDR "192.168.1.76"

static const char *TAG = "UDP";

void udp_send_data(char *data){
    
    struct sockaddr_in saddr, raddr;
	//struct sockaddr_in sa,ra;
    int sock = -1;
    int err = 0;

	//char sendbuf[80]; strcpy(sendbuf, data);

    sock = socket(PF_INET, SOCK_DGRAM, 0);
    if (sock < 0) {
        ESP_LOGI(TAG, "Failed to create socket. Error %d", errno);
        //return -1;
    }

    raddr.sin_family = AF_INET;
    raddr.sin_addr.s_addr = htonl(INADDR_ANY);
    raddr.sin_port = htons(UDP_PORT);

    saddr.sin_family = AF_INET;//AF_INET
    saddr.sin_port = htons(UDP_PORT);
    saddr.sin_addr.s_addr = inet_addr(SERVER_IP_ADDR);
	
    err = bind(sock, (struct sockaddr *)&raddr, sizeof(struct sockaddr_in));
    if (err < 0) {
        ESP_LOGI(TAG, "Failed to bind socket. Error %d", errno);
        close(sock);
        //return -1;
    }

    err = sendto(sock, data, strlen(data), 0, (struct sockaddr*)&saddr, sizeof(saddr));
    if (err < 0) {
        ESP_LOGI(TAG, "IPV4 sendto failed. errno: %d", errno);
		close(sock);
        //return -1;
    }
	else{
		close(sock);
	}
}