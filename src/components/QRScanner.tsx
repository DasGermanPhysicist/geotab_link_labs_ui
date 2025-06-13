import React, { useRef, useEffect, useState } from 'react';
import jsQR from 'jsqr';
import { QrCode, X, AlertCircle, ZoomIn, ZoomOut } from 'lucide-react';

interface QRScannerProps {
  onScan: (macAddress: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const [hasZoom, setHasZoom] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    let animationFrameId: number;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access is not supported in this environment');
        }

        // Request the highest possible resolution
        const constraints = {
          video: {
            facingMode: 'environment',
            width: { ideal: 4096 },
            height: { ideal: 2160 },
            // Enable advanced camera features
            advanced: [
              { focusMode: 'continuous' },
              { exposureMode: 'continuous' },
              { whiteBalanceMode: 'continuous' }
            ]
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Check if component is still mounted before proceeding
        if (!mountedRef.current) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;

        // Check if zoom is supported
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        setHasZoom(!!capabilities.zoom);

        if (videoRef.current && mountedRef.current) {
          videoRef.current.srcObject = stream;
          
          try {
            await videoRef.current.play();
            
            // Only proceed with scanning if still mounted
            if (mountedRef.current) {
              // Set initial zoom if available
              if (capabilities.zoom) {
                const settings = track.getSettings();
                setZoomLevel(settings.zoom || 1);
              }
              requestAnimationFrame(scan);
            }
          } catch (playError) {
            if (mountedRef.current) {
              console.error('Error playing video:', playError);
              setError('Failed to start video stream. Please try again.');
            }
          }
        }
      } catch (err) {
        if (!mountedRef.current) return;

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
      if (!scanning || !mountedRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const context = canvas.getContext('2d');
        if (!context) return;

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Calculate the center scanning area (50% of the total size)
        const scanSize = {
          width: Math.floor(video.videoWidth * 0.5),
          height: Math.floor(video.videoHeight * 0.5)
        };
        const scanArea = {
          x: Math.floor((video.videoWidth - scanSize.width) / 2),
          y: Math.floor((video.videoHeight - scanSize.height) / 2)
        };

        // Draw the full frame first
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get the image data for just the scanning area
        const imageData = context.getImageData(
          scanArea.x, scanArea.y, 
          scanSize.width, scanSize.height
        );

        // Attempt to find QR code
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert"  // Optimize for black on white QR codes
        });

        if (code) {
          // Validate MAC address format
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

    const videoElement = videoRef.current;

    return () => {
      mountedRef.current = false;
      setScanning(false);
      
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      // Clean up video element
      if (videoElement) {
        videoElement.srcObject = null;
      }
      
      // Clean up media stream
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => {
          try {
            track.stop();
          } catch (err) {
            console.error('Error stopping track:', err);
          }
        });
        streamRef.current = null;
      }
    };
  }, [onScan, scanning]);

  const handleZoom = async (direction: 'in' | 'out') => {
    if (!streamRef.current) return;

    const track = streamRef.current.getVideoTracks()[0];
    const capabilities = track.getCapabilities();
    
    if (capabilities.zoom) {
      const min = capabilities.zoom.min || 1;
      const max = capabilities.zoom.max || 8;
      const step = capabilities.zoom.step || 0.5;

      const newZoom = direction === 'in' ? 
        Math.min(zoomLevel + step, max) : 
        Math.max(zoomLevel - step, min);

      await track.applyConstraints({
        advanced: [{ zoom: newZoom }]
      });

      setZoomLevel(newZoom);
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
              {/* Smaller scanning frame for better precision */}
              <div className="absolute inset-0 m-16 border-2 border-[#87B812] rounded-lg">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 border-2 border-white rounded-lg"></div>
                </div>
              </div>
              
              {/* Zoom controls */}
              {hasZoom && (
                <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                  <button
                    onClick={() => handleZoom('in')}
                    className="p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                  >
                    <ZoomIn className="w-6 h-6 text-[#87B812]" />
                  </button>
                  <button
                    onClick={() => handleZoom('out')}
                    className="p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                  >
                    <ZoomOut className="w-6 h-6 text-[#87B812]" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 text-center text-sm text-gray-600">
          Position the small QR code within the center frame to scan
        </div>
      </div>
    </div>
  );
}