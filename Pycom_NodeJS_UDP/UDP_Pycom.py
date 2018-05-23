import machine
import uhashlib
import time
from network import WLAN
from network import Bluetooth
import usocket as socket

bluetooth = Bluetooth()
wlan = WLAN()
wlan.init(mode = WLAN.STA, antenna = WLAN.EXT_ANT, channel = 1)
machine_id = machine.unique_id()

def int_to_bytes(value, len):
  result = []
  for i in range(0, len):
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
    time.sleep(5)
def createHash(data):
    m = uhashlib.sha256()
    m.update(data)
    return m.digest()
bluetooth.start_scan(-1)
while bluetooth.isscanning():
    adv = bluetooth.get_adv()
    if adv:
        mfg_data = bluetooth.resolve_adv_data(adv.data, Bluetooth.ADV_MANUFACTURER_DATA)
        if mfg_data:
            if wlan.isconnected():
                if len(mfg_data) == 22:
                    data = machine_id + bytes(int_to_bytes(adv.rssi, 2)) + mfg_data                    
                    sendudp(createHash(data) + data)
            else:
                time.sleep(5)
                netConnect()