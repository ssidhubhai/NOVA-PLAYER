import React from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  SlidersHorizontal,
  PictureInPicture2,
  Repeat,
} from 'lucide-react';
import { TimelineScrubber } from './TimelineScrubber';
import { Bookmark } from '../types/player';
import { formatTime, formatRemainingTime } from '../utils/formatTime';

interface ControlsOverlayProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  bufferedEnd: number;
  volumePercent: number;
  isMuted: boolean;
  speed: number;
  pointA: number | null;
  pointB: number | null;
  bookmarks: Bookmark[];
  isFullscreen: boolean;
  isToolsOpen: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (percent: number) => void;
  onToggleMute: () => void;
  onSpeedChange: (speed: number) => void;
  onToggleTools: () => void;
  onToggleFullscreen: () => void;
  onTogglePiP: () => void;
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({
  isPlaying,
  currentTime,
  duration,
  bufferedEnd,
  volumePercent,
  isMuted,
  speed,
  pointA,
  pointB,
  bookmarks,
  isFullscreen,
  isToolsOpen,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onSpeedChange,
  onToggleTools,
  onToggleFullscreen,
  onTogglePiP,
}) => {
  const [showRemainingTime, setShowRemainingTime] = React.useState(false);

  const isBoosted = volumePercent > 100;

  const renderVolumeIcon = () => {
    if (isMuted || volumePercent === 0) {
      return <VolumeX className="w-4 h-4 text-rose-400" />;
    }
    if (volumePercent < 50) {
      return <Volume1 className="w-4 h-4 text-white/80" />;
    }
    return <Volume2 className="w-4 h-4 text-white/80" />;
  };

  return (
    <div
      id="controlsOverlay"
      className="player-overlay-ui absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 pb-5 px-4 sm:px-6 z-30 flex flex-col gap-2.5 pointer-events-auto"
    >
      {/* Sleek Hairline Scrubber */}
      <TimelineScrubber
        currentTime={currentTime}
        duration={duration}
        bufferedEnd={bufferedEnd}
        pointA={pointA}
        pointB={pointB}
        bookmarks={bookmarks}
        onSeek={onSeek}
      />

      {/* Control Buttons and Information Row */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 text-xs text-white/85">
        {/* Left Side: Play/Pause, Volume, Time, Indicators */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Play/Pause Button */}
          <button
            id="playPauseBtn"
            type="button"
            onClick={onPlayPause}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white transition cursor-pointer"
            title={isPlaying ? 'Pause (Space / K)' : 'Play (Space / K)'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white translate-x-0.5" />
            )}
          </button>

          {/* Volume Control & Boost up to 200% */}
          <div className="vol-wrap flex items-center gap-1.5 sm:gap-2">
            <button
              id="muteBtn"
              type="button"
              onClick={onToggleMute}
              className="text-white/80 hover:text-white transition p-1 cursor-pointer"
              title="Mute / Unmute (M)"
              aria-label="Toggle mute"
            >
              {renderVolumeIcon()}
            </button>
            <input
              id="volumeSlider"
              type="range"
              min="0"
              max="200"
              value={isMuted ? 0 : volumePercent}
              step="5"
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="seek-bar w-14 sm:w-20 bg-white/20 rounded-full h-1"
              title="Volume & Audio Boost up to 200% (↑/↓)"
              aria-label="Volume slider"
            />
            <span
              id="volumePercentText"
              className={`mono text-[11px] w-9 sm:w-11 ${
                isMuted
                  ? 'text-rose-400'
                  : isBoosted
                  ? 'text-emerald-400 font-semibold'
                  : 'text-white/70'
              }`}
            >
              {isMuted ? 'Mute' : `${volumePercent}%`}
            </span>
          </div>

          {/* Time Readout with click-to-toggle remaining time */}
          <button
            type="button"
            onClick={() => setShowRemainingTime(!showRemainingTime)}
            className="flex items-center gap-1 mono text-[11px] text-white/75 hover:text-white transition px-1 py-0.5 rounded cursor-pointer"
            title="Click to toggle remaining time"
          >
            <span id="currentTimeLabel" className="text-white font-medium">
              {formatTime(currentTime)}
            </span>
            <span className="text-white/30">/</span>
            <span id="durationTimeLabel">
              {showRemainingTime
                ? formatRemainingTime(currentTime, duration)
                : formatTime(duration)}
            </span>
          </button>

          {/* Status Badge Pills */}
          {pointA !== null && (
            <span
              id="abLoopBadge"
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] mono"
              title="Loop active"
            >
              <Repeat className="w-2.5 h-2.5" />
              <span>
                {pointB !== null
                  ? `${formatTime(pointA)} - ${formatTime(pointB)}`
                  : `A: ${formatTime(pointA)}`}
              </span>
            </span>
          )}

          {isBoosted && (
            <span
              id="audioBoostBadge"
              className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] mono hidden sm:inline-block"
            >
              Boost {volumePercent}%
            </span>
          )}
        </div>

        {/* Right Side: Speed, Tools Popover, PiP, Fullscreen */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Speed Selector */}
          <select
            id="speedSelect"
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="bg-white/10 hover:bg-white/15 rounded-full px-2 sm:px-2.5 py-1 text-[11px] mono text-white outline-none cursor-pointer transition border border-white/10"
            title="Playback Speed ([ or ])"
            aria-label="Playback speed"
          >
            <option value="0.25" className="bg-neutral-900 text-white">0.25x</option>
            <option value="0.5" className="bg-neutral-900 text-white">0.5x</option>
            <option value="0.75" className="bg-neutral-900 text-white">0.75x</option>
            <option value="1" className="bg-neutral-900 text-white">1.0x</option>
            <option value="1.25" className="bg-neutral-900 text-white">1.25x</option>
            <option value="1.5" className="bg-neutral-900 text-white">1.5x</option>
            <option value="1.75" className="bg-neutral-900 text-white">1.75x</option>
            <option value="2" className="bg-neutral-900 text-white">2.0x</option>
            <option value="2.5" className="bg-neutral-900 text-white">2.5x</option>
            <option value="3" className="bg-neutral-900 text-white">3.0x</option>
            <option value="4" className="bg-neutral-900 text-white">4.0x</option>
          </select>

          {/* Video Tools Menu Toggle */}
          <button
            id="toggleToolsBtn"
            type="button"
            onClick={onToggleTools}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
              isToolsOpen
                ? 'bg-white text-black'
                : 'hover:bg-white/10 text-white/80 hover:text-white'
            }`}
            title="Playback Tools & Video Filters (E)"
            aria-label="Toggle video tools and filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Picture-in-Picture */}
          <button
            id="pipBtn"
            type="button"
            onClick={onTogglePiP}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
            title="Picture-in-Picture (I)"
            aria-label="Picture in picture"
          >
            <PictureInPicture2 className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            id="fullscreenBtn"
            type="button"
            onClick={onToggleFullscreen}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
