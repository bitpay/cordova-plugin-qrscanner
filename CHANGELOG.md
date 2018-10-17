<a name="2.6.0"></a>
# [2.6.0](https://github.com/bitpay/cordova-plugin-qrscanner/compare/2.5.0...2.6.0) (2018-05-17)


### Bug Fixes

* **android:** Remove cordova-plugin-compat android dependency ([85e2396](https://github.com/bitpay/cordova-plugin-qrscanner/commit/85e2396))
* **ios:** prevents iOS plugin from crashing when destroy is called without a callback ([610a004](https://github.com/bitpay/cordova-plugin-qrscanner/commit/610a004)), closes [#142](https://github.com/bitpay/cordova-plugin-qrscanner/issues/142)
* **ios,android:** set background to transparent rather than white ([c9531b8](https://github.com/bitpay/cordova-plugin-qrscanner/commit/c9531b8)), closes [#135](https://github.com/bitpay/cordova-plugin-qrscanner/issues/135)
* **package:** add `main` property to package ([955e375](https://github.com/bitpay/cordova-plugin-qrscanner/commit/955e375)), closes [#83](https://github.com/bitpay/cordova-plugin-qrscanner/issues/83)
* **package:** Use upstream swift support plugin ([211597c](https://github.com/bitpay/cordova-plugin-qrscanner/commit/211597c))
* **windows:** prevent memory leaks when destroying, add rd file ([1a4843a](https://github.com/bitpay/cordova-plugin-qrscanner/commit/1a4843a))


### Features

* **browser:** upgrade qrcode-reader to ^1.0.4 ([08cf523](https://github.com/bitpay/cordova-plugin-qrscanner/commit/08cf523)), closes [#92](https://github.com/bitpay/cordova-plugin-qrscanner/issues/92)
* **ios:** Upgrade, convert syntax to Swift 3.1 ([27fdd92](https://github.com/bitpay/cordova-plugin-qrscanner/commit/27fdd92))
* **windows:** target windows 10 universal ([691cdda](https://github.com/bitpay/cordova-plugin-qrscanner/commit/691cdda))



<a name="2.5.0"></a>
# [2.5.0](https://github.com/bitpay/cordova-plugin-qrscanner/compare/2.4.1...v2.5.0) (2017-02-15)


### Features

* **windows:** add support for windows phone 8.1 ([3efa2df](https://github.com/bitpay/cordova-plugin-qrscanner/commit/3efa2df))



<a name="2.4.1"></a>
## [2.4.1](https://github.com/bitpay/cordova-plugin-qrscanner/compare/2.4.0...v2.4.1) (2017-02-14)


### Bug Fixes

* **ios:** correct video preview orientation handling on iOS ([141edbb](https://github.com/bitpay/cordova-plugin-qrscanner/commit/141edbb)), closes [#7](https://github.com/bitpay/cordova-plugin-qrscanner/issues/7)
* **ios:** fix openSettings on iOS 10.0 ([#43](https://github.com/bitpay/cordova-plugin-qrscanner/issues/43)) ([aaa098c](https://github.com/bitpay/cordova-plugin-qrscanner/commit/aaa098c))



<a name="2.4.0"></a>
# [2.4.0](https://github.com/bitpay/cordova-plugin-qrscanner/compare/2.3.4...2.4.0) (2016-10-06)

## How to Upgrade

If you installed a previous version of this plugin and manually added a block like the following to your `config.xml`:

```xml
<platform name="ios">
    <hook type="before_build" src="plugins/cordova-plugin-qrscanner/scripts/swift-support.js" />
    <config-file target="*-Info.plist" parent="NSCameraUsageDescription">
      <string>The camera is used to scan QR codes.</string>
    </config-file>
</platform>
```

you can simply delete the whole thing, it is no longer necessary. The iOS platform now installs itself completely, and no additional configuration is needed.

### Features

* **ios:** remove need for the swift-support hook, remove script ([dca1f7e](https://github.com/bitpay/cordova-plugin-qrscanner/commit/dca1f7e))



<a name="2.3.4"></a>
## [2.3.4](https://github.com/bitpay/cordova-plugin-qrscanner/compare/2.3.3...2.3.4) (2016-10-01)


### Bug Fixes

* **ios:** Make NSCameraUsageDescription string non-empty, which is now rejected by Apple ([514a2d2](https://github.com/bitpay/cordova-plugin-qrscanner/commit/514a2d2))
* **ios:** pause scanning with pausePreview method on iOS ([c0722c7](https://github.com/bitpay/cordova-plugin-qrscanner/commit/c0722c7)), closes [#12](https://github.com/bitpay/cordova-plugin-qrscanner/issues/12)



<a name="2.3.3"></a>
## [2.3.3](https://github.com/bitpay/cordova-plugin-qrscanner/compare/2.3.2...2.3.3) (2016-09-29)


### Bug Fixes

* **browser:** make cancelScan call the current scan's callback with error code 6 ([d5ca673](https://github.com/bitpay/cordova-plugin-qrscanner/commit/d5ca673))
* **library:** fixes an issue with optional callbacks being required ([99dc348](https://github.com/bitpay/cordova-plugin-qrscanner/commit/99dc348))



<a name="2.3.2"></a>
## [2.3.2](https://github.com/bitpay/cordova-plugin-qrscanner/compare/2.3.1...2.3.2) (2016-09-28)


### Bug Fixes

* **library:** rename UMD library file in dist ([a4b385f](https://github.com/bitpay/cordova-plugin-qrscanner/commit/a4b385f))



<a name="2.3.1"></a>
## [2.3.1](https://github.com/bitpay/cordova-plugin-qrscanner/compare/2.3.0...2.3.1) (2016-09-28)


### Bug Fixes

* **package:** remove install script ([b769bec](https://github.com/bitpay/cordova-plugin-qrscanner/commit/b769bec))



<a name="2.3.0"></a>
# [2.3.0](https://github.com/bitpay/cordova-plugin-qrscanner/compare/2.2.0...2.3.0) (2016-09-28)


### Features

* **all:** Add build process, release browser platform as a UMD library ([052b8d3](https://github.com/bitpay/cordova-plugin-qrscanner/commit/052b8d3)), closes [#30](https://github.com/bitpay/cordova-plugin-qrscanner/issues/30)



<a name="2.2.0"></a>
## [2.1.2](https://github.com/bitpay/cordova-plugin-qrscanner/compare/2.1.1...2.1.2) (2016-08-15)


### Features

* **ios:** Support iOS 10 beta ([fa7ef5b](https://github.com/bitpay/cordova-plugin-qrscanner/commit/fa7ef5b))



<a name="2.1.1"></a>
## [2.1.1](https://github.com/bitpay/cordova-plugin-qrscanner/compare/2.1.0...2.1.1) (2016-08-12)


### Bug Fixes

* **android:** fixes the enableLight and disableLight methods ([21add2f](https://github.com/bitpay/cordova-plugin-qrscanner/commit/21add2f))



<a name="2.1.0"></a>
# [2.1.0](https://github.com/bitpay/cordova-plugin-qrscanner/compare/2.0.1...2.1.0) (2016-08-05)


### Bug Fixes

* **all:** added required parameters to certain cordova.exec functions ([69fe4e6](https://github.com/bitpay/cordova-plugin-qrscanner/commit/69fe4e6))


### Features

* **android:** add QRScanner class and majority of its methods ([7e589ef](https://github.com/bitpay/cordova-plugin-qrscanner/commit/7e589ef))
* **android:** android platform release preparation ([2d60614](https://github.com/bitpay/cordova-plugin-qrscanner/commit/2d60614))
* **android:** complete initial android release ([4afa02e](https://github.com/bitpay/cordova-plugin-qrscanner/commit/4afa02e))



<a name="2.0.1"></a>
## [2.0.1](https://github.com/bitpay/cordova-plugin-qrscanner/compare/2.0.0...2.0.1) (2016-08-03)


### Bug Fixes

* **js:** added requred args param to cordova.exec calls ([99050d6](https://github.com/bitpay/cordova-plugin-qrscanner/commit/99050d6))



<a name="2.0.0"></a>
# [2.0.0](https://github.com/bitpay/cordova-plugin-qrscanner/compare/v1.1.0...2.0.0) (2016-06-29)

### Bug Fixes

* **jshint:** make jshint pass ([2d95c10](https://github.com/bitpay/cordova-plugin-qrscanner/commit/2d95c10))

### Features

* **browser:** add browser to plugin.xml ([ac91b82](https://github.com/bitpay/cordova-plugin-qrscanner/commit/ac91b82))
* **browser:** initial release of browser platform ([2288539](https://github.com/bitpay/cordova-plugin-qrscanner/commit/2288539))
* **ios:** support older iPods (without a back camera) ([f211f90](https://github.com/bitpay/cordova-plugin-qrscanner/commit/f211f90))

### Breaking Changes:

* `status.webviewBackgroundIsTransparent` has been renamed to `status.showing`



<a name="1.1.0"></a>
# [1.1.0](https://github.com/bitpay/cordova-plugin-qrscanner/compare/v1.0.1...v1.1.0) (2016-04-05)

### Features

* **ios**: add support for WKWebView ([953c971](https://github.com/bitpay/cordova-plugin-qrscanner/commit/953c971))



<a name="1.0.1"></a>
## [1.0.1](https://github.com/bitpay/cordova-plugin-qrscanner/compare/v1.0.0...v1.0.1) (2016-02-23)

Improves installation documentation



<a name="1.0.0"></a>
# [1.0.0](https://github.com/bitpay/cordova-plugin-qrscanner/compare/0.1.0...v1.0.0) (2016-01-25)

Initial release
