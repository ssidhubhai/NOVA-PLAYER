import { HistoryItem, VideoNote } from '../types/player';

const MAX_HISTORY_ITEMS = 50;

/**
 * Upsert history item, ensuring recent item is at the top, max limit preserved.
 */
export function upsertHistory(
  history: HistoryItem[],
  newItem: HistoryItem
): HistoryItem[] {
  if (!newItem || !newItem.id) return history;

  const filtered = history.filter(
    (item) => item.id !== newItem.id && item.url !== newItem.url
  );

  const updated: HistoryItem = {
    ...newItem,
    lastWatchedAt: newItem.lastWatchedAt || Date.now(),
  };

  return [updated, ...filtered].slice(0, MAX_HISTORY_ITEMS);
}

/**
 * Remove an item from history by ID.
 */
export function deleteHistoryItem(
  history: HistoryItem[],
  id: string
): HistoryItem[] {
  return history.filter((item) => item.id !== id);
}

/**
 * Upsert note into notes list, sorted chronologically by playback timestamp.
 */
export function upsertNote(notes: VideoNote[], newNote: VideoNote): VideoNote[] {
  if (!newNote || !newNote.id) return notes;
  const filtered = notes.filter((n) => n.id !== newNote.id);
  const next = [...filtered, newNote];
  return next.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Delete a note by ID.
 */
export function deleteNote(notes: VideoNote[], noteId: string): VideoNote[] {
  return notes.filter((n) => n.id !== noteId);
}

/**
 * Filter notes by video ID or return all.
 */
export function filterNotes(notes: VideoNote[], videoId?: string): VideoNote[] {
  if (!videoId || videoId === 'all') return notes;
  return notes.filter((n) => n.videoId === videoId);
}

/**
 * Human-friendly relative date formatting.
 */
export function formatRelativeDate(timestampMs: number): string {
  if (!timestampMs) return '';
  const diffSec = Math.floor((Date.now() - timestampMs) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  const d = new Date(timestampMs);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
