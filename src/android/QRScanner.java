package com.bitpay.cordova.qrscanner;

import android.Manifest;
import android.content.Intent;
import android.content.pm.FeatureInfo;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.SurfaceTexture;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraDevice;
import android.net.Uri;
import android.os.Build;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PermissionHelper;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import android.hardware.Camera;
import android.provider.Settings;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import java.io.IOException;
import java.util.HashMap;



@SuppressWarnings("deprecation")

public class QRScanner extends CordovaPlugin {

    private CallbackContext callbackContext;
    private boolean cameraClosing;
    private static Boolean flashAvailable;
    private boolean lightOn = false;
    private boolean showing = false;
    private boolean prepared = false;
    private int currentCameraId = Camera.CameraInfo.CAMERA_FACING_BACK;
    private String[] permissions = {Manifest.permission.CAMERA};
    private Camera mCamera;
    private static int cameraInUse = 0;
    //Preview started or paused
    private boolean previewing = true;
    private CameraPreview mPreview;
    private boolean switchFlashOn;
    private boolean cameraPreviewing;
    static class QRScannerError {
        private static final int UNEXPECTED_ERROR = 0,
                CAMERA_ACCESS_DENIED = 1,
                CAMERA_ACCESS_RESTRICTED = 2,
                BACK_CAMERA_UNAVAILABLE = 3,
                FRONT_CAMERA_UNAVAILABLE = 4,
                CAMERA_UNAVAILABLE = 5,
                SCAN_CANCELED = 6,
                LIGHT_UNAVAILABLE = 7,
                OPEN_SETTINGS_UNAVAILABLE = 8;
    }

