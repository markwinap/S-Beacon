import machine
import time
import gc
import _thread
import usocket as socket
from network import Bluetooth
from network import WLAN

UDPServer = "192.168.1.72"
UDPPort = 33333
LANSID = 'INFINITUM3736_2.4'
LANPassword = 'Maxpayne32'

listBuffer = []

wlan = WLAN()
wlan.init(mode = WLAN.STA, antenna = WLAN.EXT_ANT, channel = 1)
gc.enable()
bluetooth = Bluetooth()
bluetooth.start_scan(-1)

def sendudp(data):
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.sendto(data, (UDPServer, UDPPort))
    sock.close()

def intBytes(value, len):
  result = []
  for i in range(0, len):
    result.append(value >> (i * 8) & 0xff)
  result.reverse()
  return result

def sendBuff(*args):
    while True:
        time.sleep(0.5)
        if wlan.isconnected():
            if len(listBuffer) > 0:
                try:
                    sendudp(listBuffer[0])
                    listBuffer.pop(0)
                    print(len(listBuffer))
                    print(gc.mem_free())
                except:
                    pass

def netConnect():
    wlan.connect(LANSID, auth=(WLAN.WPA2, LANPassword), timeout=3000)
    time.sleep(5)

def checkConnect(*args):
    while True:
        time.sleep(2)
        if wlan.isconnected():
            pass
        else:
            wlan.disconnect()
            netConnect()            

def bleScan(*args):
    while True:
        if bluetooth.isscanning():
            adv = bluetooth.get_advertisements()
            if adv:
                for advert in adv:
                    if advert[1] == 1 and advert[2] == 0:
                        if advert[4][0:3] == b'\x02\x01\x06':
                            if advert[4][7:11] == b'\x17\xff\xf9\x00':
                                listBuffer.append(advert[4])
        else:
            print('Need to Reboot')
            machine.reset()

try:
    t1 = _thread.start_new_thread(sendBuff, ("Thread-1", 'Buff', ))
    t2 = _thread.start_new_thread(bleScan, ("Thread-2", 'BLE', ))
    t3 = _thread.start_new_thread(checkConnect, ("Thread-3", 'LAN', ))
    
except:
   print("Error: unable to start thread")
while 1:
   pass