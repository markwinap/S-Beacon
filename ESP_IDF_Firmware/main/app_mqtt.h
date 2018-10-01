/*
   ETH
*/

#ifndef _APP_MQTT_H_
#define _APP_MQTT_H_

void mqtt_init(void);
void mqtt_deinit(void);
void mqtt_publish(char *topic, char *data, int len, int qos, int retain);
void mqtt_subscribe(char *topic, int qos);

#endif