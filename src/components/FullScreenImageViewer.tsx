import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Download, Maximize, Minimize, RotateCw } from 'lucide-react';

interface FullScreenImageViewerProps {
  imageUrl: string | null;
  title?: string;
  timestampStr?: string;
  onClose: () => void;
}

export const FullScreenImageViewer: React.FC<FullScreenImageViewerProps> = ({
  imageUrl,
  title = 'Captured Slide Photo',
  timestampStr,
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState<boolean>(false);

  useEffect(() => {
    // Reset transformations when new image is viewed
    setZoomLevel(1);
    setRotation(0);
  }, [imageUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  const toggleNativeFullscreen = () => {
    const container = document.getElementById('fullscreenViewerContainer');
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsNativeFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsNativeFullscreen(false)).catch(() => {});
    }
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(3, Math.max(0.5, Number((prev + delta).toFixed(1)))));
  };

  return (
    <div
      id="fullscreenViewerContainer"
      className="fixed inset-0 z-70 bg-black/95 backdrop-blur-xl flex flex-col select-none overflow-hidden animate-in fade-in duration-200"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-950/80 border-b border-white/10 shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <h2 className="text-white text-xs sm:text-sm font-semibold truncate max-w-[240px] sm:max-w-md">
            {title}
          </h2>
          {timestampStr && (
            <span className="mono text-[11px] px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-medium">
              {timestampStr}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/10">
            <button
              type="button"
              onClick={() => handleZoom(-0.2)}
              className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="mono text-[11px] text-white/90 px-1.5 font-medium">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => handleZoom(0.2)}
              className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Rotate 90 deg */}
          <button
            type="button"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition cursor-pointer"
            title="Rotate slide 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Toggle Native Fullscreen */}
          <button
            type="button"
            onClick={toggleNativeFullscreen}
            className="p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition cursor-pointer"
            title={isNativeFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
          >
            {isNativeFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Download PNG */}
          <a
            href={imageUrl}
            download={`lecture-snip-${timestampStr ? timestampStr.replace(/:/g, '-') : 'slide'}.png`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-medium transition cursor-pointer"
            title="Download slide capture photo"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </a>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition cursor-pointer"
            title="Close viewer (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport with full pan/zoom */}
      <div
        className="flex-1 flex items-center justify-center p-4 overflow-auto cursor-grab active:cursor-grabbing"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="relative max-w-full max-h-full transition-transform duration-150 flex items-center justify-center"
          style={{
            transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
          }}
        >
          <img
            src={imageUrl}
            alt="Full-screen lecture slide preview"
            className="max-w-[95vw] max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10 select-none"
          />
        </div>
      </div>
    </div>
  );
};
