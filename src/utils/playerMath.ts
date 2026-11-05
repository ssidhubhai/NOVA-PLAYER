export type LoopMode = 'all' | 'one' | 'off';
export type FitMode = 'contain' | 'cover' | 'fill';

/**
 * Clamps speed to valid range [0.25, 4.0] with 2 decimal precision.
 */
export function clampSpeed(speed: number): number {
  if (!Number.isFinite(speed)) return 1.0;
  const clamped = Math.max(0.25, Math.min(4.0, speed));
  return Math.round(clamped * 100) / 100;
}

/**
 * Maps volume percentage [0, 200] to HTMLMediaElement.volume [0, 1]
 * and Web Audio GainNode gain [0, 2.0].
 */
export function mapVolumeAndBoost(percent: number, isMuted: boolean): {
  elementVolume: number;
  gainValue: number;
  isBoosted: boolean;
  effectiveMuted: boolean;
} {
  const clamped = Math.max(0, Math.min(200, Math.round(percent)));
  const effectiveMuted = isMuted || clamped === 0;

  if (effectiveMuted) {
    return {
      elementVolume: 0,
      gainValue: 0,
      isBoosted: false,
      effectiveMuted: true,
    };
  }

  if (clamped <= 100) {
    return {
      elementVolume: clamped / 100,
      gainValue: 1.0,
      isBoosted: false,
      effectiveMuted: false,
    };
  }

  // Clamped > 100 -> audio boost up to 200%
  return {
    elementVolume: 1.0,
    gainValue: clamped / 100,
    isBoosted: true,
    effectiveMuted: false,
  };
}

/**
 * Checks if current playback time has reached or passed Loop Point B.
 */
export function checkABLoop(
  currentTime: number,
  pointA: number | null,
  pointB: number | null
): { shouldLoop: boolean; seekTarget: number } {
  if (pointA !== null && pointB !== null && pointB > pointA) {
    if (currentTime >= pointB) {
      return { shouldLoop: true, seekTarget: pointA };
    }
  }
  return { shouldLoop: false, seekTarget: currentTime };
}

/**
 * Determines the next playlist index when a track ends.
 */
export function getNextTrackIndex(
  currentIndex: number,
  totalTracks: number,
  loopMode: LoopMode
): number | null {
  if (totalTracks <= 0) return null;
  if (loopMode === 'one') {
    return currentIndex;
  }
  if (currentIndex + 1 < totalTracks) {
    return currentIndex + 1;
  }
  if (loopMode === 'all') {
    return 0;
  }
  return null;
}

/**
 * Calculates percentage progress for scrubber (0 to 100).
 */
export function calculateProgressPercent(currentTime: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  const pct = (currentTime / duration) * 100;
  return Math.max(0, Math.min(100, pct));
}
