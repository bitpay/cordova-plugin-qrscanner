/*
 * Copyright (c) Microsoft Open Technologies, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

namespace QRReader
{
    using System;
    using System.Runtime.InteropServices;
    using System.Threading;
    using System.Threading.Tasks;

    using Windows.Foundation;
    using Windows.Graphics.Imaging;
    using Windows.Media;
    using Windows.Media.Capture;
    using Windows.Media.MediaProperties;

    using ZXing;
    public sealed class Reader
    {
        private BarcodeReader barcodeReader;
        private CancellationTokenSource cancelSearch;
        private MediaCapture capture;
        private ImageEncodingProperties encodingProps;

        public Reader()
        {
            encodingProps = ImageEncodingProperties.CreateJpeg();
            barcodeReader = new BarcodeReader
            {
                Options = {
                    PossibleFormats = new BarcodeFormat[] { BarcodeFormat.QR_CODE },
                    TryHarder = true
                }
            };
        }

        public void SetCapture(MediaCapture capture)
        {
            this.capture = capture;
        }

        public IAsyncOperation<Result> ReadCode()
        {
            cancelSearch = new CancellationTokenSource();
            return this.Read().AsAsyncOperation();
        }

        public void Stop()
        {
            this.cancelSearch.Cancel();
        }

        private async Task<Result> Read()
        {
            Result result = null;
            try
            {
                while (result == null)
                {
                    result = await GetCameraImage(cancelSearch.Token);
                }
            }
            catch (OperationCanceledException) { }

            return result;
        }

        private async Task<Result> GetCameraImage(CancellationToken cancelToken)
        {
            if (cancelToken.IsCancellationRequested)
            {
                throw new OperationCanceledException(cancelToken);
            }

            var previewProperties = this.capture.VideoDeviceController.GetMediaStreamProperties(MediaStreamType.VideoPreview) as VideoEncodingProperties;

            var videoFrameConfig = new VideoFrame(BitmapPixelFormat.Bgra8, (int)previewProperties.Width, (int)previewProperties.Height);

            var videoFrame = await capture.GetPreviewFrameAsync(videoFrameConfig);
            
            
            var result =
                await
                    Task.Run(
                        () => barcodeReader.Decode(videoFrame.SoftwareBitmap),
                        cancelToken);

            return result;
        }
    }
}
