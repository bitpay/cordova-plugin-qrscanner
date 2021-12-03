const fs = require("fs")
const path = require("path")
const { Compilation, DefinePlugin, sources } = require("webpack")
const ESLintPlugin = require('eslint-webpack-plugin')

// We need to prepend cordova-remap.js to the scripts that will be loaded by cordova.
// https://stackoverflow.com/a/65529189/1237919
class PrependCordovaRemap {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap("PrependCordovaRemap", (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: "PrependCordovaRemap",
          stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
        },
        assets => {
          const remap = fs.readFileSync('src/common/src/cordova-remap.js', 'utf-8')

          Object.entries(assets).forEach(([pathname, source]) => {
            // Don't prepend to worker.min.js.
            if (pathname.endsWith('worker.min.js')) return

            const file = compilation.getAsset(pathname)
            compilation.updateAsset(
              pathname,
              new sources.RawSource(remap + file.source.source())
            )
          })
        }
      )
    })
  }
}

// Note that both webpack configurations below will output worker.min.js,
// each one to a different directory adjacent to the asset that uses it.
module.exports = [
  {
    name: "cordova",
    mode: "production",
    entry: {
      plugin: path.join(__dirname, "./src/browser/src/cordova-plugin.js"),
      www: path.join(__dirname, "./src/common/src/cordova-www.js"),
    },
    output: {
      // Use filename function to send scripts to different directories.
      filename: pathData => {
        let relativePath = './'
        if (pathData.chunk.name === 'plugin') {
          relativePath = '../src/browser'
        } else if (pathData.chunk.name === 'www') {
          relativePath = '../www'
        }
        return `${relativePath}/[name].min.js`
      },
      // Empirically, webpack only derives a non-initial chunk's filename from the filename
      // configuration when it's a string. If filename is a function, it does not
      // use that function for non-initial chunks. In such a case, the following chunkFilename
      // configuration must be defined in order to override the default.
      // In this configuration, chunkFilename is used to name worker.min.js and place it next to
      // the plugin.
      chunkFilename: pathData => {
        let relativePath = './'
        if (pathData.chunk.name === 'worker') {
          relativePath = '../src/browser'
        }
        return `${relativePath}/[name].min.js`
      }
    },
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        }
      ]
    },
    externals: {
      "webpack/cordova": "cordova",
      "webpack/cordova/require": "cordovaRequire",
      "webpack/cordova/exports": "cordovaExports",
      "webpack/cordova/module": "cordovaModule",
    },
    optimization: {
      mangleExports: false,
      minimize: false,
      // Disable all chunk splitting.
      // Note that worker module will always be split, but its dependencies will be inline.
      splitChunks: {
        cacheGroups: {
          default: false,
          defaultVendors: false
        }
      }
    },
    plugins: [
      new DefinePlugin({
        // See comment in createQRScannerInternal.js:initialize why we do this.
        'process.env.WORKER_PUBLIC_PATH': JSON.stringify('/plugins/cordova-plugin-qrscanner/src/')
      }),
      new ESLintPlugin({}),
      new PrependCordovaRemap()
    ],
    performance: {
      // Silence warning about worker.min.js being too big.
      // We intentionally bundle its vendor modules in it.
      maxAssetSize: 300000
    }
  },
  {
    // The library tests are run via 'npm run test:library'.
    name: "library-tests",
    mode: "production",
    devtool: "source-map",
    entry: {
      'cordova-plugin-qrscanner-lib': path.join(__dirname, "./src/browser/src/library.js"),
    },
    output: {
      filename: "[name].min.js",
      library: "QRScanner",
      libraryTarget: "umd",
      umdNamedDefine: true,
    },
    // It's not necessary to use Babel to transpile, because the library tests
    // are only used on desktop during development.
    optimization: {
      mangleExports: false,
      minimize: false,
      // Disable all chunk splitting.
      // Note that worker module will always be split, but its dependencies will be inline.
      splitChunks: {
        cacheGroups: {
          default: false,
          defaultVendors: false
        }
      }
    },
    plugins: [
      new DefinePlugin({
        // Public path does not need to be overwritten for the simpler library test.
        'process.env.WORKER_PUBLIC_PATH': 'null'
      }),
      new ESLintPlugin({})
    ],
    performance: {
      // Silence warning about worker.min.js being too big.
      // We intentionally bundle its vendor modules in it.
      maxAssetSize: 300000
    }
  }
];
