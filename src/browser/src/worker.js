/*global module:true, postMessage:false, onmessage:true*/

module = {};
var jsQR = require('jsqr');

onmessage = function(event){
	var imageData = event.data;
  var code = jsQR(imageData.data,imageData.width,imageData.height)
  if(code){
    postMessage({result: code.data, err: null});
  }else{
    postMessage({result: null, err: true});
  }
};
