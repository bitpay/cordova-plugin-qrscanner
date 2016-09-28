var cordova = require('webpack/cordova');
var cordovaModule = require('webpack/cordova/module');

var createQRScannerAdapter = require('./createQRScannerAdapter.js');

// pass in global cordova object to expose cordova.exec
var QRScannerAdapter = createQRScannerAdapter(cordova);
cordovaModule.exports = QRScannerAdapter;
