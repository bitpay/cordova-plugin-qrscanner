using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.Devices.Enumeration;
using Windows.Foundation;
using Windows.Media.Capture;
using Windows.Media.Devices;
using Windows.UI.Core;

namespace QRReader
{
    public struct CameraSet
    {
        public string Back;
        public string Front;
    }

    public sealed class VideoCapture
    {
        public static IAsyncOperation<CameraSet> GetCamerasAsync()
        {
            return GetCameras().AsAsyncOperation();
        }

        private static async Task<CameraSet> GetCameras()
        {
            var cameras = await DeviceInformation.FindAllAsync(DeviceClass.VideoCapture);

            if (cameras.Count == 0)
            {
                throw new Exception("No cameras found");
            }

            var backCamera = cameras.FirstOrDefault((camera) => camera.IsEnabled && camera.EnclosureLocation.Panel == Panel.Back);
            var frontCamera = cameras.FirstOrDefault((camera) => camera.IsEnabled && camera.EnclosureLocation.Panel == Panel.Front);
            
            return new CameraSet
            {
                Back = backCamera?.Id ?? "",
                Front = frontCamera?.Id ?? ""
            };
        }

        public static IAsyncOperation<VideoCapture> CreateAsync(string cameraId)
        {
            return Create(cameraId).AsAsyncOperation();
        }

        private static async Task<VideoCapture> Create(string cameraId)
        {
            var captureSettings = new MediaCaptureInitializationSettings()
            {
                VideoDeviceId = cameraId,
                StreamingCaptureMode = StreamingCaptureMode.Video
            };

            var mediaCapture = new MediaCapture();
            await mediaCapture.InitializeAsync(captureSettings);
            var videoCapture = new VideoCapture(mediaCapture);
            await videoCapture.WatchForOrientationChange(mediaCapture);
            return videoCapture;
        }


        public MediaCapture Capture { get; private set; }
        public bool CanEnableLight { get; private set; }
        public bool CanFocus { get; private set; }
        private CoreDispatcher mainDispatcher = CoreWindow.GetForCurrentThread().Dispatcher;

        private VideoCapture(MediaCapture capture)
        {
            var cameraController = capture.VideoDeviceController;

            Capture = capture;
            CanEnableLight = cameraController.TorchControl.Supported;
            CanFocus = cameraController.FocusControl.Supported;

            if (CanFocus && cameraController.FocusControl.SupportedFocusModes.Count > 0)
            {
                var focusConfig = new FocusSettings();
                focusConfig.AutoFocusRange = AutoFocusRange.Normal;
                focusConfig.DisableDriverFallback = false;
                if (cameraController.FocusControl.SupportedFocusModes.Contains(FocusMode.Continuous))
                {
                    focusConfig.Mode = FocusMode.Continuous;
                }
                else if (cameraController.FocusControl.SupportedFocusModes.Contains(FocusMode.Auto))
                {
                    focusConfig.Mode = FocusMode.Auto;
                }
            }
        }
        
        private async Task WatchForOrientationChange(MediaCapture capture)
        {
            var camera = await DeviceInformation.CreateFromIdAsync(capture.MediaCaptureSettings.VideoDeviceId);
            var cameraRotationHelper = new CameraRotationHelper(camera.EnclosureLocation);
            OrientationChanged(cameraRotationHelper);
            cameraRotationHelper.OrientationChanged += CameraRotationHelper_OrientationChanged;
        }

        private async void CameraRotationHelper_OrientationChanged(object sender, bool e)
        {
            var helper = sender as CameraRotationHelper;
            await mainDispatcher.RunAsync(CoreDispatcherPriority.Normal, () => OrientationChanged(helper));
        }

        private void OrientationChanged(CameraRotationHelper cameraRotationHelper)
        {
            var previewOrientation = cameraRotationHelper.GetCameraPreviewOrientation();
            var videoRotation = CameraRotationHelper.ConvertSimpleOrientationToVideoRotation(previewOrientation);
            Capture.SetPreviewRotation(videoRotation);
        }

        public void EnableLight()
        {

            if (!CanEnableLight)
            {
                return;
            }

            Capture.VideoDeviceController.TorchControl.Enabled = true;
            if (Capture.VideoDeviceController.TorchControl.PowerSupported)
            {
                Capture.VideoDeviceController.TorchControl.PowerPercent = 90;
            }
        }

        public void DisableLight()
        {
            if (!CanEnableLight)
            {
                return;
            }
            
            if (Capture.VideoDeviceController.TorchControl.Enabled)
            {
                Capture.VideoDeviceController.TorchControl.Enabled = false;
            }
        }

        public void Focus()
        {
            const int INITIAL_FOCUS_DELAY = 200;
            const int OPERATION_IS_IN_PROGRESS = -2147024567;

            if (CanFocus)
            {
                var focusControl = Capture.VideoDeviceController.FocusControl;
                if (focusControl.FocusState != MediaCaptureFocusState.Searching)
                {
                    Task.Run(async () =>
                    {
                        await Task.Delay(INITIAL_FOCUS_DELAY);
                        try
                        {
                            await focusControl.FocusAsync();
                        }
                        catch (Exception exc)
                        {
                            if(exc.HResult != OPERATION_IS_IN_PROGRESS)
                            {
                                System.Diagnostics.Debug.WriteLine(exc.ToString());
                                throw exc;
                            }
                        }
                    });
                }
            }
        }

        private bool isDestroyed = false;

        public async void Destroy()
        {
            if (isDestroyed) return;
            isDestroyed = true;
            await mainDispatcher.RunAsync(CoreDispatcherPriority.Normal, async () => {
                await Capture.StopPreviewAsync();
                Capture.Dispose();
            });
        }
    }
}
