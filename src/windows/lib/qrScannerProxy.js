const qrScanner = require('./qrScanner');

let proxy = {};

function wrap(fn) {
  return function (successCallback, errorCallback, strInput) {
    fn.call(qrScanner, strInput).then(successCallback, function (errorCode) {
      errorCallback(errorCode.toString() || '0');
    });
  }
}

for (let property in qrScanner) {
  if (typeof qrScanner[property] == "function") {
    proxy[property] = wrap(qrScanner[property])
  }
}

module.exports = proxy;

cordova.commandProxy.add("QRScanner", proxy);
