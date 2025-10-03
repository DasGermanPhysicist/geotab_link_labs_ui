import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, X, AlertCircle, Flashlight, FlashlightOff, SwitchCamera } from 'lucide-react';

interface QRScannerProps {
  onScan: (macAddress: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(true);
  const scannerElementId = 'qr-scanner-region';

  useEffect(() => {
    mountedRef.current = true;
    let scanner: Html5Qrcode | null = null;

    const initializeScanner = async () => {
      try {
        scanner = new Html5Qrcode(scannerElementId);
        scannerRef.current = scanner;

        const devices = await Html5Qrcode.getCameras();

        if (!mountedRef.current) return;

        if (!devices || devices.length === 0) {
          throw new Error('No cameras found on this device');
        }

        setCameras(devices);

        const rearCamera = devices.find(device =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );

        const cameraId = rearCamera ? rearCamera.id : devices[0].id;
        const initialCameraIndex = rearCamera ? devices.indexOf(rearCamera) : 0;
        setCurrentCameraIndex(initialCameraIndex);

        await startScanning(scanner, cameraId);
      } catch (err) {
        if (!mountedRef.current) return;

        let errorMessage = 'Unable to access camera. ';

        if (err instanceof Error) {
          if (err.message.includes('NotAllowedError') || err.message.includes('Permission')) {
            errorMessage += 'Please grant camera permissions to use the QR scanner.';
          } else if (err.message.includes('NotFoundError') || err.message.includes('No cameras')) {
            errorMessage += 'No camera device was found.';
          } else if (err.message.includes('NotSupportedError')) {
            errorMessage += 'Your browser does not support camera access.';
          } else if (err.message.includes('NotReadableError') || err.message.includes('in use')) {
            errorMessage += 'Your camera is in use by another application.';
          } else {
            errorMessage += err.message;
          }
        }

        setError(errorMessage);
        console.error('Camera initialization error:', err);
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    const startScanning = async (scanner: Html5Qrcode, cameraId: string) => {
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
      };

      await scanner.start(
        cameraId,
        config,
        (decodedText) => {
          const macAddressRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
          if (macAddressRegex.test(decodedText)) {
            onScan(decodedText);
          }
        },
        (errorMessage) => {
          // Silently ignore failed scan attempts
        }
      );

      checkTorchSupport(scanner);
    };

    const checkTorchSupport = async (scanner: Html5Qrcode) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any;

        if (capabilities.torch) {
          setHasTorch(true);
        }

        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.log('Torch check failed:', err);
      }
    };

    initializeScanner();

    return () => {
      mountedRef.current = false;

      if (scanner && scanner.isScanning) {
        scanner.stop().catch(err => {
          console.error('Error stopping scanner:', err);
        });
      }

      if (scanner) {
        scanner.clear().catch(err => {
          console.error('Error clearing scanner:', err);
        });
      }
    };
  }, [onScan]);

  const toggleTorch = async () => {
    if (!scannerRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { advanced: [{ torch: !isTorchOn } as any] }
      });

      const track = stream.getVideoTracks()[0];
      await track.applyConstraints({
        advanced: [{ torch: !isTorchOn } as any]
      });

      setIsTorchOn(!isTorchOn);
    } catch (err) {
      console.error('Error toggling torch:', err);
    }
  };

  const switchCamera = async () => {
    if (!scannerRef.current || cameras.length <= 1) return;

    try {
      await scannerRef.current.stop();

      const nextIndex = (currentCameraIndex + 1) % cameras.length;
      setCurrentCameraIndex(nextIndex);

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
      };

      await scannerRef.current.start(
        cameras[nextIndex].id,
        config,
        (decodedText) => {
          const macAddressRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
          if (macAddressRegex.test(decodedText)) {
            onScan(decodedText);
          }
        },
        (errorMessage) => {
          // Silently ignore failed scan attempts
        }
      );
    } catch (err) {
      console.error('Error switching camera:', err);
      setError('Failed to switch camera. Please try again.');
    }
  };

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

        <div className="relative aspect-square bg-black">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white">
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
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white">
                  <div className="text-gray-600">Initializing camera...</div>
                </div>
              )}

              <div id={scannerElementId} className="w-full h-full" />

              {!isLoading && (
                <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                  {hasTorch && (
                    <button
                      onClick={toggleTorch}
                      className="p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                      title={isTorchOn ? 'Turn off flashlight' : 'Turn on flashlight'}
                    >
                      {isTorchOn ? (
                        <FlashlightOff className="w-6 h-6 text-[#87B812]" />
                      ) : (
                        <Flashlight className="w-6 h-6 text-[#87B812]" />
                      )}
                    </button>
                  )}

                  {cameras.length > 1 && (
                    <button
                      onClick={switchCamera}
                      className="p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                      title="Switch camera"
                    >
                      <SwitchCamera className="w-6 h-6 text-[#87B812]" />
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 text-center text-sm text-gray-600">
          Position the QR code within the scanning area
        </div>
      </div>
    </div>
  );
}
