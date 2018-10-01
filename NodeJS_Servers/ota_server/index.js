var fs = require('fs');
var https = require('https');
var privateKey  = fs.readFileSync('server_certs/ca_key.pem', 'utf8');
var certificate = fs.readFileSync('server_certs/ca_cert.pem', 'utf8');

var credentials = {key: privateKey, cert: certificate};
var express = require('express');
var app = express();


var options = {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['htm', 'html'],
  index: false,
  maxAge: '1d',
  redirect: false,
  setHeaders: false
}

app.use(express.static('public', options))

app.get('/', function (req, res) {
  res.send('Hello World')
  console.log('Hello World\n')
})
 


var httpsServer = https.createServer(credentials, app);


httpsServer.listen(443);