var cordovaRequire = require('webpack/cordova/require');
var cordovaModule = require('webpack/cordova/module');

var createQRScannerInternal = require('./createQRScannerInternal.js');

cordovaModule.exports = createQRScannerInternal();
cordovaRequire('cordova/exec/proxy').add('QRScanner', cordovaModule.exports);
