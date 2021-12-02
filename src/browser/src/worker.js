const jsqr = require('jsqr');
onmessage = function(event) {
  const imageData = event.data;
  const code = jsqr(imageData.data, imageData.width, imageData.height);
  if (code) {
    postMessage({ result: code.data });
  }
};
