import React from 'react';
import { X, Film, Sparkles, Play, Check } from 'lucide-react';
import { VideoTrack } from '../types/player';

interface SampleClipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleTracks: VideoTrack[];
  currentTrackId?: string;
  onSelectTrack: (track: VideoTrack) => void;
  onSelectProceduralSynth: () => void;
}

export const SampleClipsModal: React.FC<SampleClipsModalProps> = ({
  isOpen,
  onClose,
  sampleTracks,
  currentTrackId,
  onSelectTrack,
  onSelectProceduralSynth,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-neutral-950 border border-white/20 p-6 shadow-2xl text-xs"
      >
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-white">Sample Video Clips</h2>
              <p className="text-[11px] text-white/50">Pick a sample or canvas generator</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close sample clips modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {/* Built-in Interactive Procedural Synthwave Stream */}
          <button
            type="button"
            onClick={() => {
              onSelectProceduralSynth();
              onClose();
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-purple-900/30 via-indigo-900/30 to-black/40 hover:from-purple-900/50 hover:via-indigo-900/50 border border-purple-500/30 hover:border-purple-500/60 transition text-left cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center group-hover:scale-105 transition">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-white text-xs">
                  NovaSynth Ambient Stream
                </p>
                <p className="text-[10px] text-white/50">
                  Built-in canvas audio visualizer · 100% Offline
                </p>
              </div>
            </div>
            <Play className="w-4 h-4 text-purple-300" />
          </button>

          {/* Curated Open Media Clips */}
          {sampleTracks.map((track) => {
            const isSelected = track.id === currentTrackId;
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => {
                  onSelectTrack(track);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition text-left cursor-pointer ${
                  isSelected
                    ? 'bg-white/15 border-white/30 text-white'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Film className="w-4 h-4 text-white/80" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-xs truncate">{track.name}</p>
                    <p className="text-[10px] text-white/40 mono">{track.sizeText}</p>
                  </div>
                </div>
                {isSelected ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-white/40 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
