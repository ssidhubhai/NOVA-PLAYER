import React from 'react';
import {
  RotateCw,
  FlipHorizontal,
  BookmarkPlus,
  Camera,
  FileText,
  X,
  RotateCcw,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { FitMode, VideoTransformSettings } from '../types/player';

interface StudioToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: () => void;
  // Transport
  skipStepSeconds: number;
  onSeekRelative: (deltaSeconds: number) => void;
  onStepFrame: (direction: number) => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  // Speed
  speed: number;
  onSpeedChange: (speed: number) => void;
  holdSpeedMultiplier: number;
  onHoldSpeedChange: (speed: number) => void;
  onSkipStepChange: (seconds: number) => void;
  // A-B Loop
  onSetPointA: () => void;
  onSetPointB: () => void;
  onClearLoop: () => void;
  // Actions
  onAddBookmark: () => void;
  onCaptureSnapshot: () => void;
  onOpenNotes?: () => void;
  // Transform & Filters
  transforms: VideoTransformSettings;
  onUpdateTransform: (updates: Partial<VideoTransformSettings>) => void;
  // Subtitle sync
  subtitleOffset: number;
  onSubtitleOffsetChange: (offset: number) => void;
}

export const StudioToolsModal: React.FC<StudioToolsModalProps> = ({
  isOpen,
  onClose,
  onReset,
  skipStepSeconds,
  onSeekRelative,
  onStepFrame,
  onPrevTrack,
  onNextTrack,
  speed,
  onSpeedChange,
  holdSpeedMultiplier,
  onHoldSpeedChange,
  onSkipStepChange,
  onSetPointA,
  onSetPointB,
  onClearLoop,
  onAddBookmark,
  onCaptureSnapshot,
  onOpenNotes,
  transforms,
  onUpdateTransform,
  subtitleOffset,
  onSubtitleOffsetChange,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="studioToolsPanel"
      className="absolute bottom-20 right-4 sm:right-6 w-84 max-w-[calc(100vw-2rem)] rounded-2xl bg-neutral-950/92 border border-white/15 backdrop-blur-2xl p-4 z-40 shadow-2xl text-xs select-none"
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
        <span className="font-semibold text-white tracking-wide">
          Playback & Video Tools
        </span>
        <div className="flex items-center gap-2">
          <button
            id="resetStudioBtn"
            type="button"
            onClick={onReset}
            className="text-[11px] text-white/60 hover:text-white transition flex items-center gap-1 cursor-pointer"
            title="Reset video filters and transforms"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
          <button
            id="closeStudioBtn"
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
            aria-label="Close tools menu"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-[62vh] overflow-y-auto pr-1">
        {/* Transport & Frame Step */}
        <div className="flex items-center justify-between gap-1 bg-white/5 p-2 rounded-xl">
          <button
            type="button"
            onClick={onPrevTrack}
            className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
            title="Previous video (Shift+P)"
            aria-label="Previous video"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSeekRelative(-skipStepSeconds)}
            className="px-2 py-1 rounded hover:bg-white/10 text-white/80 hover:text-white mono text-[11px] cursor-pointer"
            title={`Seek back ${skipStepSeconds}s (←)`}
          >
            -{skipStepSeconds}s
          </button>
          <button
            type="button"
            onClick={() => onStepFrame(-1)}
            className="px-2 py-1 rounded hover:bg-white/10 text-white/80 hover:text-white mono text-[11px] cursor-pointer"
            title="Step back 1 frame (,)"
          >
            -1F
          </button>
          <button
            type="button"
            onClick={() => onStepFrame(1)}
            className="px-2 py-1 rounded hover:bg-white/10 text-white/80 hover:text-white mono text-[11px] cursor-pointer"
            title="Step forward 1 frame (.)"
          >
            +1F
          </button>
          <button
            type="button"
            onClick={() => onSeekRelative(skipStepSeconds)}
            className="px-2 py-1 rounded hover:bg-white/10 text-white/80 hover:text-white mono text-[11px] cursor-pointer"
            title={`Seek forward ${skipStepSeconds}s (→)`}
          >
            +{skipStepSeconds}s
          </button>
          <button
            type="button"
            onClick={onNextTrack}
            className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
            title="Next video (Shift+N)"
            aria-label="Next video"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed Stepper, Loop A-B, Bookmark & Snapshot */}
        <div className="flex items-center justify-between gap-1.5 bg-white/5 p-2 rounded-xl">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSpeedChange(Math.max(0.25, speed - 0.25))}
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 mono cursor-pointer"
              title="Speed down ([)"
            >
              -
            </button>
            <span className="mono text-[10px] text-white/70 px-1">
              {speed.toFixed(2)}x
            </span>
            <button
              type="button"
              onClick={() => onSpeedChange(Math.min(4.0, speed + 0.25))}
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 mono cursor-pointer"
              title="Speed up (])"
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onSetPointA}
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 mono text-[11px] cursor-pointer"
              title="Set Loop Point A (A)"
            >
              A
            </button>
            <button
              type="button"
              onClick={onSetPointB}
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 mono text-[11px] cursor-pointer"
              title="Set Loop Point B (B)"
            >
              B
            </button>
            <button
              type="button"
              onClick={onClearLoop}
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-[11px] text-white/60 hover:text-white cursor-pointer"
              title="Clear Loop (U)"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onAddBookmark}
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-[11px] flex items-center gap-0.5 cursor-pointer"
              title="Bookmark timestamp (D)"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-amber-300" />
            </button>
            <button
              type="button"
              onClick={onCaptureSnapshot}
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-[11px] flex items-center gap-0.5 cursor-pointer"
              title="Capture snapshot frame (S)"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-300" />
            </button>
            {onOpenNotes && (
              <button
                type="button"
                onClick={onOpenNotes}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-[11px] flex items-center gap-0.5 cursor-pointer text-amber-300"
                title="Study Notes & Snips (N)"
              >
                <FileText className="w-3.5 h-3.5 text-amber-300" />
              </button>
            )}
          </div>
        </div>

        {/* Long-Press Hold Speed & Skip Interval Config */}
        <div className="grid grid-cols-2 gap-2 bg-white/5 p-2.5 rounded-xl">
          <div>
            <label
              htmlFor="holdSpeedSelect"
              className="block text-[10px] text-white/50 mb-1"
            >
              Hold Speed (Space/→)
            </label>
            <select
              id="holdSpeedSelect"
              value={holdSpeedMultiplier}
              onChange={(e) => onHoldSpeedChange(parseFloat(e.target.value))}
              className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-white mono text-[11px] outline-none"
            >
              <option value="1.5">1.5x Speed</option>
              <option value="2">2.0x Speed (Default)</option>
              <option value="2.5">2.5x Speed</option>
              <option value="3">3.0x Speed</option>
              <option value="4">4.0x Speed</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="skipStepSelect"
              className="block text-[10px] text-white/50 mb-1"
            >
              Skip Step (←/→)
            </label>
            <select
              id="skipStepSelect"
              value={skipStepSeconds}
              onChange={(e) => onSkipStepChange(parseInt(e.target.value, 10))}
              className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-white mono text-[11px] outline-none"
            >
              <option value="2">2 Seconds</option>
              <option value="5">5 Seconds (Default)</option>
              <option value="10">10 Seconds</option>
              <option value="15">15 Seconds</option>
              <option value="30">30 Seconds</option>
            </select>
          </div>
        </div>

        {/* Aspect Fit & Transform */}
        <div className="bg-white/5 p-2.5 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white/60">Aspect Fit (Z)</span>
            <div className="flex gap-1">
              {(['contain', 'cover', 'fill'] as FitMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onUpdateTransform({ fitMode: mode })}
                  className={`px-2 py-0.5 rounded font-medium cursor-pointer transition ${
                    transforms.fitMode === mode
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  {mode === 'contain' ? 'Fit' : mode === 'cover' ? 'Crop' : 'Stretch'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white/60">Transform</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() =>
                  onUpdateTransform({
                    rotation: (transforms.rotation + 90) % 360,
                  })
                }
                className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-white mono text-[11px] cursor-pointer"
                title="Rotate 90° (R)"
              >
                <RotateCw className="w-3 h-3" />
                <span>90°</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateTransform({ flipH: !transforms.flipH })
                }
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] cursor-pointer transition ${
                  transforms.flipH
                    ? 'bg-white text-black font-medium'
                    : 'bg-white/10 hover:bg-white/15 text-white'
                }`}
                title="Mirror Flip (H)"
              >
                <FlipHorizontal className="w-3 h-3" />
                <span>Mirror</span>
              </button>
            </div>
          </div>
        </div>

        {/* Visual Sliders: Zoom, Brightness, Contrast, Saturation */}
        <div className="bg-white/5 p-2.5 rounded-xl space-y-2.5 slider-group">
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-white/60">Zoom Scale</span>
              <span className="mono text-white/90">{transforms.zoom}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="250"
              value={transforms.zoom}
              step="5"
              onChange={(e) =>
                onUpdateTransform({ zoom: parseInt(e.target.value, 10) })
              }
              className="seek-bar w-full bg-white/20 rounded-full h-1"
              aria-label="Zoom scale"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-white/60">Brightness</span>
              <span className="mono text-white/90">{transforms.brightness}%</span>
            </div>
            <input
              type="range"
              min="40"
              max="200"
              value={transforms.brightness}
              step="5"
              onChange={(e) =>
                onUpdateTransform({ brightness: parseInt(e.target.value, 10) })
              }
              className="seek-bar w-full bg-white/20 rounded-full h-1"
              aria-label="Brightness"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-white/60">Contrast</span>
              <span className="mono text-white/90">{transforms.contrast}%</span>
            </div>
            <input
              type="range"
              min="40"
              max="200"
              value={transforms.contrast}
              step="5"
              onChange={(e) =>
                onUpdateTransform({ contrast: parseInt(e.target.value, 10) })
              }
              className="seek-bar w-full bg-white/20 rounded-full h-1"
              aria-label="Contrast"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-white/60">Saturation</span>
              <span className="mono text-white/90">{transforms.saturation}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="250"
              value={transforms.saturation}
              step="5"
              onChange={(e) =>
                onUpdateTransform({ saturation: parseInt(e.target.value, 10) })
              }
              className="seek-bar w-full bg-white/20 rounded-full h-1"
              aria-label="Saturation"
            />
          </div>
        </div>

        {/* Subtitle Sync Offset */}
        <div className="bg-white/5 p-2.5 rounded-xl flex items-center justify-between">
          <span className="text-white/60">Subtitle Sync</span>
          <div className="flex items-center gap-1.5 mono">
            <button
              type="button"
              onClick={() => onSubtitleOffsetChange(subtitleOffset - 0.5)}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/15 text-white/80 cursor-pointer"
              title="Earlier 0.5s"
            >
              -0.5s
            </button>
            <span className="text-white font-medium w-12 text-center text-[11px]">
              {subtitleOffset >= 0
                ? `+${subtitleOffset.toFixed(1)}s`
                : `${subtitleOffset.toFixed(1)}s`}
            </span>
            <button
              type="button"
              onClick={() => onSubtitleOffsetChange(subtitleOffset + 0.5)}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/15 text-white/80 cursor-pointer"
              title="Later 0.5s"
            >
              +0.5s
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
