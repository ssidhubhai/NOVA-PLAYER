import React, { useState, useRef } from 'react';
import { Bookmark } from '../types/player';
import { formatTime } from '../utils/formatTime';

interface TimelineScrubberProps {
  currentTime: number;
  duration: number;
  bufferedEnd: number;
  pointA: number | null;
  pointB: number | null;
  bookmarks: Bookmark[];
  onSeek: (time: number) => void;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  currentTime,
  duration,
  bufferedEnd,
  pointA,
  pointB,
  bookmarks,
  onSeek,
}) => {
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const bufferedPercent = duration > 0 ? Math.min(100, Math.max(0, (bufferedEnd / duration) * 100)) : 0;

  let loopStartPercent = 0;
  let loopWidthPercent = 0;
  if (pointA !== null && duration > 0) {
    loopStartPercent = (pointA / duration) * 100;
    if (pointB !== null && pointB > pointA) {
      loopWidthPercent = ((pointB - pointA) / duration) * 100;
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || duration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const ratio = x / rect.width;
    setHoverX(x);
    setHoverTime(ratio * duration);
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const targetTime = (val / 1000) * duration;
    onSeek(targetTime);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="timeline-wrap relative flex items-center h-4 group cursor-pointer"
    >
      {/* Background Track */}
      <div className="w-full h-1 group-hover:h-1.5 transition-all duration-150 bg-white/20 rounded-full overflow-hidden relative">
        {/* Buffered Bar */}
        <div
          id="seekBufferedBar"
          className="absolute inset-y-0 left-0 bg-white/30 transition-[width] duration-200"
          style={{ width: `${bufferedPercent}%` }}
        />

        {/* Playback Progress Bar */}
        <div
          id="seekProgressBar"
          className="absolute inset-y-0 left-0 bg-white"
          style={{ width: `${progressPercent}%` }}
        />

        {/* A-B Loop Region Highlight */}
        {loopWidthPercent > 0 && (
          <div
            id="abLoopRegionBar"
            className="absolute inset-y-0 bg-amber-400/60"
            style={{
              left: `${loopStartPercent}%`,
              width: `${loopWidthPercent}%`,
            }}
          />
        )}
      </div>

      {/* Bookmark Markers */}
      <div id="timelineBookmarkDots" className="absolute inset-x-0 h-1 pointer-events-none">
        {duration > 0 &&
          bookmarks.map((bm) => {
            const leftPct = (bm.time / duration) * 100;
            if (leftPct < 0 || leftPct > 100) return null;
            return (
              <div
                key={bm.id}
                className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm absolute top-[-1px] -translate-x-1/2 z-10"
                style={{ left: `${leftPct}%` }}
                title={`Bookmark: ${formatTime(bm.time)}`}
              />
            );
          })}
      </div>

      {/* Hover Time Tooltip */}
      {hoverTime !== null && (
        <div
          className="absolute bottom-4 -translate-x-1/2 pointer-events-none bg-neutral-900/90 border border-white/20 text-white mono text-[10px] px-1.5 py-0.5 rounded shadow-lg backdrop-blur-sm whitespace-nowrap z-20"
          style={{ left: `${hoverX}px` }}
        >
          {formatTime(hoverTime)}
        </div>
      )}

      {/* Seek range input */}
      <input
        id="seekSlider"
        type="range"
        min="0"
        max="1000"
        value={duration > 0 ? Math.round((progressPercent / 100) * 1000) : 0}
        step="1"
        onChange={handleSliderChange}
        className="seek-bar absolute inset-0 w-full h-full m-0 opacity-0 group-hover:opacity-100"
        aria-label="Seek timeline"
      />
    </div>
  );
};
