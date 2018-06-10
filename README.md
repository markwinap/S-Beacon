# S-Beacon

S-Beacon Protocol to JSON


### Protocol

[![N|Solid](https://raw.githubusercontent.com/markwinap/MicroPython-S-Beacon/master/img/protocol.PNG)](#)

### Installation

Pending Class

### NodeJS

```js
const dgram = require('dgram');
const server = dgram.createSocket('udp4');

server.on('error', (err) => {
          console.log(`server error:\n${err.stack}`);
          server.close();
});
server.on('message', (msg, rinfo) => {
    //console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
    console.log(msg.toString('hex'));
    let json = {pycom : toHex(bufferSlice(msg, 0, 6)),
        rssi : rssi(retInt(msg, 6, 2)),
        beacon :  toHex(bufferSlice(msg, 11, 19).reverse()),
        beacon_time : retInt(msg, 19, 2)&65535,
        battery : retBattery(retInt(msg, 24, 1)),
        dBm : retdBm(retInt(msg, 26, 1))
    };
    console.log(JSON.stringify(json));
});
server.on('listening', () => {
          const address = server.address();
          console.log(`server listening ${address.address}:${address.port}`);
});
server.bind(33333);

function bufferSlice(buf, start, end){
    return buf.slice(start, end);
}
function toHex(obj){
    return obj.toString('hex');
}
function retInt(buf, start, end){
    return buf.readUIntBE(start, end);
}
function retBattery(int){
    return Math.round(((int * 10 + 1200)* 0.001) * 100) / 100;
}
function retdBm(int){
    return -(int % 85 + 20) + 40;
}
function rssi(int){
    if ((int & 0x8000) > 0) {
        int = int - 0x10000;
    }
    return int;
}
```

### Result from NodeJS

```js
{"pycom":"240ac400faea","rssi":-76,"beacon":"c30b6529c756a18a","beacon_time":31337,"battery":3.05,"dBm":7}
{"pycom":"240ac400faea","rssi":-73,"beacon":"c30b6529c756a18a","beacon_time":32617,"battery":3.05,"dBm":6}
{"pycom":"240ac400faea","rssi":-77,"beacon":"c30b6529c756a18a","beacon_time":33897,"battery":3.05,"dBm":5}
{"pycom":"240ac400faea","rssi":-79,"beacon":"c30b6529c756a18a","beacon_time":41577,"battery":3.05,"dBm":7}
{"pycom":"240ac400faea","rssi":-75,"beacon":"c30b6529c756a18a","beacon_time":42857,"battery":3.05,"dBm":6}
{"pycom":"240ac400faea","rssi":-76,"beacon":"c30b6529c756a18a","beacon_time":44137,"battery":3.05,"dBm":5}
```

### MicroPython REPL

```py
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
```

### Example Result MicroPython

```json
{"power": 5, "pending": "796eef", "rssi": -63, "identifiyer": "178b11a9901709c6", "batterry": 3.01, "temperature": 25.75, "mac": "e11870f817d5", "manufacturer": "f900", "beacon_time": 19454}
{"power": 6, "pending": "15e314", "rssi": -64, "identifiyer": "8aa156c729650bc3", "batterry": 3.05, "temperature": 25.75, "mac": "c4ba73181675", "manufacturer": "f900", "beacon_time": 48629}
{"power": 5, "pending": "54e195", "rssi": -65, "identifiyer": "8aa156c729650bc3", "batterry": 3.05, "temperature": 25.75, "mac": "c4ba73181675", "manufacturer": "f900", "beacon_time": 49909}
{"power": 7, "pending": "80f3b5", "rssi": -70, "identifiyer": "8aa156c729650bc3", "batterry": 3.05, "temperature": 25.75, "mac": "c4ba73181675", "manufacturer": "f900", "beacon_time": 51189}
{"power": 6, "pending": "c096ab", "rssi": -65, "identifiyer": "8aa156c729650bc3", "batterry": 3.05, "temperature": 25.75, "mac": "c4ba73181675", "manufacturer": "f900", "beacon_time": 52469}
{"power": 6, "pending": "4960b7", "rssi": -66, "identifiyer": "178b11a9901709c6", "batterry": 3.01, "temperature": 25.75, "mac": "e11870f817d5", "manufacturer": "f900", "beacon_time": 28414}
{"power": 5, "pending": "39d5c1", "rssi": -64, "identifiyer": "178b11a9901709c6", "batterry": 3.01, "temperature": 25.75, "mac": "e11870f817d5", "manufacturer": "f900", "beacon_time": 29694}
{"power": 4, "pending": "4bbabe", "rssi": -65, "identifiyer": "178b11a9901709c6", "batterry": 3.01, "temperature": 25.75, "mac": "e11870f817d5", "manufacturer": "f900", "beacon_time": 30974}
{"power": 6, "pending": "0848ce", "rssi": -67, "identifiyer": "178b11a9901709c6", "batterry": 3.01, "temperature": 25.75, "mac": "e11870f817d5", "manufacturer": "f900", "beacon_time": 32254}
{"power": 5, "pending": "2a2a5b", "rssi": -65, "identifiyer": "178b11a9901709c6", "batterry": 3.01, "temperature": 25.75, "mac": "e11870f817d5", "manufacturer": "f900", "beacon_time": 33534}
```
### Todos

 - Create Python Class

### Usefull Links
https://www.bluetooth.com/specifications/assigned-numbers/generic-access-profile

License
----

GPLv3
   [PlGa]: <https://github.com/RahulHP/dillinger/blob/master/plugins/googleanalytics/README.md>
