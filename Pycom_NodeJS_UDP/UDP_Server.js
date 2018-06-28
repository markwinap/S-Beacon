/*
UDP
Beacon - {"pycom":"30aea4500ec4","rssi":-42,"beacon":"c30b6529c756a18a","beacon_time":59410,"battery":3,"dBm":6,"distance":0.56,"updated":1529331262857}
Beacon Config {"beacon":"c6091790a9118b17","created":1529211600000,"updated":1529330940665,"alarm":false,"alarm_time":1529330655363,"alarm_reason":false,"alarms_triggered":8,"muted":false,"threshold":60000,"zones":["30aea4500ec4"],"in_ok_zones":[{"pycom":"30aea4500ec4","rssi":-65,"beacon":"c6091790a9118b17","beacon_time":512,"battery":3.01,"dBm":4,"distance":10}],"in_notok_zones":[]}
*/

const dgram = require('dgram');
const crypto = require('crypto');
const redis = require("redis");
const express = require('express');
const bodyParser = require('body-parser');

const udp_server = dgram.createSocket('udp4');
const express_app = express();
express_app.use(bodyParser.json());
const salt = new Buffer('SALT', 'utf8');

client = redis.createClient();
multi = client.multi();

//Timmers
const min_update = 30000;
const interval_update = 20000;

//Server Ports
const expressPort = 3000;
const udpPort = 33333;


//Data for testing - Clear - Set
client.hdel('beacon_config', 'c30b6529c756a18a');
client.hdel('beacon_config', 'c6091790a9118b17');
client.hset('beacon_config', 'c30b6529c756a18a', JSON.stringify({beacon: 'c30b6529c756a18a', created:  1529211600000, updated: 1529211600000, alarm: false, inzone_time: 0, alarm_time: 1529287200000, alarm_reason: false, alarms_triggered: 0, muted: false, threshold: 60000, in_ok_zones: [], in_notok_zones: [], zones: ['30aea4500ec4']}));
client.hset('beacon_config', 'c6091790a9118b17', JSON.stringify({beacon: 'c6091790a9118b17', created:  1529211600000, updated: 1529211600000, alarm: false, inzone_time: 0, alarm_time: 1529287200000, alarm_reason: false, alarms_triggered: 0, muted: false, threshold: 60000, in_ok_zones: [], in_notok_zones: [], zones: ['30aea4500ec4']}));


let update_interval = setInterval(() => updateDB(), interval_update);

express_app.use(function(req, res, next) {
	  res.header("Access-Control-Allow-Origin", "*");
	  res.header("Access-Control-Allow-Headers", "*");
	  next();
});

