import React from 'react';
import {
  FolderOpen,
  Subtitles,
  ListVideo,
  HelpCircle,
  Film,
  FileText,
  History as HistoryIcon,
} from 'lucide-react';

interface HeaderBarProps {
  nowPlayingTitle: string;
  playlistCount: number;
  historyCount: number;
  notesCount: number;
  onOpenFiles: (files: FileList | null) => void;
  onOpenSubtitles: (files: FileList | null) => void;
  onTogglePlaylist: () => void;
  onOpenHistory: () => void;
  onOpenNotes: () => void;
  onOpenShortcuts: () => void;
  isPlaylistOpen: boolean;
  isNotesOpen: boolean;
  onSelectSampleDemo?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  nowPlayingTitle,
  playlistCount,
  historyCount,
  notesCount,
  onOpenFiles,
  onOpenSubtitles,
  onTogglePlaylist,
  onOpenHistory,
  onOpenNotes,
  onOpenShortcuts,
  isPlaylistOpen,
  isNotesOpen,
  onSelectSampleDemo,
}) => {
  return (
    <header
      id="appHeader"
      className="player-overlay-ui absolute top-0 inset-x-0 px-4 sm:px-6 pt-4 sm:pt-5 pb-8 bg-gradient-to-b from-black/85 via-black/35 to-transparent flex items-center justify-between gap-3 z-30 pointer-events-auto select-none"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
        <p
          id="nowPlayingTitle"
          className="text-xs sm:text-sm font-medium text-white/85 truncate max-w-[160px] sm:max-w-xs md:max-w-md lg:max-w-lg"
          title={nowPlayingTitle}
        >
          {nowPlayingTitle || 'NovaPlay — Ready'}
        </p>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {onSelectSampleDemo && (
          <button
            type="button"
            onClick={onSelectSampleDemo}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white/90 hover:text-white text-xs font-medium transition cursor-pointer"
            title="Load Sample Demo Video"
          >
            <Film className="w-3.5 h-3.5 text-amber-300" />
            <span>Sample Clips</span>
          </button>
        )}

        {/* Notes & Snips Button */}
        <button
          id="openNotesBtn"
          type="button"
          onClick={onOpenNotes}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md text-xs font-medium transition cursor-pointer ${
            isNotesOpen
              ? 'bg-amber-400 text-black font-semibold'
              : 'bg-white/10 hover:bg-white/20 text-amber-300 hover:text-amber-200'
          }`}
          title="Video Study Notes & Snips (N)"
          aria-label="Open study notes and snips"
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Notes</span>
          {notesCount > 0 && (
            <span
              className={`mono text-[10px] px-1.5 py-0.2 rounded-full ${
                isNotesOpen ? 'bg-black text-amber-300' : 'bg-amber-400/25 text-amber-300'
              }`}
            >
              {notesCount}
            </span>
          )}
        </button>

        {/* History Quick Access */}
        <button
          id="openHistoryBtn"
          type="button"
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/15 backdrop-blur-md text-white/80 hover:text-white text-xs font-medium transition cursor-pointer"
          title="Watch History & Resume (H)"
          aria-label="Open watch history"
        >
          <HistoryIcon className="w-3.5 h-3.5" />
          <span className="hidden md:inline">History</span>
          {historyCount > 0 && (
            <span className="mono text-[10px] text-white/50">
              {historyCount}
            </span>
          )}
        </button>

        {/* Open Local Video File Input */}
        <label
          htmlFor="videoFileInput"
          className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-medium transition"
          title="Open Video or Audio File"
        >
          <FolderOpen className="w-3.5 h-3.5 text-white/90" />
          <span className="hidden sm:inline">Open Videos</span>
          <span className="sm:hidden">Open</span>
        </label>
        <input
          id="videoFileInput"
          type="file"
          accept="video/*,audio/*,.mkv,.mp4,.webm,.avi,.mov,.m4v,.ogg"
          multiple
          className="hidden"
          onChange={(e) => onOpenFiles(e.target.files)}
        />

        {/* Load Subtitles */}
        <label
          htmlFor="subtitleFileInput"
          className="cursor-pointer flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/15 backdrop-blur-md text-white/75 hover:text-white text-xs transition"
          title="Load .SRT or .VTT Subtitles"
        >
          <Subtitles className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold">CC</span>
        </label>
        <input
          id="subtitleFileInput"
          type="file"
          accept=".srt,.vtt"
          className="hidden"
          onChange={(e) => onOpenSubtitles(e.target.files)}
        />

        {/* Toggle Playlist / Bookmarks / Snaps Drawer */}
        <button
          id="togglePlaylistBtn"
          type="button"
          onClick={onTogglePlaylist}
          className={`px-2.5 py-1.5 rounded-full backdrop-blur-md text-xs transition flex items-center gap-1.5 cursor-pointer ${
            isPlaylistOpen
              ? 'bg-white text-black font-semibold'
              : 'bg-white/5 hover:bg-white/15 text-white/80 hover:text-white'
          }`}
          title="Playlist, History & Bookmarks (P)"
          aria-label="Toggle playlist and bookmarks drawer"
        >
          <ListVideo className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Queue</span>
          <span
            id="playlistCountBadge"
            className={`mono text-[10px] px-1.5 py-0.2 rounded-full ${
              isPlaylistOpen ? 'bg-black text-white' : 'bg-white/15 text-white/90'
            }`}
          >
            {playlistCount}
          </span>
        </button>

        {/* Keyboard Shortcuts */}
        <button
          id="openShortcutsBtn"
          type="button"
          onClick={onOpenShortcuts}
          className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 backdrop-blur-md text-white/75 hover:text-white text-xs flex items-center justify-center transition cursor-pointer"
          title="Keyboard Shortcuts (?)"
          aria-label="Keyboard Shortcuts"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
