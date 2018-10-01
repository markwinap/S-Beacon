const dgram = require('dgram');
const udp_server = dgram.createSocket('udp4');

const udpPort = 33333;

//UDP Server
udp_server.on('error', (err) => {
	console.log(`udp_server error:\n${err.stack}`);
	udp_server.close();
});
udp_server.on('message', (msg, rinfo) => {
	console.log(msg.toString('hex'));
    console.log(msg.toString('utf8'));
});
udp_server.on('listening', () => {
	const address = udp_server.address();
	console.log(`udp_server listening ${address.address}:${address.port}`);
});
udp_server.bind(udpPort);
