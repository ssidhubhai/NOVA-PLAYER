/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { ControlsOverlay } from './components/ControlsOverlay';
import { StudioToolsModal } from './components/StudioToolsModal';
import { PlaylistSidebar } from './components/PlaylistSidebar';
import { ShortcutsModal } from './components/ShortcutsModal';
import { SampleClipsModal } from './components/SampleClipsModal';
import { LectureNotesSidebar } from './components/LectureNotesSidebar';
import { EmptyStatePrompt } from './components/EmptyStatePrompt';
import {
  HudToast,
  LongPressSpeedPill,
  CenterFlashOverlay,
  DropZoneOverlay,
} from './components/FeedbackOverlays';
import {
  VideoTrack,
  Bookmark,
  Snapshot,
  HistoryItem,
  VideoNote,
  LoopMode,
  VideoTransformSettings,
} from './types/player';
import { DEMO_VIDEOS, DEMO_SUBTITLES } from './data/demoVideos';
import { formatTime } from './utils/formatTime';
import { parseSubtitleText, findActiveCue, SubtitleCue } from './utils/subtitleParser';
import {
  clampSpeed,
  mapVolumeAndBoost,
  checkABLoop,
  getNextTrackIndex,
} from './utils/playerMath';
import {
  upsertHistory,
  deleteHistoryItem,
  upsertNote,
  deleteNote,
} from './utils/historyAndNotes';
import { ProceduralCinemaEngine } from './utils/proceduralCanvasStream';

