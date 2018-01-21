const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: {
    worker: path.join(__dirname, './src/browser/src/library.js'),
  },
  output: {
    path: path.join(__dirname, './dist'),
    filename: 'cordova-plugin-qrscanner-lib.min.js',
    library: 'QRScanner',
    libraryTarget: 'var'
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      comments: false
    })
  ]
}
