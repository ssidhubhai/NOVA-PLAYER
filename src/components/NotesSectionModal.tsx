import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Camera,
  Trash2,
  Clock,
  Plus,
  Sparkles,
  ExternalLink,
  Edit2,
  Check,
} from 'lucide-react';
import { VideoNote, Snapshot } from '../types/player';
import { formatTime } from '../utils/formatTime';
import { formatRelativeDate } from '../utils/historyAndNotes';
import { exportNotesToPdf } from '../utils/pdfExport';

interface NotesSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVideoId: string;
  currentVideoTitle: string;
  currentTime: number;
  notes: VideoNote[];
  snapshots: Snapshot[];
  onAddNote: (note: Omit<VideoNote, 'id' | 'createdAt'>) => void;
  onUpdateNoteText: (noteId: string, newText: string) => void;
  onDeleteNote: (noteId: string) => void;
  onSeekToTime: (time: number) => void;
  onCaptureFrameForNote: () => string | null; // captures frame and returns dataUrl
  showToast: (msg: string) => void;
}

export const NotesSectionModal: React.FC<NotesSectionModalProps> = ({
  isOpen,
  onClose,
  currentVideoId,
  currentVideoTitle,
  currentTime,
  notes,
  snapshots,
  onAddNote,
  onUpdateNoteText,
  onDeleteNote,
  onSeekToTime,
  onCaptureFrameForNote,
  showToast,
}) => {
  const [filterMode, setFilterMode] = useState<'current' | 'all'>('current');
  const [noteText, setNoteText] = useState<string>('');
  const [attachCurrentFrame, setAttachCurrentFrame] = useState<boolean>(true);
  const [selectedSnapshotUrl, setSelectedSnapshotUrl] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredNotes =
    filterMode === 'current'
      ? notes.filter((n) => n.videoId === currentVideoId)
      : notes;

  const handleSaveNote = () => {
    if (!noteText.trim() && !attachCurrentFrame && !selectedSnapshotUrl) {
      showToast('Please type a note or attach a frame snip');
      return;
    }

    let finalSnipUrl: string | undefined = selectedSnapshotUrl || undefined;
    if (attachCurrentFrame && !finalSnipUrl) {
      const captured = onCaptureFrameForNote();
      if (captured) finalSnipUrl = captured;
    }

    onAddNote({
      videoId: currentVideoId || 'general',
      videoTitle: currentVideoTitle || 'Video',
      timestamp: currentTime,
      text: noteText.trim() || 'Frame capture snapshot',
      snapshotDataUrl: finalSnipUrl,
    });

    setNoteText('');
    setSelectedSnapshotUrl(null);
    showToast(`Note saved at ${formatTime(currentTime)}`);
  };

  const handleExportPdf = async () => {
    if (filteredNotes.length === 0) {
      showToast('No notes to export');
      return;
    }
    setIsExportingPdf(true);
    showToast('Generating PDF document...');
    try {
      await exportNotesToPdf({
        notes: filteredNotes,
        videoTitle: currentVideoTitle || 'NovaPlay Notes',
      });
      showToast('PDF downloaded successfully!');
    } catch {
      showToast('Failed to generate PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div
      id="notesModal"
      onClick={onClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl h-[88vh] max-h-[760px] rounded-3xl bg-neutral-950/95 border border-white/20 p-5 sm:p-6 shadow-2xl text-xs flex flex-col"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm sm:text-base text-white">
                Study Notes & Frame Snips
              </h2>
              <p className="text-[11px] text-white/50 truncate max-w-xs sm:max-w-md">
                {currentVideoTitle} · {formatTime(currentTime)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export as PDF button */}
            <button
              type="button"
              disabled={isExportingPdf || filteredNotes.length === 0}
              onClick={handleExportPdf}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition cursor-pointer ${
                filteredNotes.length === 0
                  ? 'bg-white/5 text-white/30 cursor-not-allowed'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
              }`}
              title="Export all notes & snips as a clean, structured PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'Exporting...' : 'Export PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Close notes panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pill Tabs */}
        <div className="flex items-center justify-between pb-3 shrink-0">
          <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterMode('current')}
              className={`px-3 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                filterMode === 'current'
                  ? 'bg-white text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Current Video ({notes.filter((n) => n.videoId === currentVideoId).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              All Notes ({notes.length})
            </button>
          </div>

          <span className="text-[11px] text-white/40 mono hidden sm:inline">
            Press N to toggle notes
          </span>
        </div>

        {/* New Note Creator Box */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 mb-3.5 shrink-0 space-y-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/70 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>Timestamp:</span>
              <span className="mono text-white font-semibold px-1.5 py-0.5 rounded bg-white/10">
                {formatTime(currentTime)}
              </span>
            </span>

            {/* Attach Current Frame Checkbox */}
            <label className="flex items-center gap-1.5 text-white/70 hover:text-white cursor-pointer">
              <input
                type="checkbox"
                checked={attachCurrentFrame}
                onChange={(e) => setAttachCurrentFrame(e.target.checked)}
                className="rounded accent-amber-400 cursor-pointer"
              />
              <Camera className="w-3.5 h-3.5 text-amber-300" />
              <span>Capture Frame Snip</span>
            </label>
          </div>

          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSaveNote();
              }
            }}
            placeholder={`Take a study note or summarize at ${formatTime(currentTime)}... (Cmd+Enter to save)`}
            className="w-full h-16 bg-black/50 border border-white/10 focus:border-amber-400/50 rounded-xl p-2.5 text-white placeholder-white/30 text-xs outline-none resize-none"
          />

          {/* Quick attach recent snapshot preview if available */}
          {snapshots.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              <span className="text-[10px] text-white/40 shrink-0">Recent snips:</span>
              {snapshots.slice(0, 5).map((snap) => (
                <button
                  key={snap.id}
                  type="button"
                  onClick={() => {
                    setSelectedSnapshotUrl(
                      selectedSnapshotUrl === snap.dataUrl ? null : snap.dataUrl
                    );
                    setAttachCurrentFrame(false);
                  }}
                  className={`w-12 h-7 rounded-lg overflow-hidden border shrink-0 transition cursor-pointer ${
                    selectedSnapshotUrl === snap.dataUrl
                      ? 'border-amber-400 ring-2 ring-amber-400/40'
                      : 'border-white/20 hover:border-white/50 opacity-70 hover:opacity-100'
                  }`}
                  title={`Use snip at ${snap.timeStr}`}
                >
                  <img src={snap.dataUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSaveNote}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Note</span>
            </button>
          </div>
        </div>

        {/* Notes & Captured Snips Feed */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-16 px-4 text-white/40 flex flex-col items-center">
              <Sparkles className="w-8 h-8 mb-2 opacity-30 text-amber-300" />
              <p className="text-sm font-medium text-white/70">No study notes yet</p>
              <p className="text-[11px] text-white/40 mt-1 max-w-sm">
                Capture important points while watching videos. Frame snips and notes will be saved and can be exported as a structured PDF.
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isEditing = editingNoteId === note.id;

              return (
                <div
                  key={note.id}
                  className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/[0.07] border border-white/10 transition flex flex-col gap-2.5 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Clickable Timestamp Badge: Jumps video to exact time */}
                      <button
                        type="button"
                        onClick={() => onSeekToTime(note.timestamp)}
                        className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/30 mono text-xs font-semibold cursor-pointer transition"
                        title="Jump video to this timestamp"
                      >
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(note.timestamp)}</span>
                      </button>

                      {filterMode === 'all' && (
                        <span className="text-[11px] text-white/50 truncate max-w-[150px]">
                          {note.videoTitle}
                        </span>
                      )}

                      <span className="text-[10px] text-white/40">
                        {formatRelativeDate(note.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateNoteText(note.id, editingText);
                            setEditingNoteId(null);
                          }}
                          className="p-1 rounded hover:bg-white/10 text-emerald-300 cursor-pointer"
                          title="Save changes"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteId(note.id);
                            setEditingText(note.text);
                          }}
                          className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
                          title="Edit note"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onDeleteNote(note.id)}
                        className="p-1 rounded hover:bg-rose-500/20 text-white/40 hover:text-rose-400 cursor-pointer"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Note Body Text */}
                  {isEditing ? (
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full h-16 bg-black/60 border border-white/20 rounded-xl p-2 text-white text-xs outline-none"
                    />
                  ) : (
                    <p className="text-white/90 text-xs leading-relaxed whitespace-pre-wrap">
                      {note.text}
                    </p>
                  )}

                  {/* Attached Frame Snip Image */}
                  {note.snapshotDataUrl && (
                    <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black max-w-sm mt-1 group/img">
                      <img
                        src={note.snapshotDataUrl}
                        alt="Captured frame snip"
                        className="w-full h-36 object-cover cursor-pointer hover:scale-102 transition duration-200"
                        onClick={() => setPreviewImage(note.snapshotDataUrl || null)}
                      />
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] text-white/80">
                        <button
                          type="button"
                          onClick={() => setPreviewImage(note.snapshotDataUrl || null)}
                          className="flex items-center gap-1 hover:text-white cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Enlarge</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Lightbox Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-black/90 z-60 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={previewImage}
              alt="Enlarged frame capture"
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
            />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 border border-white/20 text-white flex items-center justify-center hover:bg-black"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
