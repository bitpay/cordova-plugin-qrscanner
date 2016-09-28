const webpack = require('webpack');

module.exports = {
  entry: {
    worker: './src/browser/src/worker.js',
  },
  output: {
    path: './src/browser',
    filename: 'worker.min.js'
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      comments: false
    })
  ]
}
