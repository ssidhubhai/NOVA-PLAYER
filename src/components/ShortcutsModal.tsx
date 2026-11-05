import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { action: 'Play / Pause', keys: 'Space / K' },
    { action: '2x Speed Hold', keys: 'Hold Space', highlight: true },
    { action: 'Study Notes & Snips', keys: 'N', highlight: true },
    { action: 'Watch History & Resume', keys: 'H' },
    { action: 'Seek Forward / Backward', keys: '→ / ← (+5s / -5s)' },
    { action: 'Volume (0% – 200% Boost)', keys: '↑ / ↓ or Mouse Wheel' },
    { action: 'Mute / Unmute', keys: 'M' },
    { action: 'Speed Down / Up', keys: '[ / ]' },
    { action: 'Reset Speed to 1.0x', keys: '\\' },
    { action: 'Frame Step (-1F / +1F)', keys: ', / .' },
    { action: 'Loop Point A / B / Clear', keys: 'A / B / U' },
    { action: 'Fullscreen / PiP', keys: 'F / I' },
    { action: 'Capture Snapshot', keys: 'S' },
    { action: 'Add Bookmark Timestamp', keys: 'D' },
    { action: 'Rotate 90°', keys: 'R' },
    { action: 'Aspect Fit (Fit/Crop/Fill)', keys: 'Z' },
    { action: 'Playlist & Queue Drawer', keys: 'P' },
    { action: 'Playback & Video Tools', keys: 'E' },
    { action: 'Seek to % Position', keys: '0 – 9 (0% to 90%)' },
    { action: 'Jump to Start / End', keys: 'Home / End' },
  ];

  return (
    <div
      id="shortcutsModal"
      onClick={onClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl bg-neutral-950 border border-white/20 p-6 shadow-2xl text-xs"
      >
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-white">Keyboard Shortcuts</h2>
              <p className="text-[11px] text-white/50">Master NovaPlay with hotkeys</p>
            </div>
          </div>
          <button
            id="closeShortcutsBtn"
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close shortcuts modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-1.5 rounded-lg ${
                sc.highlight ? 'bg-white/10 text-white font-medium' : 'text-white/80'
              }`}
            >
              <span className="truncate pr-2">{sc.action}</span>
              <kbd className="mono px-2 py-0.5 rounded bg-white/10 text-[11px] text-white border border-white/10 whitespace-nowrap">
                {sc.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
