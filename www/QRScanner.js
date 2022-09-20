'use strict';

var QRScannerPlugin = (function () {

	var exec = require('cordova/exec');
	var pluginName = 'QRScanner';

	var QRScannerPlugin = {};
	var FRONT_CAMERA = 1;
	var BACK_CAMERA = 0;

	/**
	 * The native implementations should return their status as ['string':'string'] dictionaries.
	 * Boolean values are encoded to '0' and '1', respectively.
	 * @param string
	 * @return {boolean}
	 */
	function stringToBool(string) {
		switch (string) {
			case '1':
				return true;
			case '0':
				return false;
			default:
				throw new Error('QRScanner plugin returned an invalid boolean number-string: ' + string);
		}
	}

	/**
	 * Converts the returned ['string':'string'] dictionary to a status object.
	 * @param statusDictionary
	 * @return {{lightEnabled: boolean, canOpenSettings: boolean, currentCamera: number, restricted: boolean, prepared: boolean, scanning: boolean, authorized: boolean, canChangeCamera: boolean, denied: boolean, showing: boolean, canEnableLight: boolean, previewing: boolean}}
	 */
	function convertStatus(statusDictionary) {
		return {
			authorized: stringToBool(statusDictionary.authorized),
			denied: stringToBool(statusDictionary.denied),
			restricted: stringToBool(statusDictionary.restricted),
			prepared: stringToBool(statusDictionary.prepared),
			scanning: stringToBool(statusDictionary.scanning),
			previewing: stringToBool(statusDictionary.previewing),
			showing: stringToBool(statusDictionary.showing),
			lightEnabled: stringToBool(statusDictionary.lightEnabled),
			canOpenSettings: stringToBool(statusDictionary.canOpenSettings),
			canEnableLight: stringToBool(statusDictionary.canEnableLight),
			canChangeCamera: stringToBool(statusDictionary.canChangeCamera),
			currentCamera: parseInt(statusDictionary.currentCamera)
		};
	}

	function getErrorCode(error) {
		var errorCode = parseInt(error);
		var errorPrefix = 'QR_SCANNER_';
		switch (errorCode) {
			case 0:
				return errorPrefix + 'UNEXPECTED_ERROR';
			case 1:
				return errorPrefix + 'CAMERA_ACCESS_DENIED'
			case 2:
				return errorPrefix + 'CAMERA_ACCESS_RESTRICTED';
			case 3:
				return errorPrefix + 'BACK_CAMERA_UNAVAILABLE';
			case 4:
				return errorPrefix + 'FRONT_CAMERA_UNAVAILABLE';
			case 5:
				return errorPrefix + 'CAMERA_UNAVAILABLE';
			case 6:
				return errorPrefix + 'SCAN_CANCELED';
			case 7:
				return errorPrefix + 'LIGHT_UNAVAILABLE';
			case 8:
				return errorPrefix + 'OPEN_SETTINGS_UNAVAILABLE';
			default:
				return errorPrefix + 'UNEXPECTED_ERROR';
		}
	}

	/**
	 * Exended error callback with additional info
	 * @param callback
	 * @return {(function(*): void)|*}
	 */
	function errorCallbackExtended(callback) {
		return function (error) {
			callback(getErrorCode(error));
		};
	}

	/**
	 * Success callback with additional status data
	 * @param callback
	 * @return {function(*): *}
	 */
	function successCallbackExtended(callback) {
		return function (statusDict) {
			return callback(convertStatus(statusDict));
		};
	}

	QRScannerPlugin.prepare = function () {
		return new Promise(function (resolve, reject) {
			exec(successCallbackExtended(resolve), errorCallbackExtended(reject), pluginName, 'prepare', []);
		});
	};

	QRScannerPlugin.destroy = function () {
		return new Promise(function (resolve, reject) {
			exec(successCallbackExtended(resolve), errorCallbackExtended(reject), pluginName, 'destroy', []);
		});
	};
	QRScannerPlugin.scan = function () {
		return new Promise(function (resolve, reject) {
			exec(resolve, errorCallbackExtended(reject), pluginName, 'scan', []);
		});
	};
	QRScannerPlugin.cancelScan = function () {
		return new Promise(function (resolve, reject) {
			exec(successCallbackExtended(resolve), errorCallbackExtended(reject), pluginName, 'cancelScan', []);
		});
	};
	QRScannerPlugin.show = function () {
		return new Promise(function (resolve, reject) {
			exec(successCallbackExtended(resolve), errorCallbackExtended(reject), pluginName, 'show', []);
		});
	};
	QRScannerPlugin.hide = function () {
		return new Promise(function (resolve, reject) {
			exec(successCallbackExtended(resolve), errorCallbackExtended(reject), pluginName, 'hide', []);
		});
	};
	QRScannerPlugin.pausePreview = function () {
		return new Promise(function (resolve, reject) {
			exec(successCallbackExtended(resolve), errorCallbackExtended(reject), pluginName, 'pausePreview', []);
		});
	};
	QRScannerPlugin.resumePreview = function () {
		return new Promise(function (resolve, reject) {
			exec(successCallbackExtended(resolve), errorCallbackExtended(reject), pluginName, 'resumePreview', []);
		});
	};
	QRScannerPlugin.enableLight = function () {
		return new Promise(function (resolve, reject) {
			exec(successCallbackExtended(resolve), errorCallbackExtended(reject), pluginName, 'enableLight', []);
		});
	};
	QRScannerPlugin.disableLight = function () {
		return new Promise(function (resolve, reject) {
			exec(successCallbackExtended(resolve), errorCallbackExtended(reject), pluginName, 'disableLight', []);
		});
	};
	QRScannerPlugin.useCamera = function (index) {
		return new Promise(function (resolve, reject) {
			exec(successCallbackExtended(resolve), errorCallbackExtended(reject), pluginName, 'useCamera', [index]);
		});
	};
	QRScannerPlugin.useFrontCamera = function () {
		return this.useCamera(FRONT_CAMERA);
	};
	QRScannerPlugin.useBackCamera = function () {
		return this.useCamera(BACK_CAMERA);
	};
	QRScannerPlugin.openSettings = function () {
		return new Promise(function (resolve, reject) {
			exec(successCallbackExtended(resolve), errorCallbackExtended(reject), pluginName, 'openSettings', []);
		});
	};
	QRScannerPlugin.getStatus = function () {
		return new Promise(function (resolve, reject) {
			exec(successCallbackExtended(resolve), errorCallbackExtended(reject), pluginName, 'getStatus', []);
		});
	};

	return QRScannerPlugin;

});

module.exports = new QRScannerPlugin();