const LOCAL_STORAGE_HISTORY_KEY = 'novaplay_history_v1';
const LOCAL_STORAGE_NOTES_KEY = 'novaplay_notes_v1';

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoTransformWrapperRef = useRef<HTMLDivElement>(null);
  const playerViewportRef = useRef<HTMLDivElement>(null);

  // Audio Context graph for boost up to 200%
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceConnectedRef = useRef<boolean>(false);

  // Procedural canvas stream engine fallback & built-in demo
  const proceduralEngineRef = useRef<ProceduralCinemaEngine | null>(null);
  const [isProceduralMode, setIsProceduralMode] = useState<boolean>(false);

  // Playback state
  const [playlist, setPlaylist] = useState<VideoTrack[]>(DEMO_VIDEOS);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(60);
  const [bufferedEnd, setBufferedEnd] = useState<number>(0);
  const [volumePercent, setVolumePercent] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [normalSpeed, setNormalSpeed] = useState<number>(1.0);
  const [holdSpeedMultiplier, setHoldSpeedMultiplier] = useState<number>(2.0);
  const [isHoldSpeedActive, setIsHoldSpeedActive] = useState<boolean>(false);
  const [skipStepSeconds, setSkipStepSeconds] = useState<number>(5);
  const [loopMode, setLoopMode] = useState<LoopMode>('all');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // A-B loop
  const [pointA, setPointA] = useState<number | null>(null);
  const [pointB, setPointB] = useState<number | null>(null);

  // Subtitles
  const [subtitles, setSubtitles] = useState<SubtitleCue[]>(DEMO_SUBTITLES);
  const [subtitleOffset, setSubtitleOffset] = useState<number>(0);
  const [activeSubtitleText, setActiveSubtitleText] = useState<string>('');

  // Bookmarks & Snapshots
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([
    { id: 'bm-init-1', time: 4, label: 'Intro Marker' },
  ]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);

  // Watch History with localStorage persistence
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'hist-demo-1',
        title: 'Blooming Flora (CC0 Cinema Sample)',
        url: DEMO_VIDEOS[0].url,
        lastTime: 2.5,
        duration: 5.0,
        lastWatchedAt: Date.now() - 3600000,
        isDemo: true,
      },
    ];
  });

  // Video Study Notes with localStorage persistence
  const [notes, setNotes] = useState<VideoNote[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_NOTES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'note-init-1',
        videoId: DEMO_VIDEOS[0].id,
        videoTitle: DEMO_VIDEOS[0].name,
        timestamp: 1.5,
        createdAt: Date.now() - 7200000,
        text: 'Flower macro close-up petals with vivid colors and cinematic lighting depth of field.',
      },
    ];
  });

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(history));
    } catch {}
  }, [history]);

  // Save notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, JSON.stringify(notes));
    } catch {}
  }, [notes]);

  // UI Drawers & Popovers
  const [isPlaylistOpen, setIsPlaylistOpen] = useState<boolean>(false);
  const [sidebarInitialTab, setSidebarInitialTab] = useState<
    'queue' | 'history' | 'bookmarks' | 'snapshots'
  >('queue');
  const [isToolsOpen, setIsToolsOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isSampleClipsOpen, setIsSampleClipsOpen] = useState<boolean>(false);
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isCursorHidden, setIsCursorHidden] = useState<boolean>(false);

  // Feedback HUD
  const [hudMessage, setHudMessage] = useState<string | null>(null);
  const [flashState, setFlashState] = useState<'play' | 'pause' | null>(null);

  // Visual Transforms & Filters
  const [transforms, setTransforms] = useState<VideoTransformSettings>({
    rotation: 0,
    flipH: false,
    fitMode: 'contain',
    zoom: 100,
    brightness: 100,
    contrast: 100,
    saturation: 100,
  });

  const hudTimerRef = useRef<NodeJS.Timeout | null>(null);
  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);
  const idleMouseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastHistorySaveTimeRef = useRef<number>(0);

  const currentTrack = playlist[currentIndex] || null;

  // Show HUD toast helper
  const showHud = useCallback((msg: string) => {
    setHudMessage(msg);
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    hudTimerRef.current = setTimeout(() => {
      setHudMessage(null);
    }, 1200);
  }, []);

  // Center flash icon helper
  const triggerFlash = useCallback((state: 'play' | 'pause') => {
    setFlashState(state);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => {
      setFlashState(null);
    }, 450);
  }, []);

  // Setup Web Audio API gain node for volume boost up to 200%
  const ensureAudioGraph = useCallback(() => {
    const video = videoRef.current;
    if (!video || sourceConnectedRef.current) return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const source = ctx.createMediaElementSource(video);
      const gain = ctx.createGain();
      source.connect(gain);
      gain.connect(ctx.destination);

      audioCtxRef.current = ctx;
      gainNodeRef.current = gain;
      sourceConnectedRef.current = true;
    } catch {
      // Audio graph will gracefully fallback if already connected
    }
  }, []);

  // Apply volume changes to media element and GainNode
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const { elementVolume, gainValue, effectiveMuted } = mapVolumeAndBoost(
      volumePercent,
      isMuted
    );

    video.muted = effectiveMuted;
    video.volume = elementVolume;

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = gainValue;
    }
  }, [volumePercent, isMuted]);

  // Apply video transforms and CSS filters
  useEffect(() => {
    const wrapper = videoTransformWrapperRef.current;
    const video = videoRef.current;
    if (!wrapper || !video) return;

    const scaleX = (transforms.zoom / 100) * (transforms.flipH ? -1 : 1);
    const scaleY = transforms.zoom / 100;
    wrapper.style.transform = `rotate(${transforms.rotation}deg) scale(${scaleX}, ${scaleY})`;
    video.style.objectFit = transforms.fitMode;
    video.style.filter = `brightness(${transforms.brightness}%) contrast(${transforms.contrast}%) saturate(${transforms.saturation}%)`;
  }, [transforms]);

  // Update active subtitle cue
  useEffect(() => {
    const cue = findActiveCue(subtitles, currentTime, subtitleOffset);
    setActiveSubtitleText(cue ? cue.text : '');
  }, [currentTime, subtitleOffset, subtitles]);

  // Record playback progress in History periodically
  const recordHistoryProgress = useCallback(
    (time: number, dur: number) => {
      if (!currentTrack || isProceduralMode) return;
      const now = Date.now();
      // Throttle history updates to every 4 seconds
      if (now - lastHistorySaveTimeRef.current < 4000) return;
      lastHistorySaveTimeRef.current = now;

      const item: HistoryItem = {
        id: currentTrack.id,
        title: currentTrack.name,
        url: currentTrack.url,
        lastTime: time,
        duration: dur > 0 ? dur : time,
        lastWatchedAt: now,
        isDemo: currentTrack.isDemo,
      };

      setHistory((prev) => upsertHistory(prev, item));
    },
    [currentTrack, isProceduralMode]
  );

  // Switch to procedural canvas stream
  const startProceduralSynthStream = useCallback(() => {
    if (!proceduralEngineRef.current) {
      proceduralEngineRef.current = new ProceduralCinemaEngine();
    }
    const engine = proceduralEngineRef.current;
    const stream = engine.getStream(30);
    const video = videoRef.current;

    setIsProceduralMode(true);
    setDuration(60);
    setCurrentTime(0);

    if (video && stream) {
      video.src = '';
      video.srcObject = stream;
      video.play().catch(() => {});
      engine.play();
    }
    showHud('Procedural Synth Stream active');
  }, [showHud]);

  // Play / Pause toggle
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    ensureAudioGraph();
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }

    if (isProceduralMode && proceduralEngineRef.current) {
      if (video.paused) {
        video.play().catch(() => {});
        proceduralEngineRef.current.play();
        triggerFlash('play');
        setIsPlaying(true);
      } else {
        video.pause();
        proceduralEngineRef.current.pause();
        triggerFlash('pause');
        setIsPlaying(false);
      }
      return;
    }

    if (video.paused) {
      video.play().catch(() => {});
      triggerFlash('play');
    } else {
      video.pause();
      triggerFlash('pause');
    }
  }, [ensureAudioGraph, isProceduralMode, triggerFlash]);

  // Seek relative
  const seekRelative = useCallback(
    (deltaSeconds: number) => {
      const video = videoRef.current;
      if (!video) return;

      const dur = duration || (Number.isFinite(video.duration) ? video.duration : 60);
      const cur = isProceduralMode && proceduralEngineRef.current
        ? proceduralEngineRef.current.getTime()
        : (video.currentTime || 0);

      const nextTime = Math.max(0, Math.min(dur, cur + deltaSeconds));

      if (isProceduralMode && proceduralEngineRef.current) {
        proceduralEngineRef.current.setTime(nextTime);
        setCurrentTime(nextTime);
      } else {
        video.currentTime = nextTime;
      }

      const sign = deltaSeconds > 0 ? '+' : '';
      showHud(`${sign}${deltaSeconds}s`);
    },
    [duration, isProceduralMode, showHud]
  );

  // Step single frame (approx 30fps = ~0.033s)
  const stepFrame = useCallback(
    (direction: number) => {
      const video = videoRef.current;
      if (!video) return;
      if (!video.paused) video.pause();

      const cur = isProceduralMode && proceduralEngineRef.current
        ? proceduralEngineRef.current.getTime()
        : (video.currentTime || 0);

      const nextTime = Math.max(0, cur + direction * (1 / 30));

      if (isProceduralMode && proceduralEngineRef.current) {
        proceduralEngineRef.current.setTime(nextTime);
        setCurrentTime(nextTime);
      } else {
        video.currentTime = nextTime;
      }
      showHud(`Frame ${direction > 0 ? '+1' : '-1'}`);
    },
    [isProceduralMode, showHud]
  );

  // Set speed
  const changeSpeed = useCallback(
    (newSpeed: number) => {
      const clamped = clampSpeed(newSpeed);
      setNormalSpeed(clamped);

      if (isProceduralMode && proceduralEngineRef.current) {
        proceduralEngineRef.current.setRate(clamped);
      }

      const video = videoRef.current;
      if (video && !isHoldSpeedActive) {
        video.playbackRate = clamped;
      }
      showHud(`${clamped.toFixed(2)}x`);
    },
    [isHoldSpeedActive, isProceduralMode, showHud]
  );

  // Hold speed start & stop
  const startHoldSpeed = useCallback(() => {
    setIsHoldSpeedActive(true);
    if (isProceduralMode && proceduralEngineRef.current) {
      proceduralEngineRef.current.setRate(holdSpeedMultiplier);
    }
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        video.play().catch(() => {});
      }
      video.playbackRate = holdSpeedMultiplier;
    }
  }, [holdSpeedMultiplier, isProceduralMode]);

  const stopHoldSpeed = useCallback(() => {
    setIsHoldSpeedActive(false);
    if (isProceduralMode && proceduralEngineRef.current) {
      proceduralEngineRef.current.setRate(normalSpeed);
    }
    const video = videoRef.current;
    if (video) {
      video.playbackRate = normalSpeed;
    }
  }, [normalSpeed, isProceduralMode]);

  // Set volume percentage
  const changeVolume = useCallback(
    (newPercent: number) => {
      ensureAudioGraph();
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
      const clamped = Math.max(0, Math.min(200, Math.round(newPercent)));
      setVolumePercent(clamped);
      setIsMuted(clamped === 0);
      showHud(clamped === 0 ? 'Muted' : `Volume ${clamped}%`);
    },
    [ensureAudioGraph, showHud]
  );

  const toggleMute = useCallback(() => {
    if (isMuted || volumePercent === 0) {
      setIsMuted(false);
      const restored = volumePercent === 0 ? 100 : volumePercent;
      setVolumePercent(restored);
      showHud(`Volume ${restored}%`);
    } else {
      setIsMuted(true);
      showHud('Muted');
    }
  }, [isMuted, volumePercent, showHud]);

  // A-B Looping
  const setLoopPointA = useCallback(() => {
    const cur = currentTime;
    setPointA(cur);
    if (pointB !== null && pointB <= cur) {
      setPointB(null);
    }
    showHud(`Loop A: ${formatTime(cur)}`);
  }, [currentTime, pointB, showHud]);

  const setLoopPointB = useCallback(() => {
    const cur = currentTime;
    const effectiveA = pointA !== null ? pointA : Math.max(0, cur - 5);
    if (pointA === null) setPointA(effectiveA);
    if (cur > effectiveA) {
      setPointB(cur);
      showHud(`Loop ${formatTime(effectiveA)} - ${formatTime(cur)}`);
    }
  }, [currentTime, pointA, showHud]);

  const clearLoop = useCallback(() => {
    setPointA(null);
    setPointB(null);
    showHud('Loop Off');
  }, [showHud]);

  // Bookmarks
  const addBookmark = useCallback(() => {
    const cur = currentTime;
    const newBm: Bookmark = {
      id: `bm-${Date.now()}`,
      time: cur,
      label: `Mark ${formatTime(cur)}`,
    };
    setBookmarks((prev) => [...prev, newBm].sort((a, b) => a.time - b.time));
    showHud(`Bookmarked ${formatTime(cur)}`);
  }, [currentTime, showHud]);

  // Capture frame snip helper
  const captureCurrentFrameDataUrl = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video) return null;

    try {
      const snapCanvas = document.createElement('canvas');
      const w = video.videoWidth || 1280;
      const h = video.videoHeight || 720;
      snapCanvas.width = w;
      snapCanvas.height = h;

      const ctx = snapCanvas.getContext('2d');
      if (ctx) {
        if (isProceduralMode && proceduralEngineRef.current) {
          ctx.drawImage(proceduralEngineRef.current.getCanvas(), 0, 0, w, h);
        } else {
          ctx.drawImage(video, 0, 0, w, h);
        }
        return snapCanvas.toDataURL('image/png');
      }
    } catch {
      // CORS or canvas failure fallback
    }
    return null;
  }, [isProceduralMode]);

  // Snapshots capture action - automatically saves to Notes as requested!
  const captureSnapshot = useCallback(() => {
    const dataUrl = captureCurrentFrameDataUrl();
    const timeStr = formatTime(currentTime);

    if (dataUrl) {
      const snapId = `snap-${Date.now()}`;
      const newSnap: Snapshot = {
        id: snapId,
        dataUrl,
        timeStr,
        timestamp: Date.now(),
      };
      setSnapshots((prev) => [newSnap, ...prev]);

      // Automatically save to Notes
      const newNote: VideoNote = {
        id: `note-${Date.now()}`,
        videoId: currentTrack?.id || 'general',
        videoTitle: currentTrack?.name || 'Lecture',
        timestamp: currentTime,
        createdAt: Date.now(),
        text: `Slide snip captured at ${timeStr}`,
        snapshotDataUrl: dataUrl,
        tag: 'Key Concept',
      };
      setNotes((prev) => upsertNote(prev, newNote));

      showHud(`Snip saved to Notes (${timeStr})`);
    } else {
      showHud('Slide capture saved');
    }
  }, [captureCurrentFrameDataUrl, currentTime, currentTrack, showHud]);

  // Track selection & playlist management
  const loadTrack = useCallback(
    (index: number, startAtTime?: number) => {
      if (index < 0 || index >= playlist.length) return;
      setCurrentIndex(index);
      setPointA(null);
      setPointB(null);
      setIsProceduralMode(false);

      if (proceduralEngineRef.current) {
        proceduralEngineRef.current.pause();
      }

      const video = videoRef.current;
      if (video) {
        video.srcObject = null;
        video.src = playlist[index].url;
        video.playbackRate = normalSpeed;
        if (startAtTime && startAtTime > 0) {
          video.currentTime = startAtTime;
        }
        video.play().catch(() => {});
      }
      showHud(`Playing: ${playlist[index].name}`);
    },
    [playlist, normalSpeed, showHud]
  );

  // Resume a video from Watch History
  const handleResumeHistory = useCallback(
    (item: HistoryItem) => {
      const existingIdx = playlist.findIndex(
        (t) => t.id === item.id || t.url === item.url
      );

      if (existingIdx !== -1) {
        loadTrack(existingIdx, item.lastTime);
      } else {
        const newTrack: VideoTrack = {
          id: item.id,
          name: item.title,
          url: item.url,
          duration: item.duration,
          isDemo: item.isDemo,
        };
        const nextIdx = playlist.length;
        setPlaylist((prev) => [...prev, newTrack]);
        loadTrack(nextIdx, item.lastTime);
      }
      setIsPlaylistOpen(false);
      showHud(`Resumed "${item.title}" at ${formatTime(item.lastTime)}`);
    },
    [playlist, loadTrack, showHud]
  );

  const handleOpenFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const mediaFiles = Array.from(files).filter(
        (f) =>
          f.type.startsWith('video/') ||
          f.type.startsWith('audio/') ||
          /\.(mp4|mkv|webm|mov|avi|m4v|ogg)$/i.test(f.name)
      );

      if (mediaFiles.length === 0) return;

      const newTracks: VideoTrack[] = mediaFiles.map((file, i) => ({
        id: `local-${Date.now()}-${i}`,
        name: file.name,
        url: URL.createObjectURL(file),
        sizeText: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        isDemo: false,
      }));

      const startIdx = playlist.length;
      setPlaylist((prev) => [...prev, ...newTracks]);
      loadTrack(startIdx);
      showHud(`Loaded ${mediaFiles.length} file(s)`);
    },
    [playlist.length, loadTrack, showHud]
  );

  const handleOpenSubtitles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const parsed = parseSubtitleText(String(reader.result || ''));
        setSubtitles(parsed);
        showHud(`Subtitles loaded (${parsed.length} cues)`);
      };
      reader.readAsText(file);
    },
    [showHud]
  );

  // Fullscreen and PiP
  const toggleFullscreen = useCallback(() => {
    const el = playerViewportRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const togglePiP = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    } else if (video.requestPictureInPicture) {
      video.requestPictureInPicture().catch(() => {});
    }
  }, []);

  // Video element event handlers
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const cur = isProceduralMode && proceduralEngineRef.current
      ? proceduralEngineRef.current.getTime()
      : (video.currentTime || 0);

    setCurrentTime(cur);

    // Save to history
    recordHistoryProgress(cur, video.duration || duration);

    // Check A-B loop boundary
    const loopRes = checkABLoop(cur, pointA, pointB);
    if (loopRes.shouldLoop) {
      if (isProceduralMode && proceduralEngineRef.current) {
        proceduralEngineRef.current.setTime(loopRes.seekTarget);
      } else {
        video.currentTime = loopRes.seekTarget;
      }
    }
  };

  const handleProgress = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    try {
      if (video.buffered.length > 0) {
        const end = video.buffered.end(video.buffered.length - 1);
        setBufferedEnd(end);
      }
    } catch {}
  };

  const handleEnded = () => {
    const nextIdx = getNextTrackIndex(currentIndex, playlist.length, loopMode);
    if (nextIdx !== null) {
      loadTrack(nextIdx);
    } else {
      setIsPlaying(false);
    }
  };

  // Video error fallback handler
  const handleVideoError = () => {
    showHud('Video stream unavailable · Launching procedural engine');
    startProceduralSynthStream();
  };

  // Notes operations
  const handleAddNote = (newNoteData: Omit<VideoNote, 'id' | 'createdAt'>) => {
    const newNote: VideoNote = {
      ...newNoteData,
      id: `note-${Date.now()}`,
      createdAt: Date.now(),
    };
    setNotes((prev) => upsertNote(prev, newNote));
  };

  const handleUpdateNoteText = (noteId: string, newText: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, text: newText } : n))
    );
    showHud('Note updated');
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => deleteNote(prev, noteId));
    showHud('Note deleted');
  };

  // Keyboard navigation & hold speed detection
  useEffect(() => {
    let spaceHoldTimer: NodeJS.Timeout | null = null;
    let spaceHoldActive = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        if (e.code !== 'Space' && !e.code.startsWith('Arrow')) return;
        (e.target as HTMLElement).blur();
      }

      // Space hold for 2x
      if (e.code === 'Space') {
        e.preventDefault();
        if (e.repeat) {
          if (!spaceHoldActive) {
            spaceHoldActive = true;
            if (spaceHoldTimer) clearTimeout(spaceHoldTimer);
            startHoldSpeed();
          }
          return;
        }
        spaceHoldActive = false;
        spaceHoldTimer = setTimeout(() => {
          spaceHoldActive = true;
          startHoldSpeed();
        }, 220);
        return;
      }

      // Right arrow: standard lecture seeking (+5s), no 2x hold!
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        seekRelative(skipStepSeconds);
        return;
      }

      switch (e.code) {
        case 'KeyK':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekRelative(-skipStepSeconds);
          break;
        case 'KeyJ':
          e.preventDefault();
          seekRelative(-10);
          break;
        case 'KeyL':
          e.preventDefault();
          seekRelative(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          changeVolume(volumePercent + 5);
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeVolume(volumePercent - 5);
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'BracketLeft':
          e.preventDefault();
          changeSpeed(normalSpeed - 0.25);
          break;
        case 'BracketRight':
          e.preventDefault();
          changeSpeed(normalSpeed + 0.25);
          break;
        case 'Backslash':
          e.preventDefault();
          changeSpeed(1.0);
          break;
        case 'Comma':
          e.preventDefault();
          if (e.shiftKey) changeSpeed(normalSpeed - 0.25);
          else stepFrame(-1);
          break;
        case 'Period':
          e.preventDefault();
          if (e.shiftKey) changeSpeed(normalSpeed + 0.25);
          else stepFrame(1);
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyI':
          e.preventDefault();
          togglePiP();
          break;
        case 'KeyA':
          e.preventDefault();
          setLoopPointA();
          break;
        case 'KeyB':
          e.preventDefault();
          setLoopPointB();
          break;
        case 'KeyU':
          e.preventDefault();
          clearLoop();
          break;
        case 'KeyS':
          e.preventDefault();
          captureSnapshot();
          break;
        case 'KeyD':
          e.preventDefault();
          addBookmark();
          break;
        case 'KeyN':
          e.preventDefault();
          setIsNotesOpen((prev) => !prev);
          break;
        case 'KeyH':
          e.preventDefault();
          setSidebarInitialTab('history');
          setIsPlaylistOpen(true);
          break;
        case 'KeyR':
          e.preventDefault();
          setTransforms((t) => ({ ...t, rotation: (t.rotation + 90) % 360 }));
          showHud(`${(transforms.rotation + 90) % 360}°`);
          break;
        case 'KeyH_DISABLED':
          // Mirror flip mapped to shift+H if desired
          break;
        case 'KeyZ': {
          e.preventDefault();
          const modes: Array<'contain' | 'cover' | 'fill'> = ['contain', 'cover', 'fill'];
          const nextMode = modes[(modes.indexOf(transforms.fitMode) + 1) % modes.length];
          setTransforms((t) => ({ ...t, fitMode: nextMode }));
          showHud(`Fit: ${nextMode}`);
          break;
        }
        case 'KeyP':
          e.preventDefault();
          if (e.shiftKey) {
            if (currentIndex > 0) loadTrack(currentIndex - 1);
          } else {
            setSidebarInitialTab('queue');
            setIsPlaylistOpen((prev) => !prev);
            setIsToolsOpen(false);
          }
          break;
        case 'KeyE':
          e.preventDefault();
          setIsToolsOpen((prev) => !prev);
          setIsPlaylistOpen(false);
          break;
        case 'Slash':
          if (e.shiftKey) {
            e.preventDefault();
            setIsShortcutsOpen((prev) => !prev);
          }
          break;
        case 'Home':
          e.preventDefault();
          if (isProceduralMode && proceduralEngineRef.current) {
            proceduralEngineRef.current.setTime(0);
            setCurrentTime(0);
          } else if (videoRef.current) {
            videoRef.current.currentTime = 0;
          }
          break;
        case 'End':
          e.preventDefault();
          if (isProceduralMode && proceduralEngineRef.current) {
            proceduralEngineRef.current.setTime(duration);
            setCurrentTime(duration);
          } else if (videoRef.current && videoRef.current.duration) {
            videoRef.current.currentTime = videoRef.current.duration;
          }
          break;
        default:
          if (/^Digit[0-9]$/.test(e.code)) {
            e.preventDefault();
            const digit = parseInt(e.code.replace('Digit', ''), 10);
            const targetDur = duration || videoRef.current?.duration || 60;
            const target = (digit / 10) * targetDur;
            if (isProceduralMode && proceduralEngineRef.current) {
              proceduralEngineRef.current.setTime(target);
              setCurrentTime(target);
            } else if (videoRef.current) {
              videoRef.current.currentTime = target;
            }
            showHud(`${digit * 10}%`);
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (spaceHoldTimer) {
          clearTimeout(spaceHoldTimer);
          spaceHoldTimer = null;
        }
        if (spaceHoldActive) {
          spaceHoldActive = false;
          stopHoldSpeed();
        } else {
          togglePlayPause();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    togglePlayPause,
    seekRelative,
    stepFrame,
    changeSpeed,
    normalSpeed,
    startHoldSpeed,
    stopHoldSpeed,
    changeVolume,
    volumePercent,
    toggleMute,
    setLoopPointA,
    setLoopPointB,
    clearLoop,
    captureSnapshot,
    addBookmark,
    transforms,
    skipStepSeconds,
    currentIndex,
    playlist.length,
    loadTrack,
    toggleFullscreen,
    togglePiP,
    isProceduralMode,
    duration,
    showHud,
  ]);

  // Pointer hold on viewport for 2x hold speed
  const pointerHoldTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pointerHeldActiveRef = useRef<boolean>(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      (e.target as HTMLElement).closest('#controlsOverlay') ||
      (e.target as HTMLElement).closest('#studioToolsPanel') ||
      (e.target as HTMLElement).closest('#playlistSidebar') ||
      (e.target as HTMLElement).closest('#appHeader') ||
      (e.target as HTMLElement).closest('#emptyStatePrompt') ||
      (e.target as HTMLElement).closest('#notesModal')
    ) {
      return;
    }
    if (e.button !== 0) return;

    pointerHeldActiveRef.current = false;
    pointerHoldTimerRef.current = setTimeout(() => {
      pointerHeldActiveRef.current = true;
      startHoldSpeed();
    }, 260);
  };

  const handlePointerUp = () => {
    if (pointerHoldTimerRef.current) {
      clearTimeout(pointerHoldTimerRef.current);
      pointerHoldTimerRef.current = null;
    }
    if (pointerHeldActiveRef.current) {
      stopHoldSpeed();
      setTimeout(() => {
        pointerHeldActiveRef.current = false;
      }, 50);
    }
  };

  const handleViewportClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      (e.target as HTMLElement).closest('#controlsOverlay') ||
      (e.target as HTMLElement).closest('#studioToolsPanel') ||
      (e.target as HTMLElement).closest('#playlistSidebar') ||
      (e.target as HTMLElement).closest('#appHeader') ||
      (e.target as HTMLElement).closest('#emptyStatePrompt') ||
      (e.target as HTMLElement).closest('#notesModal')
    ) {
      return;
    }
    if (pointerHeldActiveRef.current) return;

    setIsToolsOpen(false);
    setIsPlaylistOpen(false);
    togglePlayPause();
  };

  // Mouse move and idle auto-hide
  const handleMouseMove = () => {
    setIsCursorHidden(false);
    if (idleMouseTimerRef.current) clearTimeout(idleMouseTimerRef.current);

    idleMouseTimerRef.current = setTimeout(() => {
      if (isPlaying && !isToolsOpen && !isPlaylistOpen && !isShortcutsOpen && !isNotesOpen) {
        setIsCursorHidden(true);
      }
    }, 2200);
  };

  // Wheel volume control on viewport
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (
      (e.target as HTMLElement).closest('#studioToolsPanel') ||
      (e.target as HTMLElement).closest('#playlistSidebar') ||
      (e.target as HTMLElement).closest('#notesModal')
    ) {
      return;
    }
    const delta = e.deltaY < 0 ? 5 : -5;
    changeVolume(volumePercent + delta);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.relatedTarget === null) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!e.dataTransfer || !e.dataTransfer.files) return;

    const files = Array.from(e.dataTransfer.files);
    const subFile = files.find((f) => /\.(srt|vtt)$/i.test(f.name));
    if (subFile) {
      const reader = new FileReader();
      reader.onload = () => {
        const parsed = parseSubtitleText(String(reader.result || ''));
        setSubtitles(parsed);
        showHud(`Subtitles loaded (${parsed.length} cues)`);
      };
      reader.readAsText(subFile);
    }

    handleOpenFiles(e.dataTransfer.files);
  };

  // Reset all tools & filters
  const handleResetTransforms = () => {
    setTransforms({
      rotation: 0,
      flipH: false,
      fitMode: 'contain',
      zoom: 100,
      brightness: 100,
      contrast: 100,
      saturation: 100,
    });
    setSubtitleOffset(0);
    showHud('Settings reset');
  };

  return (
    <main
      id="theaterSection"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative w-screen h-screen bg-black flex overflow-hidden select-none font-sans"
    >
      <div
        id="playerViewport"
        ref={playerViewportRef}
        tabIndex={0}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onClick={handleViewportClick}
        onDoubleClick={(e) => {
          if (
            (e.target as HTMLElement).closest('#controlsOverlay') ||
            (e.target as HTMLElement).closest('#studioToolsPanel') ||
            (e.target as HTMLElement).closest('#playlistSidebar') ||
            (e.target as HTMLElement).closest('#appHeader')
          ) {
            return;
          }
          toggleFullscreen();
        }}
        className={`relative flex-1 min-w-0 h-full flex items-center justify-center bg-black overflow-hidden outline-none transition-[width] duration-200 ${
          isCursorHidden ? 'hide-cursor' : ''
        }`}
      >
        {/* Main Video Wrapper for Smooth Scaling, Rotation & Mirror Flip */}
        <div
          id="videoTransformWrapper"
          ref={videoTransformWrapperRef}
          className="w-full h-full flex items-center justify-center transition-transform duration-150 will-change-transform"
        >
          <video
            id="mainVideo"
            ref={videoRef}
            src={currentTrack && !isProceduralMode ? currentTrack.url : undefined}
            playsInline
            crossOrigin="anonymous"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onProgress={handleProgress}
            onError={handleVideoError}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setDuration(videoRef.current.duration || 60);
              }
            }}
            onEnded={handleEnded}
            className="w-full h-full object-contain max-h-full transition-[filter] duration-150"
          />
        </div>

        {/* Empty State Prompt (shown when queue is empty) */}
        <EmptyStatePrompt
          isVisible={playlist.length === 0}
          onOpenFiles={handleOpenFiles}
          sampleTracks={DEMO_VIDEOS}
          onSelectSample={(sample) => {
            setPlaylist([sample]);
            loadTrack(0);
          }}
        />

        {/* Top Header Bar */}
        <HeaderBar
          nowPlayingTitle={
            isProceduralMode
              ? 'NovaSynth Ambient Stream'
              : currentTrack
              ? currentTrack.name
              : ''
          }
          playlistCount={playlist.length}
          historyCount={history.length}
          notesCount={notes.length}
          onOpenFiles={handleOpenFiles}
          onOpenSubtitles={handleOpenSubtitles}
          onTogglePlaylist={() => {
            setSidebarInitialTab('queue');
            setIsPlaylistOpen((prev) => !prev);
            setIsToolsOpen(false);
          }}
          onOpenHistory={() => {
            setSidebarInitialTab('history');
            setIsPlaylistOpen(true);
            setIsToolsOpen(false);
          }}
          onOpenNotes={() => setIsNotesOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          isPlaylistOpen={isPlaylistOpen}
          isNotesOpen={isNotesOpen}
          onSelectSampleDemo={() => setIsSampleClipsOpen(true)}
        />

        {/* Minimal Subtitles Display */}
        {activeSubtitleText && (
          <div
            id="customSubtitles"
            className="custom-subtitles absolute bottom-24 sm:bottom-20 left-6 right-6 text-center z-20 pointer-events-none"
          >
            <span className="inline-block px-3.5 py-1 rounded-xl bg-black/75 backdrop-blur-md text-white font-medium text-sm sm:text-base md:text-lg border border-white/10 shadow-2xl">
              {activeSubtitleText}
            </span>
          </div>
        )}

        {/* Visual Feedback Overlays */}
        <HudToast message={hudMessage} />
        <LongPressSpeedPill
          isActive={Boolean(isHoldSpeedActive)}
          speed={holdSpeedMultiplier}
        />
        <CenterFlashOverlay flashState={flashState} />
        <DropZoneOverlay isDragging={isDragging} />

        {/* Bottom Controls Bar */}
        <ControlsOverlay
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          bufferedEnd={bufferedEnd}
          volumePercent={volumePercent}
          isMuted={isMuted}
          speed={normalSpeed}
          pointA={pointA}
          pointB={pointB}
          bookmarks={bookmarks}
          isFullscreen={isFullscreen}
          isToolsOpen={isToolsOpen}
          onPlayPause={togglePlayPause}
          onSeek={(time) => {
            if (isProceduralMode && proceduralEngineRef.current) {
              proceduralEngineRef.current.setTime(time);
              setCurrentTime(time);
            } else if (videoRef.current) {
              videoRef.current.currentTime = time;
            }
          }}
          onVolumeChange={changeVolume}
          onToggleMute={toggleMute}
          onSpeedChange={changeSpeed}
          onToggleTools={() => {
            setIsToolsOpen((prev) => !prev);
            setIsPlaylistOpen(false);
          }}
          onToggleFullscreen={toggleFullscreen}
          onTogglePiP={togglePiP}
        />

        {/* Video Tools Popover Panel (E) */}
        <StudioToolsModal
          isOpen={isToolsOpen}
          onClose={() => setIsToolsOpen(false)}
          onReset={handleResetTransforms}
          skipStepSeconds={skipStepSeconds}
          onSeekRelative={seekRelative}
          onStepFrame={stepFrame}
          onPrevTrack={() => {
            if (currentIndex > 0) loadTrack(currentIndex - 1);
          }}
          onNextTrack={() => {
            if (currentIndex + 1 < playlist.length) loadTrack(currentIndex + 1);
          }}
          speed={normalSpeed}
          onSpeedChange={changeSpeed}
          holdSpeedMultiplier={holdSpeedMultiplier}
          onHoldSpeedChange={setHoldSpeedMultiplier}
          onSkipStepChange={setSkipStepSeconds}
          onSetPointA={setLoopPointA}
          onSetPointB={setLoopPointB}
          onClearLoop={clearLoop}
          onAddBookmark={addBookmark}
          onCaptureSnapshot={captureSnapshot}
          onOpenNotes={() => {
            setIsToolsOpen(false);
            setIsNotesOpen(true);
          }}
          transforms={transforms}
          onUpdateTransform={(updates) =>
            setTransforms((prev) => ({ ...prev, ...updates }))
          }
          subtitleOffset={subtitleOffset}
          onSubtitleOffsetChange={setSubtitleOffset}
        />

        {/* Playlist, History & Bookmarks Drawer (P / H) */}
        <PlaylistSidebar
          isOpen={isPlaylistOpen}
          onClose={() => setIsPlaylistOpen(false)}
          initialTab={sidebarInitialTab}
          playlist={playlist}
          currentIndex={currentIndex}
          loopMode={loopMode}
          onSelectTrack={loadTrack}
          onRemoveTrack={(idx) => {
            setPlaylist((prev) => prev.filter((_, i) => i !== idx));
          }}
          onClearPlaylist={() => {
            setPlaylist([]);
            setCurrentIndex(-1);
            if (videoRef.current) {
              videoRef.current.src = '';
            }
          }}
          onToggleLoopMode={() => {
            const modes: LoopMode[] = ['all', 'one', 'off'];
            const nextMode = modes[(modes.indexOf(loopMode) + 1) % modes.length];
            setLoopMode(nextMode);
            showHud(`Loop: ${nextMode.toUpperCase()}`);
          }}
          history={history}
          onResumeHistory={handleResumeHistory}
          onRemoveHistoryItem={(id) => {
            setHistory((prev) => deleteHistoryItem(prev, id));
            showHud('Removed from history');
          }}
          onClearHistory={() => {
            setHistory([]);
            showHud('History cleared');
          }}
          bookmarks={bookmarks}
          onAddBookmark={addBookmark}
          onSelectBookmark={(time) => {
            if (isProceduralMode && proceduralEngineRef.current) {
              proceduralEngineRef.current.setTime(time);
              setCurrentTime(time);
            } else if (videoRef.current) {
              videoRef.current.currentTime = time;
            }
          }}
          onRemoveBookmark={(idx) => {
            setBookmarks((prev) => prev.filter((_, i) => i !== idx));
          }}
          snapshots={snapshots}
          onCaptureSnapshot={captureSnapshot}
          onRemoveSnapshot={(idx) => {
            setSnapshots((prev) => prev.filter((_, i) => i !== idx));
          }}
          onOpenFiles={handleOpenFiles}
        />

        {/* Sample Clips Selection Modal */}
        <SampleClipsModal
          isOpen={isSampleClipsOpen}
          onClose={() => setIsSampleClipsOpen(false)}
          sampleTracks={DEMO_VIDEOS}
          currentTrackId={currentTrack?.id}
          onSelectTrack={(track) => {
            setPlaylist([track, ...DEMO_VIDEOS.filter((t) => t.id !== track.id)]);
            loadTrack(0);
          }}
          onSelectProceduralSynth={startProceduralSynthStream}
        />

        {/* Keyboard Shortcuts Dialog (?) */}
        <ShortcutsModal
          isOpen={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
        />
      </div>

      {/* Docked Side View: Lecture Notebook (Side-by-side with video, non-obstructing!) */}
      <LectureNotesSidebar
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        currentVideoId={currentTrack?.id || 'general'}
        currentVideoTitle={currentTrack?.name || 'Lecture'}
        currentTime={currentTime}
        isVideoPlaying={isPlaying}
        notes={notes}
        snapshots={snapshots}
        onAddNote={handleAddNote}
        onUpdateNoteText={handleUpdateNoteText}
        onDeleteNote={handleDeleteNote}
        onSeekToTime={(time) => {
          if (isProceduralMode && proceduralEngineRef.current) {
            proceduralEngineRef.current.setTime(time);
            setCurrentTime(time);
          } else if (videoRef.current) {
            videoRef.current.currentTime = time;
          }
          showHud(`Jumped to ${formatTime(time)}`);
        }}
        onPauseVideo={() => {
          if (videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause();
          }
        }}
        onResumeVideo={() => {
          if (videoRef.current && videoRef.current.paused) {
            videoRef.current.play().catch(() => {});
          }
        }}
        onCaptureFrameForNote={captureCurrentFrameDataUrl}
        showToast={showHud}
      />
    </main>
  );
}
