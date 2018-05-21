import machine
import time
from network import WLAN
from network import Bluetooth
import usocket as socket
bluetooth = Bluetooth()
wlan = WLAN()
wlan.init(mode = WLAN.STA, antenna = WLAN.EXT_ANT, channel = 1)
nets = wlan.scan()

def int_to_bytes(value, length):
  result = []
  for i in range(0, length):
    result.append(value >> (i * 8) & 0xff)
  result.reverse()
  return result

def sendudp(data):
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.sendto(data, ("192.168.1.72", 33333))
    sock.close()
def netConnect():
    print("Connecting")
    wlan.connect('SSID', auth=(WLAN.WPA2, 'Password'), timeout=3000)
    time.sleep(4)
netConnect()
bluetooth.start_scan(-1)
while bluetooth.isscanning():
    adv = bluetooth.get_adv()
    if adv:
        mfg_data = bluetooth.resolve_adv_data(adv.data, Bluetooth.ADV_MANUFACTURER_DATA)
        if mfg_data:
            if wlan.isconnected():
                if len(mfg_data) == 22:
                    print("Sending")
                    sendudp(machine.unique_id() + bytes(int_to_bytes(adv.rssi, 2)) + mfg_data)
            else:
                time.sleep(4)
                print("Disconnected")
                netConnect()