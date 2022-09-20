interface Window {
	QRScanner: IQRScannerPlugin;
}

type QRScannerStatusError = 'QR_SCANNER_UNEXPECTED_ERROR' | 'QR_SCANNER_CAMERA_ACCESS_DENIED' | 'QR_SCANNER_CAMERA_ACCESS_RESTRICTED' | 'QR_SCANNER_BACK_CAMERA_UNAVAILABLE'
	| 'QR_SCANNER_FRONT_CAMERA_UNAVAILABLE' | 'QR_SCANNER_CAMERA_UNAVAILABLE' | 'QR_SCANNER_SCAN_CANCELED' | 'QR_SCANNER_LIGHT_UNAVAILABLE' | 'QR_SCANNER_OPEN_SETTINGS_UNAVAILABLE';

/**
 * 	FRONT_CAMERA = 1;
 * 	BACK_CAMERA = 0;
 */
type QRScannerCameraType = 0 | 1;

interface IQRScannerStatus {
	authorized: boolean;
	denied: boolean;
	restricted: boolean;
	prepared: boolean;
	scanning: boolean;
	previewing: boolean;
	showing: boolean;
	lightEnabled: boolean;
	canOpenSettings: boolean;
	canEnableLight: boolean;
	canChangeCamera: boolean;
	currentCamera: QRScannerCameraType;
}

interface IQRScannerPlugin {
	prepare(): Promise<IQRScannerStatus>;
	destroy(): Promise<IQRScannerStatus>;
	scan(): Promise<string>;
	cancelScan(): Promise<IQRScannerStatus>;
	show(): Promise<IQRScannerStatus>;
	hide(): Promise<IQRScannerStatus>;
	pausePreview(): Promise<IQRScannerStatus>;
	resumePreview(): Promise<IQRScannerStatus>;
	enableLight(): Promise<IQRScannerStatus>;
	disableLight(): Promise<IQRScannerStatus>;
	useCamera(cameraType: QRScannerCameraType): Promise<IQRScannerStatus>;
	useFrontCamera(): Promise<IQRScannerStatus>;
	useBackCamera(): Promise<IQRScannerStatus>;
	openSettings(): Promise<IQRScannerStatus>;
	getStatus(): Promise<IQRScannerStatus>;
}
