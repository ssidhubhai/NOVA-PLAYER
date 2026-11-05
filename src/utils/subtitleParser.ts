export interface SubtitleCue {
  id: string;
  start: number;
  end: number;
  text: string;
}

/**
 * Parses raw .srt or .vtt subtitle content into structured cues.
 */
export function parseSubtitleText(raw: string): SubtitleCue[] {
  if (!raw || typeof raw !== 'string') return [];

  const cues: SubtitleCue[] = [];
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\n+/);

  // Matches 00:01:20.500 --> 00:01:23.000 or 01:20,500 --> 01:23,000
  const timeRegex = /(?:(\d{1,2}):)?(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(?:(\d{1,2}):)?(\d{2}):(\d{2})[.,](\d{3})/;

  let cueCount = 0;
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(timeRegex);
      if (match) {
        cueCount++;
        const startHrs = parseInt(match[1] || '0', 10);
        const startMins = parseInt(match[2], 10);
        const startSecs = parseInt(match[3], 10);
        const startMs = parseInt(match[4], 10);
        const start = startHrs * 3600 + startMins * 60 + startSecs + startMs / 1000;

        const endHrs = parseInt(match[5] || '0', 10);
        const endMins = parseInt(match[6], 10);
        const endSecs = parseInt(match[7], 10);
        const endMs = parseInt(match[8], 10);
        const end = endHrs * 3600 + endMins * 60 + endSecs + endMs / 1000;

        const textLines = lines.slice(i + 1).map(l => l.trim()).filter(Boolean);
        const text = textLines.join(' ');

        if (text) {
          cues.push({
            id: `cue-${cueCount}`,
            start,
            end,
            text,
          });
        }
        break;
      }
    }
  }

  return cues;
}

/**
 * Returns the currently active subtitle cue for a given playback time and sync offset.
 */
export function findActiveCue(
  cues: SubtitleCue[],
  currentTime: number,
  offsetSeconds: number = 0
): SubtitleCue | null {
  if (!cues || cues.length === 0) return null;
  const adjusted = currentTime - offsetSeconds;
  return cues.find(c => adjusted >= c.start && adjusted <= c.end) || null;
}
