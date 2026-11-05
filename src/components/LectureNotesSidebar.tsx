import React, { useState, useRef, useEffect } from 'react';
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
  Search,
  BookOpen,
  Pause,
  Play,
  Maximize2,
} from 'lucide-react';
import { VideoNote, Snapshot } from '../types/player';
import { formatTime } from '../utils/formatTime';
import { formatRelativeDate } from '../utils/historyAndNotes';
import { exportNotesToPdf } from '../utils/pdfExport';
import { FullScreenImageViewer } from './FullScreenImageViewer';

type NoteTag = NonNullable<VideoNote['tag']>;

const TAG_OPTIONS: { tag: NoteTag; label: string; color: string; bg: string }[] = [
  { tag: 'Key Concept', label: 'Concept', color: 'text-emerald-300', bg: 'bg-emerald-500/20 border-emerald-500/30' },
  { tag: 'Exam Point', label: 'Exam Point', color: 'text-rose-300', bg: 'bg-rose-500/20 border-rose-500/30' },
  { tag: 'Formula', label: 'Formula', color: 'text-indigo-300', bg: 'bg-indigo-500/20 border-indigo-500/30' },
  { tag: 'Question', label: 'Question', color: 'text-amber-300', bg: 'bg-amber-500/20 border-amber-500/30' },
  { tag: 'Summary', label: 'Summary', color: 'text-sky-300', bg: 'bg-sky-500/20 border-sky-500/30' },
  { tag: 'General', label: 'General', color: 'text-white/70', bg: 'bg-white/10 border-white/10' },
];

interface LectureNotesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentVideoId: string;
  currentVideoTitle: string;
  currentTime: number;
  isVideoPlaying: boolean;
  notes: VideoNote[];
  snapshots: Snapshot[];
  onAddNote: (note: Omit<VideoNote, 'id' | 'createdAt'>) => void;
  onUpdateNoteText: (noteId: string, newText: string) => void;
  onDeleteNote: (noteId: string) => void;
  onSeekToTime: (time: number) => void;
  onPauseVideo: () => void;
  onResumeVideo: () => void;
  onCaptureFrameForNote: () => string | null;
  showToast: (msg: string) => void;
}

