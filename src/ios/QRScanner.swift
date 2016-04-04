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

    enum CaptureError: ErrorType {
        case backCameraUnavailable
        case frontCameraUnavailable
        case couldNotCaptureInput(error: NSError)
    }

    enum LightError: ErrorType {
        case torchUnavailable
    }

    override func pluginInitialize() {
      super.pluginInitialize()
      NSNotificationCenter.defaultCenter().addObserver(self, selector: #selector(pageDidLoad), name: CDVPageDidLoadNotification, object: nil)
      self.cameraView = UIView(frame: CGRect(x: 0, y: 0, width: UIScreen.mainScreen().bounds.width, height: UIScreen.mainScreen().bounds.height))
    }

    func sendErrorCode(command: CDVInvokedUrlCommand, error: QRScannerError){
        let pluginResult = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAsInt: error.rawValue)
        commandDelegate!.sendPluginResult(pluginResult, callbackId:command.callbackId)
    }

    // utility method
    func backgroundThread(delay: Double = 0.0, background: (() -> Void)? = nil, completion: (() -> Void)? = nil) {
        if #available(iOS 8.0, *) {
            dispatch_async(dispatch_get_global_queue(Int(QOS_CLASS_USER_INITIATED.rawValue), 0)) {
                if(background != nil){
                    background!()
                }
                let popTime = dispatch_time(DISPATCH_TIME_NOW, Int64(delay * Double(NSEC_PER_SEC)))
                dispatch_after(popTime, dispatch_get_main_queue()) {
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
        let status = AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeVideo)
        if (status == AVAuthorizationStatus.Restricted) {
            self.sendErrorCode(command, error: QRScannerError.CAMERA_ACCESS_RESTRICTED)
            return false
        } else if status == AVAuthorizationStatus.Denied {
            self.sendErrorCode(command, error: QRScannerError.CAMERA_ACCESS_DENIED)
            return false
        }
        do {
            if (captureSession?.running != true){
                cameraView.backgroundColor = UIColor.whiteColor()
                self.webView!.superview!.insertSubview(cameraView, belowSubview: self.webView!)
                let availableVideoDevices = AVCaptureDevice.devicesWithMediaType(AVMediaTypeVideo)
                for device in availableVideoDevices as! [AVCaptureDevice] {
                    if device.position == AVCaptureDevicePosition.Back {
                        backCamera = device
                    }
                    else if device.position == AVCaptureDevicePosition.Front {
                        frontCamera = device
                    }
                }
                let input: AVCaptureDeviceInput
                input = try self.createCaptureDeviceInput()
                captureSession = AVCaptureSession()
                captureSession!.addInput(input)
                metaOutput = AVCaptureMetadataOutput()
                captureSession!.addOutput(metaOutput)
                metaOutput!.setMetadataObjectsDelegate(self, queue: dispatch_get_main_queue())
                metaOutput!.metadataObjectTypes = [AVMetadataObjectTypeQRCode]
                captureVideoPreviewLayer = AVCaptureVideoPreviewLayer(session: captureSession)
                captureVideoPreviewLayer!.videoGravity = AVLayerVideoGravityResizeAspectFill
                captureVideoPreviewLayer!.frame = cameraView.bounds
                cameraView.layer.addSublayer(captureVideoPreviewLayer!)
                captureSession!.startRunning()
            }
            return true
        } catch CaptureError.backCameraUnavailable {
            self.sendErrorCode(command, error: QRScannerError.BACK_CAMERA_UNAVAILABLE)
        } catch CaptureError.frontCameraUnavailable {
            self.sendErrorCode(command, error: QRScannerError.FRONT_CAMERA_UNAVAILABLE)
        } catch CaptureError.couldNotCaptureInput(let error){
            print(error.localizedDescription)
            self.sendErrorCode(command, error: QRScannerError.CAMERA_UNAVAILABLE)
        } catch {
            self.sendErrorCode(command, error: QRScannerError.UNEXPECTED_ERROR)
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
        self.webView?.opaque = true
        self.webView?.backgroundColor = UIColor.whiteColor()
    }

    func boolToNumberString(bool: Bool) -> String{
        if(bool) {
            return "1"
        } else {
            return "0"
        }
    }

    func configureLight(command: CDVInvokedUrlCommand, state: Bool){
        var useMode = AVCaptureTorchMode.On
        if(state == false){
            useMode = AVCaptureTorchMode.Off
        }
        do {
            if(backCamera!.hasTorch == false || backCamera!.torchAvailable == false || backCamera!.isTorchModeSupported(useMode) == false){
                throw LightError.torchUnavailable
            }
            try backCamera!.lockForConfiguration()
            backCamera!.torchMode = useMode
            backCamera!.unlockForConfiguration()
            self.getStatus(command)
        } catch LightError.torchUnavailable {
            self.sendErrorCode(command, error: QRScannerError.LIGHT_UNAVAILABLE)
        } catch let error as NSError {
            print(error.localizedDescription)
            self.sendErrorCode(command, error: QRScannerError.UNEXPECTED_ERROR)
        }
    }

    // This method processes metadataObjects captured by iOS.

    func captureOutput(captureOutput: AVCaptureOutput!, didOutputMetadataObjects metadataObjects: [AnyObject]!, fromConnection connection: AVCaptureConnection!) {
        if metadataObjects == nil || metadataObjects.count == 0 || scanning == false {
            // while nothing is detected, or if scanning is false, do nothing.
            return
        }
        let found = metadataObjects[0] as! AVMetadataMachineReadableCodeObject
        if found.type == AVMetadataObjectTypeQRCode && found.stringValue != nil {
            scanning = false
            let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAsString: found.stringValue)
            commandDelegate!.sendPluginResult(pluginResult, callbackId: nextScanningCommand?.callbackId!)
            nextScanningCommand = nil
        }
    }

    func pageDidLoad() {
      self.webView?.opaque = false
      self.webView?.backgroundColor = UIColor.clearColor()
    }

    // ---- BEGIN EXTERNAL API ----

    func prepare(command: CDVInvokedUrlCommand){
        let status = AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeVideo)
        if (status == AVAuthorizationStatus.NotDetermined) {
            // Request permission before preparing scanner
            AVCaptureDevice.requestAccessForMediaType(AVMediaTypeVideo, completionHandler: { (granted) -> Void in
                // attempt to prepScanner only after the request returns
                self.backgroundThread(0, completion: {
                    if(self.prepScanner(command)){
                        self.getStatus(command)
                    }
                })
            })
        } else {
            if(self.prepScanner(command)){
                self.getStatus(command)
            }
        }
    }

    func scan(command: CDVInvokedUrlCommand){
        if(self.prepScanner(command)){
            nextScanningCommand = command
            scanning = true
        }
    }

    func cancelScan(command: CDVInvokedUrlCommand){
        if(self.prepScanner(command)){
            scanning = false
            if(nextScanningCommand != nil){
                self.sendErrorCode(nextScanningCommand!, error: QRScannerError.SCAN_CANCELED)
            }
            self.getStatus(command)
        }
    }

    func show(command: CDVInvokedUrlCommand) {
        self.webView?.opaque = false
        self.webView?.backgroundColor = UIColor.clearColor()
        self.getStatus(command)
    }

    func hide(command: CDVInvokedUrlCommand) {
        self.makeOpaque()
        self.getStatus(command)
    }

    func pausePreview(command: CDVInvokedUrlCommand) {
        captureVideoPreviewLayer?.connection.enabled = false
        self.getStatus(command)
    }

    func resumePreview(command: CDVInvokedUrlCommand) {
        captureVideoPreviewLayer?.connection.enabled = true
        self.getStatus(command)
    }

    // backCamera is 0, frontCamera is 1

    func useCamera(command: CDVInvokedUrlCommand){
        let index = command.arguments[0] as! Int
        if(currentCamera != index){
            // switch camera
            currentCamera = index
            if(self.prepScanner(command)){
                do {
                    captureSession!.beginConfiguration()
                    let currentInput = captureSession?.inputs[0] as! AVCaptureDeviceInput
                    captureSession!.removeInput(currentInput)
                    let input = try self.createCaptureDeviceInput()
                    captureSession!.addInput(input)
                    captureSession!.commitConfiguration()
                    self.getStatus(command)
                } catch CaptureError.backCameraUnavailable {
                    self.sendErrorCode(command, error: QRScannerError.BACK_CAMERA_UNAVAILABLE)
                } catch CaptureError.frontCameraUnavailable {
                    self.sendErrorCode(command, error: QRScannerError.FRONT_CAMERA_UNAVAILABLE)
                } catch CaptureError.couldNotCaptureInput(let error){
                    print(error.localizedDescription)
                    self.sendErrorCode(command, error: QRScannerError.CAMERA_UNAVAILABLE)
                } catch {
                    self.sendErrorCode(command, error: QRScannerError.UNEXPECTED_ERROR)
                }
            }
        } else {
            // immediately return status if camera is unchanged
            self.getStatus(command)
        }
    }

    func enableLight(command: CDVInvokedUrlCommand) {
        if(self.prepScanner(command)){
            self.configureLight(command, state: true)
        }
    }

    func disableLight(command: CDVInvokedUrlCommand) {
        if(self.prepScanner(command)){
            self.configureLight(command, state: false)
        }
    }

    func destroy(command: CDVInvokedUrlCommand) {
        self.makeOpaque()
        if(self.captureSession != nil){
        backgroundThread(0, background: {
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

    func getStatus(command: CDVInvokedUrlCommand){

        let authorizationStatus = AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeVideo);

        var authorized = false
        if(authorizationStatus == AVAuthorizationStatus.Authorized){
            authorized = true
        }

        var denied = false
        if(authorizationStatus == AVAuthorizationStatus.Denied){
            denied = true
        }

        var restricted = false
        if(authorizationStatus == AVAuthorizationStatus.Restricted){
            restricted = true
        }

        var prepared = false
        if(captureSession?.running == true){
            prepared = true
        }

        var previewing = false
        if(captureVideoPreviewLayer != nil){
            previewing = captureVideoPreviewLayer!.connection.enabled
        }

        var webviewBackgroundIsTransparent = false
        if(self.webView!.backgroundColor == UIColor.clearColor()){
            webviewBackgroundIsTransparent = true
        }

        var lightEnabled = false
        if(backCamera?.torchMode == AVCaptureTorchMode.On){
            lightEnabled = true
        }

        var canOpenSettings = false
        if #available(iOS 8.0, *) {
            canOpenSettings = true
        }

        var canEnableLight = false
        if(backCamera?.hasTorch == true && backCamera?.torchAvailable == true && backCamera?.isTorchModeSupported(AVCaptureTorchMode.On) == true){
            canEnableLight = true
        }

        let status = [
            "authorized": boolToNumberString(authorized),
            "denied": boolToNumberString(denied),
            "restricted": boolToNumberString(restricted),
            "prepared": boolToNumberString(prepared),
            "scanning": boolToNumberString(scanning),
            "previewing": boolToNumberString(previewing),
            "webviewBackgroundIsTransparent": boolToNumberString(webviewBackgroundIsTransparent),
            "lightEnabled": boolToNumberString(lightEnabled),
            "canOpenSettings": boolToNumberString(canOpenSettings),
            "canEnableLight": boolToNumberString(canEnableLight),
            "currentCamera": String(currentCamera)
        ]

        let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAsDictionary: status)
        commandDelegate!.sendPluginResult(pluginResult, callbackId:command.callbackId)
    }

    func openSettings(command: CDVInvokedUrlCommand) {
        if #available(iOS 8.0, *) {
            UIApplication.sharedApplication().openURL(NSURL(string: UIApplicationOpenSettingsURLString)!)
            self.getStatus(command)
        } else {
            self.sendErrorCode(command, error: QRScannerError.OPEN_SETTINGS_UNAVAILABLE)
        }
    }
}
