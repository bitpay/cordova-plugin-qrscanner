import Foundation
import AVFoundation

@objc(QRScanner)
class QRScanner : CDVPlugin, AVCaptureMetadataOutputObjectsDelegate {

    var cameraView: UIView!
    var captureSession:AVCaptureSession?
    var captureVideoPreviewLayer:AVCaptureVideoPreviewLayer?
    var metaOutput: AVCaptureMetadataOutput?

    var currentCamera: Int = 0;
    var frontCamera: AVCaptureDevice?
    var backCamera: AVCaptureDevice?

    var scanning: Bool = false
    var scanned: Bool = false
    var nextScanningCommand: CDVInvokedUrlCommand?

    enum QRScannerError: Int32 {
        case UNEXPECTED_ERROR = 0,
        CAMERA_ACCESS_DENIED = 1,
        CAMERA_ACCESS_RESTRICTED = 2,
        BACK_CAMERA_UNAVAILABLE = 3,
        FRONT_CAMERA_UNAVAILABLE = 4,
        CAMERA_UNAVAILABLE = 5,
        SCAN_CANCELED = 6,
        LIGHT_UNAVAILABLE = 7,
        OPEN_SETTINGS_UNAVAILABLE = 8
    }

    enum CaptureError: Error {
        case backCameraUnavailable
        case frontCameraUnavailable
        case couldNotCaptureInput(error: NSError)
    }

    enum LightError: Error {
        case torchUnavailable
    }

    override func pluginInitialize() {
        super.pluginInitialize()
        NotificationCenter.default.addObserver(self, selector: #selector(pageDidLoad), name: NSNotification.Name.CDVPageDidLoad, object: nil)
        self.cameraView = UIView(frame: CGRect(x: 0, y: 0, width: UIScreen.main.bounds.width, height: UIScreen.main.bounds.height))
    }

    func sendErrorCode(command: CDVInvokedUrlCommand, error: QRScannerError){
        let pluginResult = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: error.rawValue)
        commandDelegate!.send(pluginResult, callbackId:command.callbackId)
    }