express_app.get('/getall', function (req, res) {
	console.log('GET Request - query');
	client.hgetall('beacon_config', function (err, beacon_c) {
		if(err) res.json({error: 'Unable to get beacon configuration'});
		else{
			let beacon_arr = [];
			let beacon_c_obj = Object.keys(beacon_c);
			for(let i in beacon_c_obj){
				beacon_arr.push(JSON.parse(beacon_c[beacon_c_obj[i]]));
			}
			res.json(beacon_arr);
		}
	});
});
express_app.get('/get', function (req, res) {
	console.log('GET Request - QUERY');
	client.hget('beacon_config', req.query.beacon, function (err, beacon){
		if(err) res.json({error: 'Unable to get beacon configuration'});
		else{
			if(beacon != null) res.json(JSON.parse(beacon));
			else res.json({error: 'Not Found'});
		}
	});
});
express_app.post('/update', function (req, res) {
	console.log('POST Request - BODY');
	let beacon = req.body;
	client.hget('beacon_config', beacon.beacon, function (err, beacon_conf){
		if(err) res.json({error: 'Unable to get beacon configuration'});
		else{
			if(beacon != null){
				let beacon_c_obj = JSON.parse(beacon_conf);
				beacon_c_obj = Object.assign(beacon_c_obj, beacon);
				client.hset('beacon_config', beacon_c_obj.beacon, JSON.stringify(beacon_c_obj), function(err, beacon_s){
					if(err) res.json({error: 'Unable to set beacon configuration'});
					else res.json(beacon_c_obj);
				});
			}
			else res.json({error: 'Not Found'});
		}
	});
});
express_app.listen(expressPort)
//Redis Update
client.on("error", function (err) {
	console.log("Redis Error " + err);
});
//UDP Server
udp_server.on('error', (err) => {
	console.log(`udp_server error:\n${err.stack}`);
	udp_server.close();
});
udp_server.on('message', (msg, rinfo) => {
	if(msg.length == 62){
		if(toHex(retHash(bufferSlice(msg, 0, 30))) == toHex(bufferSlice(msg, 30, 62))){
			let dBm = retdBm(retInt(msg, 26, 1));
			let rssi = retssi(retInt(msg, 6, 2));
			let json = {
				pycom : toHex(bufferSlice(msg, 0, 6)),
				rssi : rssi,
				beacon :  toHex(bufferSlice(msg, 11, 19).reverse()),
				beacon_time : beaconTime(retInt(msg, 19, 2)),
				battery : retBattery(retInt(msg, 24, 1)),
				dBm : dBm,
				distance : distance(dBm, rssi),
				updated: new Date().getTime()
			};
			//console.log(json);//DEBUG sds
			multi.hset("beacon", json.beacon, JSON.stringify(json));////Hash Set
			multi.sadd("pycom_id", json.pycom);//Set Add
			multi.sadd("beacon_id", json.beacon);
			multi.exec();
		}
		else console.log('hash error');
	}
});
udp_server.on('listening', () => {
	const address = udp_server.address();
	console.log(`udp_server listening ${address.address}:${address.port}`);
});
udp_server.bind(udpPort);

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
	let pathLoss = (dBm * -1) - rssi;
	return Math.round(Math.pow(10, (pathLoss - 41)/20) * 100) /100;
}
function retHash(buf){
	let hash = crypto.createHash('sha256');
	hash.update(Buffer.concat([buf, salt]));
	return hash.digest();
}
//update functions
function compareBeacon(beacon, beacon_config, beacon_status){//Beacon ID, All beacon Configurations, ALL Beacons
	let time = new Date().getTime();
	let beacon_s_arr = Object.keys(beacon_status);
	let in_ok_zones = [];
	let in_notok_zones = [];
	let b_obj = JSON.parse(beacon_config[beacon]);
	for(let n in beacon_s_arr){
		let b_status = JSON.parse(beacon_status[beacon_s_arr[n]]);
		if(b_status.beacon == beacon){
			if((time - b_status.updated) < min_update){//Dont show old tokens
				if(b_obj.zones.includes(b_status.pycom)) in_ok_zones.push(b_status);
				else in_notok_zones.push(b_status);
			}
		}
	}
	return {in_ok_zones : in_ok_zones, in_notok_zones: in_notok_zones};
}
function updateDB(){
	client.hgetall('beacon_config', function (err, beacon_c) {
		if(err) console.log(err);
		else{
			client.hgetall('beacon', function (err, beacon_s) {
				let time = new Date().getTime();
				if(err) console.log(err);
				else{
					//console.log(beacon_s)
					if(beacon_s){					
						let beacon_c_obj = Object.keys(beacon_c);
						for(let i in beacon_c_obj){
							let beacon_obj = JSON.parse(beacon_c[beacon_c_obj[i]]);
							let beacon = compareBeacon(beacon_obj.beacon, beacon_c, beacon_s);
							if(beacon.in_ok_zones.concat(beacon.in_notok_zones).length != 0){
								if(beacon.in_ok_zones.length > 0){
									console.log(beacon_obj.beacon +  ' In ok Zone');
									if(beacon_obj.alarm == true){
										postAxios({Message: 'Beacon' + beacon_obj.beacon + '  Back Online', Subject: 'Beacon' + beacon_obj.beacon + ' Back Online'});

									}
									beacon_obj.alarm = false;
									beacon_obj.alarm_reason = false;
									beacon_obj.updated = time;
									beacon_obj.inzone_time = time;
								}
								else{
									if((time - beacon_obj.inzone_time) > beacon_obj.threshold){
										
										if(beacon_obj.alarm ==  false && beacon_obj.muted == false){
											console.log(beacon_obj.beacon +  ' In not ok Zone and > threshold' + (time - beacon_obj.alarm_time));
											beacon_obj.alarm = true;
											beacon_obj.alarm_reason = 2;
											beacon_obj.alarm_time = time;
											beacon_obj.updated = time;
											beacon_obj.alarms_triggered ++;
											postAxios({Message: 'Beacon' + beacon_obj.beacon + '  Not Allowed Zone.\nAlarms Triggered ' +  beacon_obj.alarms_triggered, Subject: 'Beacon' + beacon_obj.beacon + ' Not Allowed Zone'});
										}
										else{
											beacon_obj.alarm = true;
											beacon_obj.alarm_reason = 2;
										}
									}
									else{
										console.log(beacon_obj.beacon +  ' In not ok Zone and < threshold');
										beacon_obj.alarm = false;
										beacon_obj.updated = time;
										beacon_obj.alarm_reason = 2;
									}
								}
							}
							else{
								if((time - beacon_obj.updated) > beacon_obj.threshold){									
									if(beacon_obj.alarm ==  false && beacon_obj.muted == false){
										console.log(beacon_obj.beacon +  ' Invisible > threshold ' + (time - beacon_obj.updated));
										beacon_obj.alarm = true;
										beacon_obj.alarm_reason = 1;
										beacon_obj.alarm_time = time;
										beacon_obj.alarms_triggered ++;
										postAxios({Message: 'Beacon' + beacon_obj.beacon + ' Not Visible.\nAlarms Triggered ' +  beacon_obj.alarms_triggered, Subject: 'Beacon' + beacon_obj.beacon + ' Not Visible'});
									}
									else{
										beacon_obj.alarm = true;
										beacon_obj.alarm_reason = 1;
										//muted
									}
								}
								else{
									console.log(beacon_obj.beacon +  ' Invisible < threshold');
									beacon_obj.alarm = false;
									beacon_obj.alarm_reason = 1;
								}
							}//Else No Zones
							//console.log(JSON.stringify(Object.assign(beacon_obj, beacon)))
							multi.hset('beacon_config', beacon_obj.beacon, JSON.stringify(Object.assign(beacon_obj, beacon)));
							beacon_obj = {};
						}//End For Loop
						//Add New Beacons
						for(let b in beacon_s){
							let b_obj = JSON.parse(beacon_s[b]);
							let dat = new Date().getTime();
							if(!beacon_c_obj.includes(b_obj.beacon)){
								multi.hset('beacon_config', b_obj.beacon, JSON.stringify({beacon: b_obj.beacon, created:  dat, updated: dat, alarm: false, inzone_time: 0, alarm_time: 0, alarm_reason: false, alarms_triggered: 0, muted: false, threshold: 60000, in_ok_zones: [], in_notok_zones: [], zones: ['30aea4500ec4']}));
							}
						}
						multi.exec();
					}//IF Beacon Response is empty
				}//Else If data
			});//End Get beacon status
		}//End Else
	});//End beacon config
}
//POST AXIOS
function postAxios(data){
	axios({
		method: 'post',
		url: 'https://qmfrgy8wx6.execute-api.us-east-1.amazonaws.com/dev/s-beacon-sns-notification',
		headers: {'Content-Type': 'application/json'},
		data: JSON.stringify(data)
	  })
	  .then((response) => {
		console.log(response)
	  })
	  .catch((error) => {
		console.log(error);
	  });	
}
