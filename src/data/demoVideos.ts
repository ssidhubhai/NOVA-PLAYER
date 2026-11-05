import { VideoTrack, SubtitleCue } from '../types/player';

export const DEMO_VIDEOS: VideoTrack[] = [
  {
    id: 'demo-flower',
    name: 'Blooming Flora (CC0 Cinema Sample)',
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    sizeText: 'MDN 4K/HD',
    isDemo: true,
  },
  {
    id: 'demo-oceans',
    name: 'Oceans (Wildlife HD Teaser)',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    sizeText: 'ZenCDN 1080p',
    isDemo: true,
  },
  {
    id: 'demo-sintel',
    name: 'Sintel Trailer (W3C Open Movie)',
    url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    sizeText: 'W3C 720p',
    isDemo: true,
  },
];

// No instructional or how-to-use overlay cues during playback.
// Educational lecture captions can be loaded via subtitle files (.srt, .vtt)
export const DEMO_SUBTITLES: SubtitleCue[] = [];
