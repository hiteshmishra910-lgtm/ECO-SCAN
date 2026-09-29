import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  X,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Layers,
  Info,
  ExternalLink,
  SwitchCamera,
  Loader2,
} from 'lucide-react';
import { WasteDetectionResponse, DetectionItem, WasteScan } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface WasteScannerProps {
  onScanConfirmed?: (scan: WasteScan) => void;
  onClose?: () => void;
  collectorMode?: boolean;
  onCollectorScanResult?: (item: DetectionItem, image: string) => void;
}

export const WasteScanner: React.FC<WasteScannerProps> = ({
  onScanConfirmed,
  onClose,
  collectorMode = false,
  onCollectorScanResult,
}) => {
  const { user } = useAuth();

  // Camera & Stream states
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState<boolean>(false);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);

  // Capture & Detection states
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<WasteDetectionResponse | null>(null);
  const [selectedDetectionIndex, setSelectedDetectionIndex] = useState<number>(0);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop all camera tracks safely
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Real Camera Request Function
  const openCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    setIsPermissionDenied(false);
    setIsStartingCamera(true);
    setApiError(null);

    // Stop previous stream if active
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your current browser environment.');
      }

      let stream: MediaStream;

      try {
        // Primary request: rear camera preferred with ideal constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
          },
          audio: false,
        });
      } catch (firstErr: any) {
        // Fallback for OverconstrainedError or specific constraints issues
        console.warn('Initial camera constraints failed, attempting fallback:', firstErr);
        if (firstErr.name === 'OverconstrainedError' || firstErr.name === 'ConstraintNotSatisfiedError') {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } else {
          throw firstErr;
        }
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video auto-play warning:', playErr);
        }
      }

      setCameraActive(true);
      setFacingMode(mode);
    } catch (err: any) {
      console.error('Camera access error:', err);
      let message = 'Unable to access device camera.';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission was denied. Please allow camera access in browser settings.';
        setIsPermissionDenied(true);
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera was found on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = 'Camera is currently being used by another application.';
      } else if (err.name === 'OverconstrainedError') {
        message = 'Camera does not satisfy the requested constraints.';
      } else if (err.name === 'SecurityError') {
        message = 'Camera access requires a secure connection (HTTPS) or unconstrained browser tab.';
      } else if (err.message) {
        message = err.message;
      }

      setCameraError(message);
      setCameraActive(false);
    } finally {
      setIsStartingCamera(false);
    }
  };

  // Switch between rear and front camera
  const handleSwitchCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    openCamera(nextMode);
  };

  // Capture frame from video element to Canvas -> File
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedImage(dataUrl);

      // Create synchronous File
      const byteString = atob(dataUrl.split(',')[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: 'image/jpeg' });
      const file = new File([blob], `waste-capture-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });
      setCapturedFile(file);

      // Stop camera hardware after capture
      stopCamera();
    }
  };

  // Gallery File Upload fallback handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopCamera();
    setCapturedFile(file);
    setCapturedImage(URL.createObjectURL(file));
    setCameraError(null);
    setApiError(null);
    setDetectionResult(null);
  };

  // Retake photo action
  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedFile(null);
    setDetectionResult(null);
    setApiError(null);
    setSaveSuccess(false);
    openCamera(facingMode);
  };

  // Real Waste Detection API Call (multipart/form-data)
  const analyzeWaste = async () => {
    let fileToSend = capturedFile;

    if (!fileToSend && capturedImage) {
      try {
        if (capturedImage.startsWith('data:')) {
          const byteString = atob(capturedImage.split(',')[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: 'image/jpeg' });
          fileToSend = new File([blob], `waste-${Date.now()}.jpg`, { type: 'image/jpeg' });
        } else {
          const fetched = await fetch(capturedImage);
          const blob = await fetched.blob();
          fileToSend = new File([blob], `waste-${Date.now()}.jpg`, { type: 'image/jpeg' });
        }
      } catch (convErr) {
        console.warn('File conversion warning:', convErr);
      }
    }

    if (!fileToSend) {
      setApiError('No image available to analyze. Please capture or upload a photo.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setApiError(null);

      // Build multipart/form-data
      const formData = new FormData();
      formData.append('image', fileToSend);

      const res = await fetch('/api/detect-waste', {
        method: 'POST',
        body: formData, // Send actual image via multipart/form-data
      });

      const data: WasteDetectionResponse = await res.json().catch(() => null);

      if (!res.ok || !data) {
        throw new Error(data?.message || 'Unable to analyze the image. Please try again.');
      }

      setDetectionResult(data);
      setSelectedDetectionIndex(0);

      // In collector mode, pass detection result to confirmation flow
      if (collectorMode && data.garbageDetected && data.detections.length > 0 && capturedImage) {
        if (onCollectorScanResult) {
          onCollectorScanResult(data.detections[0], capturedImage);
        }
      }
    } catch (err: any) {
      console.error('Waste detection API error:', err);
      setApiError(err?.message || 'Unable to analyze the image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Confirm and Save Scan Record
  const handleConfirmScan = async () => {
    if (!detectionResult || !detectionResult.detections || detectionResult.detections.length === 0) {
      return;
    }

    const item = detectionResult.detections[selectedDetectionIndex] || detectionResult.detections[0];

    try {
      const payload = {
        residentId: user?.id || 'USR-RES-001',
        houseId: user?.houseId || 'H-101',
        image: capturedImage || '',
        detectedObject: item.object,
        category: item.category,
        wasteType: item.wasteType,
        confidence: item.confidence,
        recyclable: item.recyclable,
        recommendedBin: item.recommendedBin,
        disposalMethod: item.disposalMethod,
      };

      const res = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const savedData = await res.json();
      if (savedData.success) {
        setSaveSuccess(true);
        if (onScanConfirmed) {
          onScanConfirmed(savedData.scan);
        }
        setTimeout(() => {
          if (onClose) onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to save scan record:', err);
    }
  };

  // Cleanup on unmount or tab switch
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl border border-emerald-100 max-w-lg mx-auto w-full relative">
      {/* Scanner Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 rounded-xl text-[#00A86B]">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#064E3B]">
              {collectorMode ? 'Collector Waste Scanner' : 'AI Waste Scanner'}
            </h3>
            <p className="text-[11px] text-slate-500">Live Device Camera & AI Detection</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Camera / Preview Container */}
      <div className="relative aspect-4/3 w-full bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
        {/* State 1: Active Live Video Feed */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className={`w-full h-full object-cover ${cameraActive && !capturedImage ? 'block' : 'hidden'}`}
        />

        {cameraActive && !capturedImage && (
          <div className="absolute inset-6 border-2 border-dashed border-emerald-400/60 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
            <div className="flex justify-between items-center text-[10px] text-emerald-300 font-bold bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-xs w-fit">
              <Sparkles className="w-3 h-3 mr-1 text-emerald-400" />
              LIVE {facingMode === 'environment' ? 'REAR' : 'FRONT'} CAMERA
            </div>
            <div className="text-center text-[11px] font-semibold text-white/90 bg-black/50 py-1 px-3 rounded-full backdrop-blur-xs self-center">
              Position waste item in center
            </div>
          </div>
        )}

        {/* State 2: Captured Image Preview */}
        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured Waste Item"
            className="w-full h-full object-cover"
          />
        )}

        {/* State 3: Camera Not Started Yet & Ready */}
        {!cameraActive && !capturedImage && !cameraError && (
          <div className="p-6 text-center text-white flex flex-col items-center max-w-xs space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Camera className="w-7 h-7" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100">Ready to Scan Waste</div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Open your device's camera to inspect household items.
              </p>
            </div>
            <div className="pt-1 flex flex-col w-full gap-2">
              <button
                type="button"
                onClick={() => openCamera('environment')}
                disabled={isStartingCamera}
                className="w-full py-2.5 px-4 bg-[#00A86B] hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                {isStartingCamera ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Opening Camera...
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    OPEN CAMERA
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-300" />
                Upload Image
              </button>
            </div>
          </div>
        )}

        {/* State 4: Camera Error / Permission Denied */}
        {cameraError && !capturedImage && (
          <div className="p-5 text-center text-white flex flex-col items-center max-w-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <div className="text-xs font-bold text-rose-300">
                {isPermissionDenied ? 'Camera permission was denied.' : 'Camera Notice'}
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug">{cameraError}</p>
            </div>

            <div className="flex flex-col w-full gap-2 pt-1">
              <button
                type="button"
                onClick={() => openCamera('environment')}
                className="w-full py-2 px-3 bg-[#00A86B] hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                Allow Camera
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 bg-white text-slate-800 hover:bg-slate-100 text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-[#00A86B]" />
                Upload Image Instead
              </button>

              {/* Requirement 3: Open in New Tab for Iframe/Sandbox issues */}
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-emerald-500/30"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                OPEN ECOSCAN IN NEW TAB
              </a>
            </div>
          </div>
        )}

        {/* Loading Overlay during Real AI Analysis */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3 p-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin"></div>
            <div className="text-sm font-extrabold text-emerald-300 tracking-wide">
              ANALYZING WASTE...
            </div>
            <p className="text-[11px] text-slate-300 text-center max-w-xs leading-relaxed">
              Evaluating image for human safety and identifying material composition (plastic, paper, metal, wet organics).
            </p>
          </div>
        )}
      </div>

      {/* Hidden File Input for Gallery Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Camera Live Controls (While Camera is Streaming) */}
      {cameraActive && !capturedImage && (
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleSwitchCamera}
            className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            title="Switch front/rear camera"
          >
            <SwitchCamera className="w-4 h-4 text-slate-600" />
            Switch Camera
          </button>

          {/* Large Capture Photo Button */}
          <button
            type="button"
            onClick={capturePhoto}
            className="w-14 h-14 rounded-full bg-[#00A86B] hover:bg-emerald-600 border-4 border-emerald-100 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-transform active:scale-95 shrink-0"
            title="Capture Photo"
          >
            <div className="w-6 h-6 rounded-full bg-white"></div>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <Upload className="w-4 h-4 text-slate-600" />
            Upload Image
          </button>
        </div>
      )}

      {/* Captured Image Actions (Before Detection) */}
      {capturedImage && !detectionResult && !isAnalyzing && (
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleRetake}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retake
          </button>

          <button
            type="button"
            onClick={analyzeWaste}
            className="flex-1 py-3 px-4 bg-[#00A86B] hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Analyze Waste
          </button>
        </div>
      )}

      {/* API Error Box with Try Again */}
      {apiError && (
        <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            {apiError}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={analyzeWaste}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={handleRetake}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
            >
              Retake Photo
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* REAL DETECTION RESULT SCREEN                             */}
      {/* ========================================================= */}
      {detectionResult && (
        <div className="mt-4 space-y-3.5 animate-in fade-in duration-200">
          {/* CASE 1: NO GARBAGE DETECTED (HUMAN / FACE / CLEAN NON-WASTE OBJECT) */}
          {!detectionResult.garbageDetected ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-2 text-amber-800 font-extrabold text-sm">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                NO GARBAGE DETECTED
              </div>

              <div className="text-xs text-amber-900 leading-relaxed font-semibold">
                {detectionResult.humanDetected
                  ? 'Human/person detected. Please scan actual waste.'
                  : detectionResult.message || 'Unable to identify garbage. Please scan a clear waste item.'}
              </div>

              <p className="text-[11px] text-amber-700/90 bg-white/70 p-2.5 rounded-xl border border-amber-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                The system strictly ensures humans, clean rooms, furniture, or personal items are never classified as waste.
              </p>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  SCAN AGAIN
                </button>
              </div>
            </div>
          ) : (
            /* CASE 2: REAL WASTE DETECTED (PLASTIC / PAPER / METAL / ORGANIC / ETC.) */
            <div className="p-4 bg-[#E8F8EF] border border-[#B7E4C7] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#00A86B] text-white flex items-center justify-center">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-[#064E3B] tracking-wide uppercase">
                    WASTE DETECTED
                  </span>
                </div>

                {/* Multiple objects pill */}
                {detectionResult.detections.length > 1 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {detectionResult.detections.length} Items Found
                  </span>
                )}
              </div>

              {/* Multiple Object Selector Tabs if more than 1 item */}
              {detectionResult.detections.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {detectionResult.detections.map((d, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedDetectionIndex(idx)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all ${
                        selectedDetectionIndex === idx
                          ? 'bg-[#00A86B] text-white'
                          : 'bg-white text-slate-700 border border-emerald-200'
                      }`}
                    >
                      {d.object}
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Waste Item Info Card */}
              {(() => {
                const item =
                  detectionResult.detections[selectedDetectionIndex] || detectionResult.detections[0];
                const isDry = item.wasteType === 'Dry Waste';
                const confidencePercent = Math.round((item.confidence || 0.9) * 100);

                return (
                  <div className="bg-white rounded-xl p-3.5 border border-emerald-100 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-extrabold text-slate-800">{item.object}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          Category: <span className="text-slate-800 font-bold">{item.category}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isDry
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {item.wasteType}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          {confidencePercent}% confidence
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                      <div className="p-2 rounded-lg bg-slate-50">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Recyclable
                        </span>
                        <span
                          className={`font-bold ${
                            item.recyclable ? 'text-emerald-600' : 'text-slate-600'
                          }`}
                        >
                          {item.recyclable ? 'YES' : 'NO'}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-50">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Recommended Bin
                        </span>
                        <span className="font-bold text-slate-800 truncate block">
                          {item.recommendedBin}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100 text-emerald-950 leading-snug">
                      <span className="font-bold block text-[#064E3B] mb-0.5">Disposal:</span>
                      {item.disposalMethod}
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons for Resident */}
              {!collectorMode ? (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                  >
                    SCAN AGAIN
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmScan}
                    disabled={saveSuccess}
                    className="flex-1 py-2.5 px-3 bg-[#00A86B] hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {saveSuccess ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        SAVED!
                      </>
                    ) : (
                      <>
                        CONFIRM
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center pt-1 text-xs text-emerald-800 font-bold">
                  ✓ Detection verified. Please enter measured weight below.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
