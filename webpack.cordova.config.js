const webpack = require('webpack');

module.exports = {
  entry: {
    plugin: './src/browser/src/cordova-plugin.js',
    www: './src/common/src/cordova-www.js'
  },
  output: {
    path: './dist',
    filename: '[name].min.js'
  },
  externals: {
    "webpack/cordova": "cordova",
    "webpack/cordova/require": "cordovaRequire",
    "webpack/cordova/exports": "cordovaExports",
    "webpack/cordova/module": "cordovaModule"
  },
  plugins: [
    // new webpack.optimize.UglifyJsPlugin({
    //   comments: false
    // })
  ]
}
