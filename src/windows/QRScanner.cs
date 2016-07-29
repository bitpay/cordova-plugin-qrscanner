using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Runtime.Serialization;
using System.Windows;
using Microsoft.Phone.Tasks;
using WPCordovaClassLib.Cordova;
using WPCordovaClassLib.Cordova.Commands;
using WPCordovaClassLib.Cordova.JSON;
using Microsoft.Phone.Info;
using System.IO;
using System.IO.IsolatedStorage;
using Microsoft.Devices;

    public class QRScanner : BaseCommand
    {

        enum QRScannerError
        {
            UNEXPECTED_ERROR,
            CAMERA_ACESS_DENIED,
            CAMERA_ACESS_RESTRICTED,
            BACK_CAMERA_UNAVAILABLE,
            FRONT_CAMERA_UNAVAILABLE,
            CAMERA_UNAVAILABLE,
            SCAN_CANCELED,
            LIGHT_UNAVAILABLE,
            OPEN_SETTINGS_UNAVAILABLE
        }
        /**
         * Error Callbacks:
         * DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR,
         *      Convert.ToString((int)QRScannerError.BACK_CAMERA_UNAVAILABLE)));
         *
         * Success Callbacks:
         * DispatchCommandResult(); (success - no PluginResult object)
         * DispatchCommandResult(new PluginResult(PluginResult.Status.OK, "Dict"));
         *
         * */
         /**

        private void error(string error)
        {
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK,
                Convert.ToString((int)QRScannerError.error)));
        }

        private void success()
        {
            DispatchCommandResult();
        }
        **/

        //<---Begin External API--->
        public void prepare(string options)
        {

        }

        public void scan(string options)
        {
            //Cordova.plugin.BarcodeScanner.scan(success, error("SCAN_CANCELED"));
        }

        public void show(string options)
        {
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, "yeehaw");
        }

        public void hide(string options)
        {

        }

        public void enableLight(string options)
        {

        }

        public void disableLight(string options)
        {

        }

        public void useFrontCamera(string options)
        {

        }

        public void useBackCamera(string options)
        {

        }

        public void pausePreview(string options)
        {

        }

        public void resumePreview(string options)
        {

        }

        public void openSettings(string options)
        {
            Windows.System.Launcher.LaunchUriAsync(new Uri("ms-settings-wifi:"));
        }

        public void getStatus(string dontUseMe)
        {
            bool authorized = false, denied = false, restricted = false,
                prepared = false, showing = false, scanning = false,
                previewing = false, lightEnabled = false, canOpenSettings =false,
                canEnableLight = false, canChangeCamera = false;

            int currentCamera = 1;

            string statusDict = String.Format("\"authorized\":\"{0}\",\"denied\":\"{1}\",\"restricted\":\"{2}\",\"prepared\":\"{3}\",\"showing\":\"{4}\",\"scanning\":\"{5}\",\"previewing\":{6}\",\"lightEnabled\":\"{7}\",\"canOpenSettings\":\"{8}\",\"canEnableLight\":\"{9}\",\"canChangeCamera\":\"{10}\",\"currentCamera\":\"{11}",
                                        Convert.ToInt32(authorized),
                                        Convert.ToInt32(denied),
                                        Convert.ToInt32(restricted),
                                        Convert.ToInt32(prepared),
                                        Convert.ToInt32(showing),
                                        Convert.ToInt32(scanning),
                                        Convert.ToInt32(previewing),
                                        Convert.ToInt32(lightEnabled),
                                        Convert.ToInt32(canOpenSettings),
                                        Convert.ToInt32(canEnableLight),
                                        Convert.ToInt32(canChangeCamera),
                                        currentCamera);

            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, "{" + statusDict + "}"));
        }
    }
