import React from 'react';
import { Play, Pause, UploadCloud } from 'lucide-react';

interface HudToastProps {
  message: string | null;
}

export const HudToast: React.FC<HudToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      id="hudToast"
      className="absolute top-5 left-5 z-40 px-3.5 py-1.5 rounded-full bg-neutral-900/90 border border-white/20 backdrop-blur-xl text-white text-xs font-medium flex items-center gap-2 shadow-2xl pointer-events-none hud-pop"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      <span id="hudText" className="mono text-[11px] text-white/95">
        {message}
      </span>
    </div>
  );
};

interface LongPressSpeedPillProps {
  isActive: boolean;
  speed: number;
}

export const LongPressSpeedPill: React.FC<LongPressSpeedPillProps> = ({ isActive, speed }) => {
  if (!isActive) return null;

  return (
    <div
      id="longPressSpeedPill"
      className="absolute top-6 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 rounded-full bg-white/20 border border-white/30 backdrop-blur-2xl text-white font-semibold text-xs tracking-wide flex items-center gap-2 shadow-2xl pointer-events-none hud-pop"
    >
      <span className="inline-block w-2 h-2 rounded-full bg-white animate-ping" />
      <span id="longPressSpeedText" className="mono text-[12px] font-bold">
        {speed.toFixed(1)}x SPEED
      </span>
    </div>
  );
};

interface CenterFlashOverlayProps {
  flashState: 'play' | 'pause' | null;
}

export const CenterFlashOverlay: React.FC<CenterFlashOverlayProps> = ({ flashState }) => {
  if (!flashState) return null;

  return (
    <div
      id="centerFlashOverlay"
      className="pointer-events-none absolute inset-0 flex items-center justify-center z-20"
    >
      <div className="w-16 h-16 rounded-full bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white hud-pop shadow-2xl">
        {flashState === 'play' ? (
          <Play className="w-7 h-7 fill-white translate-x-0.5" />
        ) : (
          <Pause className="w-7 h-7 fill-white" />
        )}
      </div>
    </div>
  );
};

interface DropZoneOverlayProps {
  isDragging: boolean;
}

export const DropZoneOverlay: React.FC<DropZoneOverlayProps> = ({ isDragging }) => {
  if (!isDragging) return null;

  return (
    <div
      id="dropZoneOverlay"
      className="absolute inset-4 sm:inset-6 rounded-3xl border-2 border-dashed border-white/40 bg-black/85 backdrop-blur-2xl z-50 flex flex-col items-center justify-center text-center p-6 pointer-events-none"
    >
      <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center mb-3 text-white">
        <UploadCloud className="w-8 h-8 animate-bounce" />
      </div>
      <p className="text-lg font-semibold text-white">Drop to Play Instantly</p>
      <p className="text-xs text-white/60 mt-1">
        Supports MP4, MKV, WebM, MOV, AVI, MP3, WAV or .SRT/.VTT Subtitles
      </p>
    </div>
  );
};
