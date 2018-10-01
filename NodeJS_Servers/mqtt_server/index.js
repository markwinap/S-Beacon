var net = require('net')
var mqttCon = require('mqtt-connection')
var server = new net.Server()
 
server.on('connection', function (stream) {
  var client = mqttCon(stream)
 
  // client connected
  client.on('connect', function (packet) {
    // acknowledge the connect packet
    console.log('client connected');
    client.connack({ returnCode: 0 });
  })
 
  // client published
  client.on('publish', function (packet) {
    // send a puback with messageId (for QoS > 0)
    console.log('client published');
    console.log('client messageId ' + packet.messageId);
    console.log('client topic ' + packet.topic);
    console.log('client payload ' + packet.payload);
    client.puback({ messageId: packet.messageId })
  })
 
  // client pinged
  client.on('pingreq', function () {
    // send a pingresp
    console.log('client published');
    client.pingresp()
  });
 
  // client subscribed
  client.on('subscribe', function (packet) {
    // send a suback with messageId and granted QoS level
    console.log('client published');
    client.suback({ granted: [packet.qos], messageId: packet.messageId })
  })
 
  // timeout idle streams after 5 minutes
  stream.setTimeout(1000 * 30 * 1)//1000 * 60 * 5
 
  // connection error handling
  client.on('close', function () { 
    console.log('client close');
    client.destroy() 
  })
  client.on('error', function () { 
    console.log('client error');
    client.destroy() })
  client.on('disconnect', function () { 
    console.log('client error');
    client.destroy() })
 
  // stream timeout
  stream.on('timeout', function () { 
    console.log('client timeout');
    client.destroy(); })
})
 
// listen on port 1883
server.listen(1884)