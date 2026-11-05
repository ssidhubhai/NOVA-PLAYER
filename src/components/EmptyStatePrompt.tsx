import React from 'react';
import { Film, PlayCircle, FolderOpen, Sparkles } from 'lucide-react';
import { VideoTrack } from '../types/player';

interface EmptyStatePromptProps {
  isVisible: boolean;
  onOpenFiles: (files: FileList | null) => void;
  sampleTracks: VideoTrack[];
  onSelectSample: (track: VideoTrack) => void;
}

export const EmptyStatePrompt: React.FC<EmptyStatePromptProps> = ({
  isVisible,
  onOpenFiles,
  sampleTracks,
  onSelectSample,
}) => {
  if (!isVisible) return null;

  return (
    <div
      id="emptyStatePrompt"
      className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 pointer-events-none select-none"
    >
      <div className="pointer-events-auto flex flex-col items-center max-w-md w-full p-8 rounded-3xl bg-neutral-950/75 border border-white/10 backdrop-blur-2xl shadow-2xl text-center">
        {/* Main Open Local Video Button */}
        <label
          htmlFor="emptyStateFileInput"
          className="group cursor-pointer flex flex-col items-center gap-3.5 px-8 py-6 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all duration-200 w-full"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/10 group-hover:bg-white/15 flex items-center justify-center text-white transition shadow-lg group-hover:scale-105">
            <FolderOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-base font-semibold text-white tracking-tight">
              Open or Drop Video
            </p>
            <p className="text-xs text-white/50 mt-1">
              MP4, WebM, MKV, MOV · Space / → Hold for 2x
            </p>
          </div>
        </label>
        <input
          id="emptyStateFileInput"
          type="file"
          accept="video/*,audio/*,.mkv,.mp4,.webm,.avi,.mov,.m4v,.ogg"
          multiple
          className="hidden"
          onChange={(e) => onOpenFiles(e.target.files)}
        />

        {/* Sample Demo Clips Section */}
        <div className="mt-6 w-full pt-5 border-t border-white/10">
          <div className="flex items-center justify-center gap-1.5 text-xs text-white/60 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Or try a sample video</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
            {sampleTracks.slice(0, 4).map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => onSelectSample(sample)}
                className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-white/80 hover:text-white transition cursor-pointer text-xs"
              >
                <Film className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="truncate flex-1 font-medium text-[11px]">
                  {sample.name.split('(')[0].trim()}
                </span>
                <PlayCircle className="w-3.5 h-3.5 text-white/40 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
