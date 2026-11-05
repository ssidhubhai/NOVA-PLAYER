import React, { useState } from 'react';
import {
  X,
  Play,
  Trash2,
  BookmarkPlus,
  Camera,
  Download,
  ListVideo,
  Bookmark as BookmarkIcon,
  Image as ImageIcon,
  Plus,
  History as HistoryIcon,
  RotateCcw,
  Maximize2,
} from 'lucide-react';
import { VideoTrack, Bookmark, Snapshot, HistoryItem, LoopMode } from '../types/player';
import { formatTime } from '../utils/formatTime';
import { formatRelativeDate } from '../utils/historyAndNotes';
import { FullScreenImageViewer } from './FullScreenImageViewer';

interface PlaylistSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'queue' | 'history' | 'bookmarks' | 'snapshots';
  playlist: VideoTrack[];
  currentIndex: number;
  loopMode: LoopMode;
  onSelectTrack: (index: number) => void;
  onRemoveTrack: (index: number) => void;
  onClearPlaylist: () => void;
  onToggleLoopMode: () => void;
  // History
  history: HistoryItem[];
  onResumeHistory: (item: HistoryItem) => void;
  onRemoveHistoryItem: (id: string) => void;
  onClearHistory: () => void;
  // Bookmarks
  bookmarks: Bookmark[];
  onAddBookmark: () => void;
  onSelectBookmark: (time: number) => void;
  onRemoveBookmark: (index: number) => void;
  // Snapshots
  snapshots: Snapshot[];
  onCaptureSnapshot: () => void;
  onRemoveSnapshot: (index: number) => void;
  onOpenFiles: (files: FileList | null) => void;
}