    // utility method
    func backgroundThread(delay: Double = 0.0, background: (() -> Void)? = nil, completion: (() -> Void)? = nil) {
        if #available(iOS 8.0, *) {
            DispatchQueue.global(qos: DispatchQoS.QoSClass.userInitiated).async {
                if (background != nil) {
                    background!()
                }
                DispatchQueue.main.asyncAfter(deadline: DispatchTime.now() + delay * Double(NSEC_PER_SEC)) {
                    if(completion != nil){
                        completion!()
                    }
                }
            }
        } else {
            // Fallback for iOS < 8.0
            if(background != nil){
                background!()
            }
            if(completion != nil){
                completion!()
            }
        }
    }

    func prepScanner(command: CDVInvokedUrlCommand) -> Bool{
        let status = AVCaptureDevice.authorizationStatus(forMediaType: AVMediaTypeVideo)
        if (status == AVAuthorizationStatus.restricted) {
            self.sendErrorCode(command: command, error: QRScannerError.CAMERA_ACCESS_RESTRICTED)
            return false
        } else if status == AVAuthorizationStatus.denied {
            self.sendErrorCode(command: command, error: QRScannerError.CAMERA_ACCESS_DENIED)
            return false
        }
        do {
            if (captureSession?.isRunning != true){
                cameraView.backgroundColor = UIColor.white
                self.webView!.superview!.insertSubview(cameraView, belowSubview: self.webView!)
                let availableVideoDevices = AVCaptureDevice.devices(withMediaType: AVMediaTypeVideo)
                for device in availableVideoDevices as! [AVCaptureDevice] {
                    if device.position == AVCaptureDevicePosition.back {
                        backCamera = device
                    }
                    else if device.position == AVCaptureDevicePosition.front {
                        frontCamera = device
                    }
                }
                // older iPods have no back camera
                if(backCamera == nil){
                    currentCamera = 1
                }
                let input: AVCaptureDeviceInput
                input = try self.createCaptureDeviceInput()
                captureSession = AVCaptureSession()
                captureSession!.addInput(input)
                metaOutput = AVCaptureMetadataOutput()
                captureSession!.addOutput(metaOutput)
                metaOutput!.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
                metaOutput!.metadataObjectTypes = [AVMetadataObjectTypeQRCode]
                captureVideoPreviewLayer = AVCaptureVideoPreviewLayer(session: captureSession)
                captureVideoPreviewLayer!.videoGravity = AVLayerVideoGravityResizeAspectFill
                captureVideoPreviewLayer!.frame = cameraView.bounds
                cameraView.layer.addSublayer(captureVideoPreviewLayer!)
                captureSession!.startRunning()
            }
            return true
        } catch CaptureError.backCameraUnavailable {
            self.sendErrorCode(command: command, error: QRScannerError.BACK_CAMERA_UNAVAILABLE)
        } catch CaptureError.frontCameraUnavailable {
            self.sendErrorCode(command: command, error: QRScannerError.FRONT_CAMERA_UNAVAILABLE)
        } catch CaptureError.couldNotCaptureInput(let error){
            print(error.localizedDescription)
            self.sendErrorCode(command: command, error: QRScannerError.CAMERA_UNAVAILABLE)
        } catch {
            self.sendErrorCode(command: command, error: QRScannerError.UNEXPECTED_ERROR)
        }
        return false
    }

    func createCaptureDeviceInput() throws -> AVCaptureDeviceInput {
        var captureDevice: AVCaptureDevice
        if(currentCamera == 0){
            if(backCamera != nil){
                captureDevice = backCamera!
            } else {
                throw CaptureError.backCameraUnavailable
            }
        } else {
            if(frontCamera != nil){
                captureDevice = frontCamera!
            } else {
                throw CaptureError.frontCameraUnavailable
            }
        }
        let captureDeviceInput: AVCaptureDeviceInput
        do {
            captureDeviceInput = try AVCaptureDeviceInput(device: captureDevice)
        } catch let error as NSError {
            throw CaptureError.couldNotCaptureInput(error: error)
        }
        return captureDeviceInput
    }

    func makeOpaque(){
        self.webView?.isOpaque = true
        self.webView?.backgroundColor = UIColor.white
    }

    func boolToNumberString(bool: Bool) -> String{
        if(bool) {
            return "1"
        } else {
            return "0"
        }
    }

    func configureLight(command: CDVInvokedUrlCommand, state: Bool){
        var useMode = AVCaptureTorchMode.on
        if(state == false){
            useMode = AVCaptureTorchMode.off
        }
        do {
            // torch is only available for back camera
            if(backCamera == nil || backCamera!.hasTorch == false || backCamera!.isTorchAvailable == false || backCamera!.isTorchModeSupported(useMode) == false){
                throw LightError.torchUnavailable
            }
            try backCamera!.lockForConfiguration()
            backCamera!.torchMode = useMode
            backCamera!.unlockForConfiguration()
            self.getStatus(command)
        } catch LightError.torchUnavailable {
            self.sendErrorCode(command: command, error: QRScannerError.LIGHT_UNAVAILABLE)
        } catch let error as NSError {
            print(error.localizedDescription)
            self.sendErrorCode(command: command, error: QRScannerError.UNEXPECTED_ERROR)
        }
    }

    // This method processes metadataObjects captured by iOS.
    func captureOutput(_ captureOutput: AVCaptureOutput!, didOutputMetadataObjects metadataObjects: [Any]!, from connection: AVCaptureConnection!) {
        if metadataObjects == nil || metadataObjects.count == 0 || scanning == false {
            // while nothing is detected, or if scanning is false, do nothing.
            return
        }
        let found = metadataObjects[0] as! AVMetadataMachineReadableCodeObject
        if found.type == AVMetadataObjectTypeQRCode && found.stringValue != nil {
            scanning = false
            let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: found.stringValue)
            commandDelegate!.send(pluginResult, callbackId: nextScanningCommand?.callbackId!)
            nextScanningCommand = nil
        }
    }

    func pageDidLoad() {
      self.webView?.isOpaque = false
      self.webView?.backgroundColor = UIColor.clear
    }

    // ---- BEGIN EXTERNAL API ----

    func prepare(_ command: CDVInvokedUrlCommand){
        let status = AVCaptureDevice.authorizationStatus(forMediaType: AVMediaTypeVideo)
        if (status == AVAuthorizationStatus.notDetermined) {
            // Request permission before preparing scanner
            AVCaptureDevice.requestAccess(forMediaType: AVMediaTypeVideo, completionHandler: { (granted) -> Void in
                // attempt to prepScanner only after the request returns
                self.backgroundThread(delay: 0, completion: {
                    if(self.prepScanner(command: command)){
                        self.getStatus(command)
                    }
                })
            })
        } else {
            if(self.prepScanner(command: command)){
                self.getStatus(command)
            }
        }
    }

    func scan(_ command: CDVInvokedUrlCommand){
        if(self.prepScanner(command: command)){
            nextScanningCommand = command
            scanned = false
            scanning = true
        }
    }

    func cancelScan(_ command: CDVInvokedUrlCommand){
        if(self.prepScanner(command: command)){
            scanning = false
            scanned = false
            if(nextScanningCommand != nil){
                self.sendErrorCode(command: nextScanningCommand!, error: QRScannerError.SCAN_CANCELED)
            }
            self.getStatus(command)
        }
    }

    func show(_ command: CDVInvokedUrlCommand) {
        self.webView?.isOpaque = false
        self.webView?.backgroundColor = UIColor.clear
        self.getStatus(command)
    }

    func hide(_ command: CDVInvokedUrlCommand) {
        self.makeOpaque()
        self.getStatus(command)
    }

    func pausePreview(_ command: CDVInvokedUrlCommand) {
        captureVideoPreviewLayer?.connection.isEnabled = false
        self.getStatus(command)
    }

    func resumePreview(_ command: CDVInvokedUrlCommand) {
        captureVideoPreviewLayer?.connection.isEnabled = true
        self.getStatus(command)
    }

    // backCamera is 0, frontCamera is 1

    func useCamera(_ command: CDVInvokedUrlCommand){
        let index = command.arguments[0] as! Int
        if(currentCamera != index){
            // camera change only available if both backCamera and frontCamera exist
            if(backCamera != nil && frontCamera != nil){
                // switch camera
                currentCamera = index
                if(self.prepScanner(command: command)){
                    do {
                        captureSession!.beginConfiguration()
                        let currentInput = captureSession?.inputs[0] as! AVCaptureDeviceInput
                        captureSession!.removeInput(currentInput)
                        let input = try self.createCaptureDeviceInput()
                        captureSession!.addInput(input)
                        captureSession!.commitConfiguration()
                        self.getStatus(command)
                    } catch CaptureError.backCameraUnavailable {
                        self.sendErrorCode(command: command, error: QRScannerError.BACK_CAMERA_UNAVAILABLE)
                    } catch CaptureError.frontCameraUnavailable {
                        self.sendErrorCode(command: command, error: QRScannerError.FRONT_CAMERA_UNAVAILABLE)
                    } catch CaptureError.couldNotCaptureInput(let error){
                        print(error.localizedDescription)
                        self.sendErrorCode(command: command, error: QRScannerError.CAMERA_UNAVAILABLE)
                    } catch {
                        self.sendErrorCode(command: command, error: QRScannerError.UNEXPECTED_ERROR)
                    }

                }
            } else {
                if(backCamera == nil){
                    self.sendErrorCode(command: command, error: QRScannerError.BACK_CAMERA_UNAVAILABLE)
                } else {
                    self.sendErrorCode(command: command, error: QRScannerError.FRONT_CAMERA_UNAVAILABLE)
                }
            }
        } else {
            // immediately return status if camera is unchanged
            self.getStatus(command)
        }
    }

    func enableLight(_ command: CDVInvokedUrlCommand) {
        if(self.prepScanner(command: command)){
            self.configureLight(command: command, state: true)
        }
    }

    func disableLight(_ command: CDVInvokedUrlCommand) {
        if(self.prepScanner(command: command)){
            self.configureLight(command: command, state: false)
        }
    }

    func destroy(_ command: CDVInvokedUrlCommand) {
        self.makeOpaque()
        if(self.captureSession != nil){
        backgroundThread(delay: 0, background: {
            self.captureSession!.stopRunning()
            self.captureVideoPreviewLayer!.removeFromSuperlayer()
            self.captureVideoPreviewLayer = nil
            self.metaOutput = nil
            self.captureSession = nil
            self.currentCamera = 0
            self.frontCamera = nil
            self.backCamera = nil
            }, completion: {
                self.getStatus(command)
            })
        } else {
            self.getStatus(command)
        }
    }

    func getStatus(_ command: CDVInvokedUrlCommand){

        let authorizationStatus = AVCaptureDevice.authorizationStatus(forMediaType: AVMediaTypeVideo);

        var authorized = false
        if(authorizationStatus == AVAuthorizationStatus.authorized){
            authorized = true
        }

        var denied = false
        if(authorizationStatus == AVAuthorizationStatus.denied){
            denied = true
        }

        var restricted = false
        if(authorizationStatus == AVAuthorizationStatus.restricted){
            restricted = true
        }

        var prepared = false
        if(captureSession?.isRunning == true){
            prepared = true
        }

        var previewing = false
        if(captureVideoPreviewLayer != nil){
            previewing = captureVideoPreviewLayer!.connection.isEnabled
        }

        var showing = false
        if(self.webView!.backgroundColor == UIColor.clear){
            showing = true
        }

        var lightEnabled = false
        if(backCamera?.torchMode == AVCaptureTorchMode.on){
            lightEnabled = true
        }

        var canOpenSettings = false
        if #available(iOS 8.0, *) {
            canOpenSettings = true
        }

        var canEnableLight = false
        if(backCamera?.hasTorch == true && backCamera?.isTorchAvailable == true && backCamera?.isTorchModeSupported(AVCaptureTorchMode.on) == true){
            canEnableLight = true
        }

        var canChangeCamera = false;
        if(backCamera != nil && frontCamera != nil){
            canChangeCamera = true
        }

        let status = [
            "authorized": boolToNumberString(bool: authorized),
            "denied": boolToNumberString(bool: denied),
            "restricted": boolToNumberString(bool: restricted),
            "prepared": boolToNumberString(bool: prepared),
            "scanning": boolToNumberString(bool: scanning),
            "previewing": boolToNumberString(bool: previewing),
            "showing": boolToNumberString(bool: showing),
            "lightEnabled": boolToNumberString(bool: lightEnabled),
            "canOpenSettings": boolToNumberString(bool: canOpenSettings),
            "canEnableLight": boolToNumberString(bool: canEnableLight),
            "canChangeCamera": boolToNumberString(bool: canChangeCamera),
            "currentCamera": String(currentCamera)
        ]

        let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: status)
        commandDelegate!.send(pluginResult, callbackId:command.callbackId)
    }

    func openSettings(command: CDVInvokedUrlCommand) {
        if #available(iOS 8.0, *) {
            UIApplication.shared.openURL(NSURL(string: UIApplicationOpenSettingsURLString)! as URL)
            self.getStatus(command)
        } else {
            self.sendErrorCode(command: command, error: QRScannerError.OPEN_SETTINGS_UNAVAILABLE)
        }
    }
}