export const LectureNotesSidebar: React.FC<LectureNotesSidebarProps> = ({
  isOpen,
  onClose,
  currentVideoId,
  currentVideoTitle,
  currentTime,
  isVideoPlaying,
  notes,
  snapshots,
  onAddNote,
  onUpdateNoteText,
  onDeleteNote,
  onSeekToTime,
  onPauseVideo,
  onResumeVideo,
  onCaptureFrameForNote,
  showToast,
}) => {
  const [noteText, setNoteText] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<NoteTag>('Key Concept');
  const [attachCurrentFrame, setAttachCurrentFrame] = useState<boolean>(true);
  const [autoPauseWhileTyping, setAutoPauseWhileTyping] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilterTag, setSelectedFilterTag] = useState<string>('all');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const pausedForTypingRef = useRef<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filter notes for current lecture
  const currentVideoNotes = notes.filter((n) => n.videoId === currentVideoId);

  const filteredNotes = currentVideoNotes.filter((note) => {
    const matchesQuery =
      searchQuery.trim() === '' ||
      note.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatTime(note.timestamp).includes(searchQuery);

    const matchesTag =
      selectedFilterTag === 'all' || (note.tag || 'General') === selectedFilterTag;

    return matchesQuery && matchesTag;
  });

  const handleTextareaFocus = () => {
    if (autoPauseWhileTyping && isVideoPlaying) {
      pausedForTypingRef.current = true;
      onPauseVideo();
      showToast('Lecture paused while taking notes');
    }
  };

  const handleSaveNote = () => {
    if (!noteText.trim() && !attachCurrentFrame) {
      showToast('Please type a key takeaway or attach a slide frame');
      return;
    }

    let finalSnipUrl: string | undefined = undefined;
    if (attachCurrentFrame) {
      const captured = onCaptureFrameForNote();
      if (captured) finalSnipUrl = captured;
    }

    onAddNote({
      videoId: currentVideoId || 'general',
      videoTitle: currentVideoTitle || 'Lecture',
      timestamp: currentTime,
      text: noteText.trim() || 'Slide capture checkpoint',
      snapshotDataUrl: finalSnipUrl,
      tag: selectedTag,
    });

    setNoteText('');
    showToast(`Note saved at ${formatTime(currentTime)}`);

    // Auto-resume if video was paused for typing
    if (pausedForTypingRef.current) {
      pausedForTypingRef.current = false;
      onResumeVideo();
    }
  };

  const handleExportPdf = async () => {
    if (currentVideoNotes.length === 0) {
      showToast('No lecture notes to export yet');
      return;
    }
    setIsExportingPdf(true);
    showToast('Compiling structured lecture PDF...');
    try {
      await exportNotesToPdf({
        notes: currentVideoNotes,
        videoTitle: currentVideoTitle || 'Lecture Study Notes',
        courseName: 'Lecture Notes',
      });
      showToast('Lecture PDF exported successfully!');
    } catch {
      showToast('Failed to compile PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      id="lectureNotesSidebar"
      className="w-full sm:w-[410px] md:w-[440px] h-full flex flex-col bg-neutral-950/98 border-l border-white/10 z-30 shrink-0 select-none shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-white/10 bg-black/60 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-xs text-white flex items-center gap-1.5">
              <span>Lecture Notebook</span>
              <span className="mono text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300">
                {currentVideoNotes.length}
              </span>
            </h2>
            <p className="text-[10px] text-white/50 truncate max-w-[200px]" title={currentVideoTitle}>
              {currentVideoTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Export to PDF Button */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf || currentVideoNotes.length === 0}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
              currentVideoNotes.length === 0
                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
            }`}
            title="Download formatted lecture notes with slide captures as PDF"
          >
            <Download className="w-3 h-3" />
            <span>{isExportingPdf ? 'Exporting...' : 'PDF'}</span>
          </button>

          {/* Close Sidebar */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Close notes side view (N)"
            aria-label="Close notes side view"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Note Creator Input Form (Sticky at top of notes sidebar) */}
      <div className="p-3 border-b border-white/10 bg-white/[0.03] shrink-0 space-y-2">
        {/* Timestamp & Capture Options */}
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-white/70">At Lecture Point:</span>
            <span className="mono text-white font-semibold px-1.5 py-0.5 rounded bg-white/10">
              {formatTime(currentTime)}
            </span>
          </div>

          <label
            className="flex items-center gap-1.5 text-white/80 hover:text-white cursor-pointer"
            title="Automatically attach the slide or video frame snapshot"
          >
            <input
              type="checkbox"
              checked={attachCurrentFrame}
              onChange={(e) => setAttachCurrentFrame(e.target.checked)}
              className="rounded accent-amber-400 cursor-pointer"
            />
            <Camera className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-[10px]">Snap Slide</span>
          </label>
        </div>

        {/* Concept / Lecture Tag Selector */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
          {TAG_OPTIONS.map((opt) => (
            <button
              key={opt.tag}
              type="button"
              onClick={() => setSelectedTag(opt.tag)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition cursor-pointer whitespace-nowrap ${
                selectedTag === opt.tag
                  ? `${opt.bg} ${opt.color} ring-1 ring-white/30 font-semibold`
                  : 'bg-white/5 border-transparent text-white/50 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onFocus={handleTextareaFocus}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSaveNote();
            }
          }}
          placeholder={`Take a note at ${formatTime(currentTime)}... (Ctrl+Enter to save)`}
          className="w-full h-16 bg-black/60 border border-white/15 focus:border-amber-400/50 rounded-xl p-2 text-white placeholder-white/30 text-xs outline-none resize-none leading-relaxed"
        />

        {/* Bottom Options Row */}
        <div className="flex items-center justify-between pt-0.5">
          <label
            className="flex items-center gap-1.5 text-[10px] text-white/50 hover:text-white/80 cursor-pointer"
            title="Auto-pause lecture video while typing note"
          >
            <input
              type="checkbox"
              checked={autoPauseWhileTyping}
              onChange={(e) => setAutoPauseWhileTyping(e.target.checked)}
              className="rounded accent-amber-400 cursor-pointer"
            />
            <span>Auto-pause on type</span>
          </label>

          <button
            type="button"
            onClick={handleSaveNote}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Note</span>
          </button>
        </div>
      </div>

      {/* Search & Tag Filter Bar */}
      <div className="px-3 pt-2 pb-1.5 border-b border-white/10 shrink-0 space-y-1.5 bg-black/40">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lecture notes or timestamps..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1 text-white text-[11px] placeholder-white/30 outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter tags */}
        <div className="flex items-center gap-1 overflow-x-auto text-[10px] pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedFilterTag('all')}
            className={`px-2 py-0.5 rounded-md cursor-pointer transition whitespace-nowrap ${
              selectedFilterTag === 'all'
                ? 'bg-white text-black font-semibold'
                : 'text-white/50 hover:text-white'
            }`}
          >
            All ({currentVideoNotes.length})
          </button>
          {TAG_OPTIONS.map((opt) => {
            const count = currentVideoNotes.filter((n) => n.tag === opt.tag).length;
            if (count === 0) return null;
            return (
              <button
                key={opt.tag}
                type="button"
                onClick={() => setSelectedFilterTag(opt.tag)}
                className={`px-2 py-0.5 rounded-md cursor-pointer transition whitespace-nowrap ${
                  selectedFilterTag === opt.tag
                    ? 'bg-white text-black font-semibold'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {opt.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes Stream List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-16 px-4 text-white/40 flex flex-col items-center">
            <Sparkles className="w-8 h-8 mb-2 opacity-30 text-amber-300" />
            <p className="text-xs font-medium text-white/70">No notes found</p>
            <p className="text-[10px] text-white/40 mt-1 max-w-xs">
              Type lecture notes while watching. Capture whiteboard slides and formulas, and export clean study guides as PDF.
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isEditing = editingNoteId === note.id;
            const tagObj =
              TAG_OPTIONS.find((t) => t.tag === note.tag) || TAG_OPTIONS[5];

            return (
              <div
                key={note.id}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/[0.07] border border-white/10 transition flex flex-col gap-2 group"
              >
                {/* Header: Timestamp badge + Tag + Relative Date + Action icons */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Timestamp: Clicking seeks video immediately */}
                    <button
                      type="button"
                      onClick={() => onSeekToTime(note.timestamp)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/30 mono text-[10px] font-semibold cursor-pointer transition"
                      title="Jump lecture video to this timestamp"
                    >
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatTime(note.timestamp)}</span>
                    </button>

                    {/* Tag Badge */}
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${tagObj.bg} ${tagObj.color}`}
                    >
                      {note.tag || 'General'}
                    </span>

                    <span className="text-[9px] text-white/30">
                      {formatRelativeDate(note.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
                    {isEditing ? (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateNoteText(note.id, editingText);
                          setEditingNoteId(null);
                        }}
                        className="p-1 rounded hover:bg-white/10 text-emerald-300 cursor-pointer"
                        title="Save note edits"
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
                        className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white cursor-pointer"
                        title="Edit note"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeleteNote(note.id)}
                      className="p-1 rounded hover:bg-rose-500/20 text-white/30 hover:text-rose-400 cursor-pointer"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Note Text */}
                {isEditing ? (
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="w-full h-16 bg-black/70 border border-white/20 rounded-xl p-2 text-white text-xs outline-none leading-relaxed"
                  />
                ) : (
                  <p className="text-white/90 text-xs leading-relaxed whitespace-pre-wrap">
                    {note.text}
                  </p>
                )}

                {/* Attached Slide Frame Snip */}
                {note.snapshotDataUrl && (
                  <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black mt-0.5 group/img">
                    <img
                      src={note.snapshotDataUrl}
                      alt="Captured lecture slide snip"
                      className="w-full h-28 object-cover cursor-pointer hover:scale-102 transition duration-200"
                      onClick={() => setPreviewImage(note.snapshotDataUrl || null)}
                    />
                    <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] text-white/80">
                      <button
                        type="button"
                        onClick={() => setPreviewImage(note.snapshotDataUrl || null)}
                        className="flex items-center gap-1 hover:text-white cursor-pointer"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        <span>Enlarge Slide</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Full-Screen Photo Snip Viewer */}
      {previewImage && (
        <FullScreenImageViewer
          imageUrl={previewImage}
          title={`${currentVideoTitle} · Slide Snip`}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </aside>
  );
};
