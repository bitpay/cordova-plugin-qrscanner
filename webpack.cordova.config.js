const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: {
    plugin: path.join(__dirname, './src/browser/src/cordova-plugin.js'),
    www: path.join(__dirname, './src/common/src/cordova-www.js')
  },
  output: {
    path: path.join(__dirname, './dist'),
    filename: '[name].min.js'
  },
  externals: {
    "webpack/cordova": "cordova",
    "webpack/cordova/require": "cordovaRequire",
    "webpack/cordova/exports": "cordovaExports",
    "webpack/cordova/module": "cordovaModule"
  }
}