    @Override
    public boolean execute(final String action, final JSONArray args, final CallbackContext callbackContext) throws JSONException {
        this.callbackContext = callbackContext;
        try {
            if (action.equals("show")) {
                cordova.getThreadPool().execute(new Runnable() {
                    public void run() {
                        show(callbackContext);
                    }
                });
                return true;
            }
            else if(action.equals("openSettings")) {
                cordova.getThreadPool().execute(new Runnable() {
                    public void run() {
                        openSettings(callbackContext);
                    }
                });
                return true;
            } else if(action.equals("pausePreview")) {
                cordova.getThreadPool().execute(new Runnable() {
                    public void run() {
                        pausePreview(callbackContext);
                    }
                });
                return true;
            } else if(action.equals("useCamera")) {
                cordova.getThreadPool().execute(new Runnable() {
                    public void run() {
                        switchCamera(callbackContext, args);
                    }
                });
                return true;
            } else if(action.equals("resumePreview")) {
                cordova.getThreadPool().execute(new Runnable() {
                    public void run() {
                        resumePreview(callbackContext);
                    }
                });
                return true;
            } else if(action.equals("hide")) {
                cordova.getThreadPool().execute(new Runnable() {
                    public void run() {
                        hide(callbackContext);
                    }
                });
                return true;
            } else if (action.equals("enableLight")) {
                cordova.getThreadPool().execute(new Runnable() {
                    public void run() {
                        while (cameraClosing) {
                            try {
                                Thread.sleep(10);
                            } catch (InterruptedException ignore) {}
                        }
                        if(!hasPermission()) {
                            switchFlashOn = true;
                            requestPermission(33);
                        }
                        else
                            enableLight(callbackContext);
                    }
                });
                return true;
            } else if (action.equals("disableLight")) {
                cordova.getThreadPool().execute(new Runnable() {
                    public void run() {
                        disableLight(callbackContext);
                    }
                });
                return true;
            } else if (action.equals("prepare")) {
                cordova.getThreadPool().execute(new Runnable() {
                    public void run() {
                        cordova.getActivity().runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                try {
                                    cameraInUse = args.getInt(0);
                                } catch (JSONException e) {
                                }
                                prepare(callbackContext);
                            }
                        });
                    }
                });
                return true;

            } else if (action.equals("destroy")) {
                cordova.getThreadPool().execute(new Runnable() {
                    public void run() {
                        destroy(callbackContext);
                    }
                });
                return true;
            } else if (action.equals("getStatus")) {
                cordova.getThreadPool().execute(new Runnable() {
                    public void run() {
                        getStatus(callbackContext);
                    }
                });
                return true;
            }else {
                return false;
            }
        } catch (Exception e) {
            callbackContext.error(QRScannerError.UNEXPECTED_ERROR);
            return false;
        }
    }
    //do on pause thingy
    //fix black screen flash on older devices translucent or making invisible window on load
    private boolean hasFlash() {
        if (flashAvailable == null) {
            flashAvailable = false;
            final PackageManager packageManager = this.cordova.getActivity().getPackageManager();
            for (final FeatureInfo feature : packageManager.getSystemAvailableFeatures()) {
                if (PackageManager.FEATURE_CAMERA_FLASH.equalsIgnoreCase(feature.name)) {
                    flashAvailable = true;
                    break;
                }
            }
        }
        return flashAvailable;
    }
    private int findFrontFacingCamera() {
        // Search for the front facing camera
        int numberOfCameras = Camera.getNumberOfCameras();
        int cameraId = 0;
        for (int i = 0; i < numberOfCameras; i++) {
            Camera.CameraInfo info = new Camera.CameraInfo();
            Camera.getCameraInfo(i, info);
            if (info.facing == Camera.CameraInfo.CAMERA_FACING_FRONT) {
                cameraId = i;
                break;
            }
        }
        return cameraId;
    }
    private void switchFlash(boolean toggleLight, CallbackContext callbackContext) {
        try {
            if (hasFlash()) {
                doswitchFlash(toggleLight, callbackContext);
            } else {
                callbackContext.error(QRScannerError.LIGHT_UNAVAILABLE);
            }
        } catch (Exception e) {
            lightOn = false;
            callbackContext.error(QRScannerError.LIGHT_UNAVAILABLE);
        }
    }
    private String boolToNumberString(Boolean bool) {
        if(bool)
            return "1";
        else
            return "0";
    }
    private void doswitchFlash(boolean toggleLight, CallbackContext callbackContext) throws IOException, CameraAccessException {
        if (mCamera == null) {
            mCamera = Camera.open();
            if (Build.VERSION.SDK_INT >= 11) {
                mCamera.setPreviewTexture(new SurfaceTexture(0));
            }
        }
        final Camera.Parameters mParameters = mCamera.getParameters();
        if(toggleLight) {
            mParameters.setFlashMode(Camera.Parameters.FLASH_MODE_TORCH);
            lightOn = true;
        }
        else {
            mParameters.setFlashMode(Camera.Parameters.FLASH_MODE_OFF);
            lightOn = false;
        }
        mCamera.setParameters(mParameters);
        mCamera.startPreview();
        getStatus(callbackContext);

    }
    public static int getCurrentCameraId() {
        return cameraInUse;
    }
    private boolean canChangeCamera() {
        int numCameras= Camera.getNumberOfCameras();
        for(int i=0;i<numCameras;i++){
            Camera.CameraInfo info = new Camera.CameraInfo();
            Camera.getCameraInfo(i, info);
            if(info.CAMERA_FACING_FRONT == info.facing){
                return true;
            }
        }
        return false;
    }
    public void switchCamera(CallbackContext callbackContext, JSONArray args) {

        int cameraId = 0;

        try {
            cameraId = args.getInt(0);
            cameraInUse = args.getInt(0);
        } catch (JSONException d) {
            callbackContext.error(QRScannerError.UNEXPECTED_ERROR);
        }

        currentCameraId = cameraId;

        prepare(callbackContext);

    }
    public void onRequestPermissionResult(int requestCode, String[] permissions,
                                          int[] grantResults) throws JSONException {
        for (int r : grantResults) {
            if (r == PackageManager.PERMISSION_DENIED) {
                callbackContext.error(QRScannerError.CAMERA_ACCESS_DENIED);
                return;
            }
        }

        switch (requestCode) {
            case 33:
                if(switchFlashOn)
                    switchFlash(true, callbackContext);
                else setupCamera(callbackContext);
                break;
        }
    }
    public boolean hasPermission() {
        for(String p : permissions)
        {
            if(!PermissionHelper.hasPermission(this, p))
            {
                return false;
            }
        }
        return true;
    }
    private void requestPermission(int requestCode) {
        PermissionHelper.requestPermissions(this, requestCode, permissions);
    }
    private void closeCamera() {
        cameraClosing = true;
        new Thread(new Runnable() {
            public void run() {
                if (mCamera != null) {
                    mCamera.stopPreview();
                    mCamera.setPreviewCallback(null);
                    mCamera.unlock();
                    mCamera.release();
                    mCamera = null;
                }
                cameraClosing = false;
            }
        }).start();
    }
    private void makeOpaque() {
        this.cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                webView.getView().setBackgroundColor(Color.WHITE);
            }
        });
        showing = false;
    }
    // Check if this device has a camera
    private boolean hasCamera() {
        if (this.cordova.getActivity().getPackageManager().hasSystemFeature(PackageManager.FEATURE_CAMERA_ANY)){
            return true;
        } else {
            return false;
        }
    }
    /** A safe way to get an instance of the Camera object. */
    public static Camera getCameraInstance(int id){
        Camera c = null;
        try {
            c = Camera.open(id); // attempt to get a Camera instance
        }
        catch (Exception e){
            // Camera is not available (in use or does not exist)
        }
        return c; // returns null if camera is unavailable
    }
    private void scan() {

    }
    private void setupCamera(CallbackContext callbackContext) {
        // Create an instance of Camera
        if(cameraInUse == 1) {
            mCamera = getCameraInstance(findFrontFacingCamera());
            lightOn = false;
        }
        else
            mCamera = getCameraInstance(Camera.CameraInfo.CAMERA_FACING_BACK);

        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                // Create our Preview view and set it as the content of our activity.
                if (mCamera != null) {
                    mPreview = new CameraPreview(cordova.getActivity(), mCamera);

                    FrameLayout.LayoutParams cameraPreviewParams = new FrameLayout.LayoutParams(FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT);

                    ((ViewGroup) webView.getView().getParent()).addView(mPreview, cameraPreviewParams);

                    cameraPreviewing = true;
                    webView.getView().bringToFront();
                }
            }
        });
        prepared = true;
        getStatus(callbackContext);
    }
    // ---- BEGIN EXTERNAL API ----
    private void prepare(final CallbackContext callbackContext) {
        if(!prepared) {
            if (hasCamera()) {
                if (!hasPermission()) {
                    requestPermission(33);
                } else {
                    setupCamera(callbackContext);
                }
            }
        } else {
            prepared = false;
            mCamera.release();
            if(cameraPreviewing) {
                this.cordova.getActivity().runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        ((ViewGroup) mPreview.getParent()).removeView(mPreview);
                        cameraPreviewing = false;
                    }
                });
                previewing = true;
            }
            setupCamera(callbackContext);
        }
    }
    private void show(final CallbackContext callbackContext) {
        this.cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                webView.getView().setBackgroundColor(Color.argb(1, 0, 0, 0));
                showing = true;
                getStatus(callbackContext);
            }
        });
    }
    private void hide(final CallbackContext callbackContext) {
        makeOpaque();
        getStatus(callbackContext);
    }
    private void pausePreview(final CallbackContext callbackContext) {
        if(mCamera != null) {
            mCamera.stopPreview();
            previewing = false;
        }
        getStatus(callbackContext);
    }
    private void resumePreview(final CallbackContext callbackContext) {
        if(mCamera != null) {
            mCamera.startPreview();
            previewing = true;
        }
        getStatus(callbackContext);
    }
    private void enableLight(CallbackContext callbackContext) {
        if(hasPermission())
            switchFlash(true, callbackContext);
        else callbackContext.error(QRScannerError.CAMERA_ACCESS_DENIED);
    }
    private void disableLight(CallbackContext callbackContext) {
        if(hasPermission())
            switchFlash(false, callbackContext);
        else callbackContext.error(QRScannerError.CAMERA_ACCESS_DENIED);
    }
    private void useCamera(CallbackContext callbackContext, JSONArray args) {
        switchCamera(callbackContext, args);
        getStatus(callbackContext);
    }
    private void openSettings(CallbackContext callbackContext) {
        Intent intent = new Intent();
        intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        Uri uri = Uri.fromParts("package", this.cordova.getActivity().getPackageName(), null);
        intent.setData(uri);
        this.cordova.getActivity().getApplicationContext().startActivity(intent);
        getStatus(callbackContext);
    }
    private void getStatus(CallbackContext callbackContext) {

        boolean authorizationStatus = hasPermission();

        boolean authorized = false;
        if(authorizationStatus)
            authorized = true;

        boolean denied = false;
        if(!authorizationStatus)
            denied = true;

        //No applicable API
        boolean restricted = false;

        boolean canOpenSettings = true;

        boolean canEnableLight = false;

        if(currentCameraId == 0) canEnableLight = true;

        HashMap status = new HashMap();
        status.put("authorized",boolToNumberString(authorized));
        status.put("denied",boolToNumberString(denied));
        status.put("restricted",boolToNumberString(restricted));
        status.put("prepared",boolToNumberString(prepared));
        status.put("scanning",boolToNumberString(authorized));
        status.put("previewing",boolToNumberString(previewing));
        status.put("showing",boolToNumberString(showing));
        status.put("lightEnabled",boolToNumberString(lightOn));
        status.put("canOpenSettings",boolToNumberString(canOpenSettings));
        status.put("canEnableLight",boolToNumberString(canEnableLight));
        status.put("canChangeCamera",boolToNumberString(canChangeCamera()));
        status.put("currentCamera",Integer.toString(getCurrentCameraId()));

        JSONObject obj = new JSONObject(status);
        PluginResult result = new PluginResult(PluginResult.Status.OK, obj);
        callbackContext.sendPluginResult(result);
    }
    private void destroy(CallbackContext callbackContext) {
        prepared = false;
        makeOpaque();

        if(cameraPreviewing) {
            this.cordova.getActivity().runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    ((ViewGroup) mPreview.getParent()).removeView(mPreview);
                    cameraPreviewing = false;
                }
            });
        }
        switchFlash(false, callbackContext);
        closeCamera();
        currentCameraId = 0;
        cameraInUse = 0;
        getStatus(callbackContext);
    }
}
