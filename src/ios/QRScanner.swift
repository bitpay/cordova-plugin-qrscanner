import Foundation
import AVFoundation

@objc(QRScanner)
class QRScanner : CDVPlugin, AVCaptureMetadataOutputObjectsDelegate {

    var cameraView: UIView = UIView(frame: CGRect(x: 0, y: 0, width: UIScreen.mainScreen().bounds.width, height: UIScreen.mainScreen().bounds.height))
    var captureSession:AVCaptureSession?
    var captureVideoPreviewLayer:AVCaptureVideoPreviewLayer?
    var metaOutput: AVCaptureMetadataOutput?

    var currentCamera: Int = 0;
    var frontCamera: AVCaptureDevice?
    var backCamera: AVCaptureDevice?

    var scanning: Bool = false
    var nextScanningCallback: String?

    enum CaptureError: ErrorType {
        case backCameraUnavailable
        case frontCameraUnavailable
        case couldNotCaptureInput(error: NSError)
    }

    enum LightError: ErrorType {
        case torchUnavailable
    }

    func sendError(command: CDVInvokedUrlCommand, message: String){
        let pluginResult = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAsString: message)
        commandDelegate!.sendPluginResult(pluginResult, callbackId:command.callbackId)
    }

    func prepScanner(command: CDVInvokedUrlCommand) -> Bool{
        do {
            if (captureSession?.running != true){
                cameraView.backgroundColor = UIColor.blackColor()
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
            self.sendError(command, message: "Could not prepare QRScanner: the back camera is unavailable.")
        } catch CaptureError.frontCameraUnavailable {
            self.sendError(command, message: "Could not prepare QRScanner: the front camera is unavailable.")
        } catch CaptureError.couldNotCaptureInput(let error){
            self.sendError(command, message: error.localizedDescription)
        } catch {
            self.sendError(command, message: "QRScanner experienced an unexpected error while trying to prepare.")
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
            commandDelegate!.sendPluginResult(pluginResult, callbackId: nextScanningCallback!)
        }
    }

    // ---- BEGIN EXTERNAL API ----

    func prepare(command: CDVInvokedUrlCommand){
        let status = AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeVideo)
        if status == AVAuthorizationStatus.NotDetermined {
            // Request permission before preparing scanner
            AVCaptureDevice.requestAccessForMediaType(AVMediaTypeVideo, completionHandler: { (granted) -> Void in
                if(self.prepScanner(command)){
                    self.getStatus(command)
                }
            })
        } else {
            if(self.prepScanner(command)){
                self.getStatus(command)
            }
        }
    }

    func scan(command: CDVInvokedUrlCommand){
        if(self.prepScanner(command)){
            nextScanningCallback = command.callbackId
            scanning = true
        }
    }

    func cancelScan(command: CDVInvokedUrlCommand){
        if(self.prepScanner(command)){
            scanning = false
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
        if(self.prepScanner(command) && currentCamera != index){
            // switch camera source
            do {
                captureSession!.beginConfiguration()
                let currentInput = captureSession?.inputs[0] as! AVCaptureDeviceInput
                captureSession!.removeInput(currentInput)
                let input = try self.createCaptureDeviceInput()
                captureSession!.addInput(input)
                captureSession!.commitConfiguration()
                self.getStatus(command)
            } catch CaptureError.backCameraUnavailable {
                self.sendError(command, message: "Could not QRScanner.useCamera: the back camera is unavailable.")
            } catch CaptureError.frontCameraUnavailable {
                self.sendError(command, message: "Could not QRScanner.useCamera: the front camera is unavailable.")
            } catch CaptureError.couldNotCaptureInput(let error){
                self.sendError(command, message: error.localizedDescription)
            } catch {
                self.sendError(command, message: "QRScanner experienced an unexpected error while trying to useCamera.")
            }
        }
    }

    func enableLight(command: CDVInvokedUrlCommand) {
        if(prepScanner(command)){
            do {
                if(backCamera!.hasTorch == false || backCamera!.torchAvailable == false || backCamera!.isTorchModeSupported(AVCaptureTorchMode.On) == false){
                    throw LightError.torchUnavailable
                }
                try backCamera!.lockForConfiguration()
                backCamera!.torchMode = AVCaptureTorchMode.On
                backCamera!.unlockForConfiguration()
                self.getStatus(command)
            } catch LightError.torchUnavailable {
                self.sendError(command, message: "Could not enable light: device torch is unavailable.")
            } catch let error as NSError {
                self.sendError(command, message: error.localizedDescription)
            }
        }
    }

    func disableLight(command: CDVInvokedUrlCommand) {
        if(prepScanner(command)){
            do {
                if(backCamera!.hasTorch == false || backCamera!.torchAvailable == false || backCamera!.isTorchModeSupported(AVCaptureTorchMode.Off) == false){
                    throw LightError.torchUnavailable
                }
                try backCamera!.lockForConfiguration()
                backCamera!.torchMode = AVCaptureTorchMode.Off
                backCamera!.unlockForConfiguration()
                self.getStatus(command)
            } catch LightError.torchUnavailable {
                self.sendError(command, message: "Could not disable light: device torch is unavailable.")
            } catch let error as NSError {
                self.sendError(command, message: error.localizedDescription)
            }
        }
    }

    func destroy(command: CDVInvokedUrlCommand) {
        self.makeOpaque()
        if(captureSession != nil){
            captureSession!.stopRunning()
            captureVideoPreviewLayer!.removeFromSuperlayer()
            captureVideoPreviewLayer = nil
            metaOutput = nil
            captureSession = nil
            currentCamera = 0
            frontCamera = nil
            backCamera = nil
        }
        let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAsString: "QRScanner destroyed.")
        commandDelegate!.sendPluginResult(pluginResult, callbackId:command.callbackId)
    }

    func getStatus(command: CDVInvokedUrlCommand){
        var authorized = false
        if(AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeVideo) == AVAuthorizationStatus.Authorized){
            authorized = true
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
            let pluginResult = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAsString: "QRScanner.openSettings() is not supported on this version of iOS (requires >iOS 8.0).")
            commandDelegate!.sendPluginResult(pluginResult, callbackId:command.callbackId)
        }
    }
}
