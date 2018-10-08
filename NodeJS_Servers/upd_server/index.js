const dgram = require('dgram');
const udp_server = dgram.createSocket('udp4');
const crypto = require('crypto');
const salt = new Buffer('Maxpayne32', 'utf8');
console.log(salt);

const udpPort = 33333;

//4d 61 78 70 61 79 6e 65 33 32
//4d 61 78 70 61 79 6e 65 33 32
//UDP Server
udp_server.on('error', (err) => {
	console.log(`udp_server error:\n${err.stack}`);
	udp_server.close();
});
let counter = 0;
let c = setInterval(function(){	
	if(counter > 0){
		console.log(counter);
	}
	counter = 0;
}, 1000);

udp_server.on('message', (msg, rinfo) => {
	//console.log(msg.toString('hex'));
	//console.log(toHex(bufferSlice(msg, 0, 30)));
	//console.log(toHex(bufferSlice(msg, 30, 62)));
	//console.log(toHex(retHash(bufferSlice(msg, 0, 30))));
	
	if(toHex(retHash(bufferSlice(msg, 0, 30))) == toHex(bufferSlice(msg, 30, 62))){
		counter++;
		//rssi - 1
		//mac -6
		//data -23
		//sha 32
		//rssi[31]MAC[3700bf0cac97]MANUFAC[fff900]ID[01] BIDY[e00d0c84c1e3ee9c] bTime[b627af00] Battery[d7] TEMP[b419] dBm[9a] PENDING[6780fd] RSA[92b86f9975e4b9a1c7a99164243568bb293c5c8c0d2a98dd6e3a68973995c68e]

		let dBm = retdBm(retInt(msg, 26, 1));
		let rssi = retInt(msg, 0, 1) - 128;
		let json = {
			mac : toHex(bufferSlice(msg, 1, 7)),
			rssi : rssi,
			beacon :  toHex(bufferSlice(msg, 11, 19).reverse()),//8
			beacon_time : beaconTime(retInt(msg, 19, 2)),
			battery : retBattery(retInt(msg, 24, 1)),
			dBm : dBm,
			//distance : distance(dBm, rssi),
			updated: new Date().getTime()
		};
		console.log(JSON.stringify(json));//DEBUG sds

	}
    //console.log(msg.toString('utf8'));
});
udp_server.on('listening', () => {
	const address = udp_server.address();
	console.log(`udp_server listening ${address.address}:${address.port}`);
});
udp_server.bind(udpPort);


function toHex(obj){
	return obj.toString('hex');
}
function retHash(buf){
	let hash = crypto.createHash('sha256');
	hash.update(Buffer.concat([buf, salt]));
	//console.log('BUF WITH SALT ', Buffer.concat([buf, salt]));
	return hash.digest();
}
function bufferSlice(buf, start, end){
	return buf.slice(start, end);
}
//FUNCTIONS
//UDP Functions
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
    if (rssi == 0) {
        return -1.0; // if we cannot determine distance, return -1.
    }
	let pathLoss = (rssi * 1.0) - dBm;
	console.log(pathLoss)
    if (pathLoss < 1.0) {
        return Math.pow(pathLoss, 10);
    } else {
		ret = 0.89976 * (Math.pow(pathLoss, 7.7095) + 0.111);
		return ret;
    }	
}
function retHash(buf){
	let hash = crypto.createHash('sha256');
	hash.update(Buffer.concat([buf, salt]));
	return hash.digest();
}