/*global module:true, importScripts:false, postMessage:false, onmessage:true*/

module = {};
importScripts('qrcode-reader.js');
const QrCode = module.exports;
const qr = new QrCode();
qr.callback = (result, err) => {
	postMessage({result, err});
};
onmessage = event => {
	const imageData = event.data;
	qr.decode(imageData);
};
