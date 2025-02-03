import React, { useRef, useEffect, useState } from 'react';
import jsQR from 'jsqr';
import { QrCode, X, Camera, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (macAddress: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let animationFrameId: number;
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        // Check if mediaDevices is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access is not supported in this environment');
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          requestAnimationFrame(scan);
        }
      } catch (err) {
        let errorMessage = 'Unable to access camera. ';
        
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            errorMessage += 'Please grant camera permissions to use the QR scanner.';
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            errorMessage += 'No camera device was found.';
          } else if (err.name === 'NotSupportedError') {
            errorMessage += 'Your browser does not support camera access.';
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            errorMessage += 'Your camera is in use by another application.';
          } else if (err.message) {
            errorMessage += err.message;
          }
        }

        setError(errorMessage);
        console.error('Camera access error:', err);
      }
    };

    const scan = () => {
      if (!scanning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          // Validate that the QR code content matches a MAC address format
          const macAddressRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
          if (macAddressRegex.test(code.data)) {
            onScan(code.data);
            return;
          }
        }
      }

      animationFrameId = requestAnimationFrame(scan);
    };

    startCamera();

    return () => {
      setScanning(false);
      cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onScan, scanning]);

  return (
    <div className="fixed inset-0 z-[100] bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#87B812]" />
            Scan QR Code
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative aspect-square">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <div className="text-red-500 mb-2 font-medium">Camera Error</div>
              <div className="text-gray-600 text-sm">{error}</div>
              <button
                onClick={onClose}
                className="mt-6 px-4 py-2 bg-[#87B812] text-white rounded-lg hover:bg-[#769f10] transition-colors"
              >
                Close Scanner
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full hidden"
              />
              <div className="absolute inset-0 border-2 border-[#87B812] m-12 rounded-lg"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="w-32 h-32 text-white opacity-20" />
              </div>
            </>
          )}
        </div>

        <div className="p-4 text-center text-sm text-gray-600">
          Position the QR code within the frame to scan
        </div>
      </div>
    </div>
  );
}