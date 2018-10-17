/*global module:true, postMessage:false, onmessage:true*/

module = {};
var QrCode = require('qrcode-reader').default;
var qr = new QrCode();
qr.callback = function(err, result) {
  postMessage({ result: result, err: err });
};
onmessage = function(event) {
  var imageData = event.data;
  qr.decode(imageData);
};
