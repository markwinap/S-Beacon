const dgram = require('dgram');
const server = dgram.createSocket('udp4');
const crypto = require('crypto');

const salt = new Buffer('Maxpayne', 'utf8');

server.on('error', (err) => {
          console.log(`server error:\n${err.stack}`);
          server.close();
});
server.on('message', (msg, rinfo) => {
    //console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
    console.log(msg.length);
    console.log(msg.toString('hex'));
    
    if(msg.length == 62){
        if(toHex(retHash(bufferSlice(msg, 32, 62))) == toHex(bufferSlice(msg, 0, 32))){
            console.log('same hash');
            let dBm = retdBm(retInt(msg, 58, 1));
            let rssi = retssi(retInt(msg, 38, 2));
            let json = {
                pycom : toHex(bufferSlice(msg, 32, 38)),
                rssi : rssi,
                beacon :  toHex(bufferSlice(msg, 43, 51).reverse()),
                beacon_time : beaconTime(retInt(msg, 51, 2)),
                battery : retBattery(retInt(msg, 56, 1)),
                dBm : dBm,
                distance : distance(dBm, rssi)
            };
            console.log(JSON.stringify(json));
        }
        else console.log('hash error');
    }
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
function retssi(int){
    if ((int & 0x8000) > 0) {
        int = int - 0x10000;
    }
    return int;
}
function beaconTime(int){
    return int&65535;
}
function distance(dBm, rssi){
    let pathLoss = (dBm * -1) - rssi;
    return Math.round(Math.pow(10, (pathLoss - 41)/20) * 100) /100;
}
function retHash(buf){
    let hash = crypto.createHash('sha256');
    hash.update(buf);
    return hash.digest();
}
//.reverse()
//def retBat(hex):
//  return (retInt(hex) * 10 + 1200)* 0.001
//def s16(value):
//    return -(value & 0x8000) | (value & 0x7fff)