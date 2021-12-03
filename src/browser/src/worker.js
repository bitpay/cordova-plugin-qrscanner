const jsqr = require('jsqr');
onmessage = function(event) {
  const imageData = event.data;
  const code = jsqr(imageData.data, imageData.width, imageData.height);
  // Even if a code was not detected, we'll post a message back in order
  // to start a new scan cycle.
  postMessage({ result: code ? code.data : null })
};
