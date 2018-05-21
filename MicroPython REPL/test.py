import binascii
import json
from network import Bluetooth
bluetooth = Bluetooth()

bluetooth.start_scan(-1)

def retTemp(hexa, hexb):
    return 0.25 * ((retInt(hexa) << 8 | retInt(hexb)&3 << 6) >> 6)
def retTime(hex):
    return retInt(hex)&65535
def retInt(hex):
  return int(binascii.hexlify(hex), 16)
def retBat(hex):
  return (retInt(hex) * 10 + 1200)* 0.001
def retPower(hex):
  return -(retInt(hex) % 85 + 20) + 40
def revList(list):
  res = []
  t = ""
  for i in reversed(list):
    res.append(i)
  for m in res:
    t += "%0.2X" % m
  return t
while bluetooth.isscanning():
    adv = bluetooth.get_adv()
    if adv:
        mfg_data = bluetooth.resolve_adv_data(adv.data, Bluetooth.ADV_MANUFACTURER_DATA)
        if mfg_data:
            data = binascii.hexlify(mfg_data)            
            if len(data) == 44:
                dic = {'mac' : binascii.hexlify(adv.mac),
                'manufacturer' : binascii.hexlify(mfg_data[0:2]),
                'identifiyer' : binascii.hexlify(mfg_data[3:11]),
                'beacon_time' : retTime(mfg_data[11:13]),
                'batterry' : retBat(mfg_data[16:17]),
                'temperature' : retTemp(mfg_data[17:18], mfg_data[15:16]),
                'power' : retPower(mfg_data[18:19]),
                'rssi' : adv.rssi,
                'pending' :binascii.hexlify(mfg_data[19:22])
                }
                print(json.dumps(dic))