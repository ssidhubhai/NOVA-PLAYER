/**
 * Format seconds into mm:ss or hh:mm:ss format.
 */
export function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) {
    return '00:00';
  }
  const total = Math.floor(sec);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format remaining time with a negative prefix, e.g. -01:23
 */
export function formatRemainingTime(currentTime: number, duration: number): string {
  if (!Number.isFinite(duration) || duration <= 0) {
    return '-00:00';
  }
  const remaining = Math.max(0, duration - (Number.isFinite(currentTime) ? currentTime : 0));
  return `-${formatTime(remaining)}`;
}
