export interface VideoTrack {
  id: string;
  name: string;
  url: string;
  sizeText?: string;
  duration?: number;
  isDemo?: boolean;
}

export interface SubtitleCue {
  id: string;
  start: number;
  end: number;
  text: string;
}

export interface Bookmark {
  id: string;
  time: number;
  label: string;
}

export interface Snapshot {
  id: string;
  dataUrl: string;
  timeStr: string;
  timestamp: number;
}

export interface HistoryItem {
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  lastTime: number;
  duration: number;
  lastWatchedAt: number;
  isDemo?: boolean;
}

export interface VideoNote {
  id: string;
  videoId: string;
  videoTitle: string;
  timestamp: number; // playback time in seconds
  createdAt: number; // system timestamp ms
  text: string;
  snapshotDataUrl?: string; // attached slide / whiteboard frame snip
  tag?: 'Key Concept' | 'Exam Point' | 'Formula' | 'Question' | 'Summary' | 'General';
}

export type FitMode = 'contain' | 'cover' | 'fill';
export type LoopMode = 'all' | 'one' | 'off';

export interface VideoTransformSettings {
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  fitMode: FitMode;
  zoom: number; // 50 to 250%
  brightness: number; // 40 to 200%
  contrast: number; // 40 to 200%
  saturation: number; // 0 to 250%
}
