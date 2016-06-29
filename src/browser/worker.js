/*global module:true, importScripts:false, postMessage:false, onmessage:true*/

module = {};
importScripts('qrcode-reader.js');
var QrCode = module.exports;
var qr = new QrCode();
qr.callback = function(result, err){
	postMessage({result: result, err: err});
};
onmessage = function(event){
	var imageData = event.data;
  qr.decode(imageData);
};