export const PlaylistSidebar: React.FC<PlaylistSidebarProps> = ({
  isOpen,
  onClose,
  initialTab = 'queue',
  playlist,
  currentIndex,
  loopMode,
  onSelectTrack,
  onRemoveTrack,
  onClearPlaylist,
  onToggleLoopMode,
  history,
  onResumeHistory,
  onRemoveHistoryItem,
  onClearHistory,
  bookmarks,
  onAddBookmark,
  onSelectBookmark,
  onRemoveBookmark,
  snapshots,
  onCaptureSnapshot,
  onRemoveSnapshot,
  onOpenFiles,
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'history' | 'bookmarks' | 'snapshots'>(
    initialTab
  );
  const [viewerImage, setViewerImage] = useState<{ url: string; timeStr: string } | null>(null);

  // Sync if initialTab prop changes
  React.useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  return (
    <aside
      id="playlistSidebar"
      className="absolute top-16 right-4 sm:right-6 bottom-20 w-88 max-w-[calc(100vw-2rem)] rounded-2xl bg-neutral-950/92 border border-white/15 backdrop-blur-2xl flex flex-col z-40 overflow-hidden shadow-2xl text-xs select-none"
    >
      {/* Tab Navigation & Close */}
      <div className="flex items-center border-b border-white/10 text-[11px] font-medium bg-black/40 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`flex-1 py-2.5 px-2 flex items-center justify-center gap-1 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'queue'
              ? 'border-white text-white font-semibold'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <ListVideo className="w-3.5 h-3.5" />
          <span>Queue ({playlist.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 px-2 flex items-center justify-center gap-1 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-emerald-400 text-emerald-300 font-semibold'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <HistoryIcon className="w-3.5 h-3.5" />
          <span>History ({history.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bookmarks')}
          className={`flex-1 py-2.5 px-2 flex items-center justify-center gap-1 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'bookmarks'
              ? 'border-amber-400 text-amber-300 font-semibold'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <BookmarkIcon className="w-3.5 h-3.5" />
          <span>Marks ({bookmarks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('snapshots')}
          className={`flex-1 py-2.5 px-2 flex items-center justify-center gap-1 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'snapshots'
              ? 'border-white text-white font-semibold'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Snaps ({snapshots.length})</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="p-2 text-white/50 hover:text-white transition cursor-pointer"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Panel: History */}
      {activeTab === 'history' && (
        <div id="panelHistory" className="flex-1 flex flex-col overflow-hidden p-3 gap-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/50 font-medium">Continue Watching</span>
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="px-2 py-0.5 rounded bg-white/10 hover:bg-rose-500/20 text-white/60 hover:text-rose-300 text-[10px] cursor-pointer"
              >
                Clear History
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {history.length === 0 ? (
              <div className="text-center py-10 px-4 text-white/40">
                <HistoryIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No watch history yet</p>
                <p className="text-[11px] text-white/30 mt-1">
                  Videos you watch will appear here so you can continue without reopening
                </p>
              </div>
            ) : (
              history.map((item) => {
                const progressPct =
                  item.duration > 0
                    ? Math.min(100, Math.round((item.lastTime / item.duration) * 100))
                    : 0;

                return (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition flex flex-col gap-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-white truncate" title={item.title}>
                          {item.title}
                        </p>
                        <p className="text-[10px] text-white/40 flex items-center gap-1.5 mt-0.5">
                          <span>{formatRelativeDate(item.lastWatchedAt)}</span>
                          <span>·</span>
                          <span className="mono text-emerald-400 font-medium">
                            {formatTime(item.lastTime)} / {formatTime(item.duration)}
                          </span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveHistoryItem(item.id)}
                        className="text-white/30 hover:text-rose-400 p-1 transition cursor-pointer"
                        title="Remove from history"
                        aria-label={`Remove ${item.title} from history`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-white/15 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    {/* Resume Button */}
                    <button
                      type="button"
                      onClick={() => onResumeHistory(item)}
                      className="w-full py-1.5 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Resume at {formatTime(item.lastTime)} ({progressPct}%)</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Panel: Videos Queue */}
      {activeTab === 'queue' && (
        <div id="panelQueue" className="flex-1 flex flex-col overflow-hidden p-3 gap-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/50 font-medium">Video Playlist</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleLoopMode}
                className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/15 text-white/90 mono text-[10px] cursor-pointer"
                title="Toggle loop mode"
              >
                Loop: {loopMode.toUpperCase()}
              </button>
              {playlist.length > 0 && (
                <button
                  type="button"
                  onClick={onClearPlaylist}
                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-rose-500/20 text-white/60 hover:text-rose-300 text-[10px] cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div
            id="playlistItemsContainer"
            className="flex-1 overflow-y-auto space-y-1.5 pr-1"
          >
            {playlist.length === 0 ? (
              <div className="text-center py-10 px-4 text-white/40">
                <ListVideo className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No videos in queue</p>
                <p className="text-[11px] text-white/30 mt-1">
                  Open local files or select a sample clip
                </p>
              </div>
            ) : (
              playlist.map((track, idx) => {
                const isCurrent = idx === currentIndex;
                return (
                  <div
                    key={track.id}
                    onClick={() => onSelectTrack(idx)}
                    className={`flex items-center justify-between gap-2 p-2 rounded-xl cursor-pointer transition ${
                      isCurrent
                        ? 'bg-white/20 text-white shadow-sm border border-white/20'
                        : 'hover:bg-white/5 text-white/70 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {isCurrent ? (
                        <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shrink-0">
                          <Play className="w-2.5 h-2.5 fill-black translate-x-0.2" />
                        </div>
                      ) : (
                        <span className="w-5 text-center text-white/40 mono text-[10px]">
                          {idx + 1}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">
                          {track.name}
                        </p>
                        <p className="text-[10px] text-white/40 mono">
                          {track.sizeText || 'Video Track'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTrack(idx);
                      }}
                      className="text-white/40 hover:text-rose-400 p-1 transition cursor-pointer"
                      title="Remove from queue"
                      aria-label={`Remove ${track.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Add file button */}
          <label
            htmlFor="sidebarAddFileInput"
            className="w-full py-2 rounded-xl border border-dashed border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer transition text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add More Videos</span>
          </label>
          <input
            id="sidebarAddFileInput"
            type="file"
            accept="video/*,audio/*,.mkv,.mp4,.webm,.avi,.mov,.m4v,.ogg"
            multiple
            className="hidden"
            onChange={(e) => onOpenFiles(e.target.files)}
          />
        </div>
      )}

      {/* Panel: Bookmarks */}
      {activeTab === 'bookmarks' && (
        <div id="panelBookmarks" className="flex-1 flex flex-col overflow-hidden p-3 gap-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/50 font-medium">Saved Timestamps</span>
            <button
              type="button"
              onClick={onAddBookmark}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/30 text-[10px] font-medium cursor-pointer transition"
              title="Bookmark current timestamp (D)"
            >
              <BookmarkPlus className="w-3 h-3" />
              <span>Mark Now (D)</span>
            </button>
          </div>

          <div
            id="bookmarksListContainer"
            className="flex-1 overflow-y-auto space-y-1.5 pr-1"
          >
            {bookmarks.length === 0 ? (
              <div className="text-center py-10 px-4 text-white/40">
                <BookmarkIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No bookmarks saved yet</p>
                <p className="text-[11px] text-white/30 mt-1">
                  Press D while watching to bookmark key moments
                </p>
              </div>
            ) : (
              bookmarks.map((bm, idx) => (
                <div
                  key={bm.id}
                  onClick={() => onSelectBookmark(bm.time)}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/5 cursor-pointer transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <div>
                      <span className="mono text-white/90 font-medium text-xs">
                        {formatTime(bm.time)}
                      </span>
                      <p className="text-[10px] text-white/40">{bm.label}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveBookmark(idx);
                    }}
                    className="text-white/40 hover:text-rose-400 p-1 cursor-pointer"
                    title="Delete bookmark"
                    aria-label={`Delete bookmark at ${formatTime(bm.time)}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Panel: Snapshots */}
      {activeTab === 'snapshots' && (
        <div id="panelSnapshots" className="flex-1 flex flex-col overflow-hidden p-3 gap-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/50 font-medium">Captured Frames</span>
            <button
              type="button"
              onClick={onCaptureSnapshot}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-400/20 hover:bg-emerald-400/30 text-emerald-300 border border-emerald-400/30 text-[10px] font-medium cursor-pointer transition"
              title="Capture current video frame (S)"
            >
              <Camera className="w-3 h-3" />
              <span>Capture (S)</span>
            </button>
          </div>

          <div
            id="snapshotsListContainer"
            className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 pr-1"
          >
            {snapshots.length === 0 ? (
              <div className="col-span-2 text-center py-10 px-4 text-white/40">
                <Camera className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No frame snapshots yet</p>
                <p className="text-[11px] text-white/30 mt-1">
                  Press S to grab full-resolution image stills
                </p>
              </div>
            ) : (
              snapshots.map((snap, idx) => (
                <div
                  key={snap.id}
                  className="rounded-xl overflow-hidden bg-white/5 border border-white/10 flex flex-col group relative"
                >
                  <img
                    src={snap.dataUrl}
                    alt={`Frame at ${snap.timeStr}`}
                    onClick={() => setViewerImage({ url: snap.dataUrl, timeStr: snap.timeStr })}
                    className="w-full h-20 object-cover bg-black cursor-pointer hover:opacity-90 transition"
                  />
                  <div className="p-1.5 flex items-center justify-between bg-black/60 backdrop-blur-sm text-[10px]">
                    <span className="mono text-white/80 font-medium">
                      {snap.timeStr}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setViewerImage({ url: snap.dataUrl, timeStr: snap.timeStr })}
                        className="p-1 text-white/80 hover:text-white rounded hover:bg-white/20 transition cursor-pointer"
                        title="View Full Screen"
                      >
                        <Maximize2 className="w-3 h-3" />
                      </button>
                      <a
                        href={snap.dataUrl}
                        download={`novaplay-frame-${snap.timeStr.replace(/:/g, '-')}.png`}
                        className="p-1 text-white/80 hover:text-white rounded hover:bg-white/20 transition cursor-pointer"
                        title="Download PNG"
                        aria-label="Download image still"
                      >
                        <Download className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => onRemoveSnapshot(idx)}
                        className="p-1 text-white/40 hover:text-rose-400 rounded hover:bg-white/20 transition cursor-pointer"
                        title="Delete snapshot"
                        aria-label="Delete image still"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Full-Screen viewer for snapshots */}
      {viewerImage && (
        <FullScreenImageViewer
          imageUrl={viewerImage.url}
          title="Snapshot Still"
          timestampStr={viewerImage.timeStr}
          onClose={() => setViewerImage(null)}
        />
      )}
    </aside>
  );
};
