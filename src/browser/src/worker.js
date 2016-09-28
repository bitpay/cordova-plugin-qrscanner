/*global module:true, postMessage:false, onmessage:true*/

module = {};
var QrCode = require('qrcode-reader').default;
var qr = new QrCode();
qr.callback = function(result, err){
	postMessage({result: result, err: err});
};
onmessage = function(event){
	var imageData = event.data;
  qr.decode(imageData);
};
