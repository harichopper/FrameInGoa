import React, { useCallback, useRef, useState, useEffect, KeyboardEvent } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import heic2any from 'heic2any';
import { Camera, RotateCw, Upload, ZoomIn, RefreshCw, Layers, ImageIcon } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface PhotoUploaderProps {
  photoUrl: string | null;
  crop: { x: number; y: number };
  zoom: number;
  rotation: number;
  onPhotoChange: (url: string | null) => void;
  onCropChange: (crop: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onRotationChange: (rotation: number) => void;
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
const MAX_FILE_MB = 20;

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photoUrl,
  crop,
  zoom,
  rotation,
  onPhotoChange,
  onCropChange,
  onZoomChange,
  onRotationChange,
  onCropComplete,
}) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.some((t) => file.type === t || file.name.toLowerCase().endsWith(t.split('/')[1]))) {
        toast('Unsupported file type. Please use JPG, PNG, HEIC, or WebP.', 'error');
        return;
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        toast(`File too large. Maximum size is ${MAX_FILE_MB} MB.`, 'error');
        return;
      }

      setIsLoading(true);
      try {
        let finalFile = file;
        const isHeic =
          file.type === 'image/heic' ||
          file.type === 'image/heif' ||
          file.name.toLowerCase().endsWith('.heic') ||
          file.name.toLowerCase().endsWith('.heif');

        if (isHeic) {
          toast('Converting HEIC…', 'info');
          const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
          const blob = Array.isArray(converted) ? converted[0] : converted;
          finalFile = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
        }

        const reader = new FileReader();
        reader.onload = () => {
          onPhotoChange(reader.result as string);
          setIsLoading(false);
          toast('Photo uploaded — adjust your crop below.', 'success');
        };
        reader.onerror = () => {
          toast('Failed to read image file. Please try again.', 'error');
          setIsLoading(false);
        };
        reader.readAsDataURL(finalFile);
      } catch (err) {
        console.error('File processing error:', err);
        toast('Failed to process image. Please try a standard JPG or PNG.', 'error');
        setIsLoading(false);
      }
    },
    [onPhotoChange, toast],
  );

  // ── Drag handlers ────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      // Reset so same file can be re-selected
      e.target.value = '';
    },
    [processFile],
  );

  // Keyboard-accessible dropzone
  const handleDropzoneKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  // ── Camera ───────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error('Camera error:', err);
      toast('Camera access denied. Please upload a photo instead.', 'error');
      setShowCamera(false);
    }
  };

  const stopCamera = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    setShowCamera(false);
  }, []);

  const captureCameraPhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    onPhotoChange(canvas.toDataURL('image/jpeg', 0.95));
    stopCamera();
    toast('Photo captured! Adjust your crop below.', 'success');
  }, [onPhotoChange, stopCamera, toast]);

  // ── Render: Camera mode ──────────────────────────────────────
  if (showCamera) {
    return (
      <div className="glass-panel p-6 rounded-xl text-center space-y-4 border border-[#00f0ff]/30">
        <div className="relative aspect-video rounded-lg overflow-hidden bg-black max-w-md mx-auto border border-white/10">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            aria-label="Camera preview"
          />
        </div>
        <div className="flex gap-4 justify-center">
          <button
            onClick={captureCameraPhoto}
            className="btn-primary-gradient px-6 py-2 rounded-lg font-bold text-black flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            aria-label="Capture photo"
          >
            <Camera className="w-4 h-4" /> Capture
          </button>
          <button
            onClick={stopCamera}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Dropzone ─────────────────────────────────────────
  if (!photoUrl) {
    return (
      <div className="space-y-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload photo — click or drag and drop"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={handleDropzoneKey}
          className={`glass-panel p-8 rounded-xl relative overflow-hidden group cursor-pointer transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] ${
            isDragging
              ? 'border-[#00f0ff] bg-[#00f0ff]/10 scale-[1.01]'
              : 'hover:border-[#00f0ff]/50'
          }`}
        >
          <div className="flex flex-col items-center justify-center min-h-[280px] border-2 border-dashed border-[#3b494b] rounded-lg group-hover:border-[#00dbe9] transition-colors p-6 text-center">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3" aria-live="polite">
                <RefreshCw className="w-10 h-10 text-[#00f0ff] animate-spin" aria-hidden="true" />
                <span className="text-[#dbfcff] font-medium text-sm">Processing image…</span>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/20 flex items-center justify-center mb-4 text-[#00f0ff] group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" aria-hidden="true" />
                </div>
                <h3 className="font-headline-md text-2xl text-[#e5e2e1] mb-2 font-bold">
                  Drag &amp; Drop Image
                </h3>
                <p className="text-[#b9cacb] font-body-sm text-sm mb-2 max-w-xs">
                  JPG · PNG · HEIC · WebP — up to {MAX_FILE_MB} MB
                </p>
                <p className="text-[#b9cacb] font-mono text-xs mb-6 opacity-60">
                  or use the buttons below
                </p>
                <div className="flex gap-3 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="px-5 py-2.5 border border-white/20 rounded-lg text-[#e5e2e1] hover:bg-white/10 transition-all text-xs font-mono font-semibold flex items-center gap-2 cursor-pointer"
                    aria-label="Browse for file"
                  >
                    <ImageIcon className="w-4 h-4" aria-hidden="true" /> Browse File
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); startCamera(); }}
                    className="px-5 py-2.5 bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/20 rounded-lg transition-all text-xs font-mono font-semibold flex items-center gap-2 cursor-pointer"
                    aria-label="Use camera"
                  >
                    <Camera className="w-4 h-4" aria-hidden="true" /> Camera
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Crop Editor ──────────────────────────────────────
  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      <div className="glass-panel p-6 rounded-xl space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-[#dbfcff] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#00f0ff]" aria-hidden="true" />
            Adjust &amp; Crop Avatar
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-[#b9cacb] border border-white/10 transition-colors cursor-pointer"
              aria-label="Change photo"
            >
              Change Photo
            </button>
            <button
              type="button"
              onClick={() => { onPhotoChange(null); toast('Photo removed.', 'info'); }}
              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs font-mono text-red-400 border border-red-500/20 transition-colors cursor-pointer"
              aria-label="Remove photo"
            >
              Remove
            </button>
          </div>
        </div>

        {/* Cropper stage */}
        <div
          className="relative w-full h-72 bg-[#0e0e0e] rounded-xl overflow-hidden border border-white/10 shadow-inner"
          aria-label="Crop area — drag to reposition, pinch or scroll to zoom"
          role="application"
        >
          <Cropper
            image={photoUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={true}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onRotationChange={onRotationChange}
            onCropComplete={onCropComplete}
            zoomSpeed={0.3}
            restrictPosition={false}
          />
        </div>

        {/* Precision controls */}
        <div className="space-y-5 pt-2" role="group" aria-label="Crop adjustments">
          {/* Zoom */}
          <div>
            <div className="flex justify-between text-xs font-mono text-[#b9cacb] mb-1.5">
              <label htmlFor="zoom-slider" className="flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" /> Zoom
              </label>
              <span aria-live="polite">{zoom.toFixed(1)}x</span>
            </div>
            <input
              id="zoom-slider"
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.05}
              onChange={(e) => onZoomChange(Number(e.target.value))}
              className="w-full accent-[#00f0ff] bg-white/10 rounded-lg h-1.5 cursor-pointer"
              aria-label={`Zoom: ${zoom.toFixed(1)}x`}
            />
          </div>

          {/* Rotation */}
          <div>
            <div className="flex justify-between text-xs font-mono text-[#b9cacb] mb-1.5">
              <label htmlFor="rotation-slider" className="flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5" aria-hidden="true" /> Rotation
              </label>
              <span aria-live="polite">{rotation}°</span>
            </div>
            <input
              id="rotation-slider"
              type="range"
              value={rotation}
              min={-180}
              max={180}
              step={1}
              onChange={(e) => onRotationChange(Number(e.target.value))}
              className="w-full rounded-lg h-1.5 cursor-pointer"
              style={{ accentColor: '#ff24e4' }}
              aria-label={`Rotation: ${rotation}°`}
            />
          </div>

          {/* Quick-reset */}
          <button
            type="button"
            onClick={() => { onZoomChange(1); onRotationChange(0); onCropChange({ x: 0, y: 0 }); }}
            className="text-xs font-mono text-[#b9cacb] hover:text-[#00f0ff] transition-colors flex items-center gap-1 cursor-pointer"
            aria-label="Reset crop to default"
          >
            <RefreshCw className="w-3 h-3" aria-hidden="true" /> Reset to default
          </button>
        </div>
      </div>
    </div>
  );
};
