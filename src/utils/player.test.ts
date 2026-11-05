import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTime, formatRemainingTime } from './formatTime';
import { parseSubtitleText, findActiveCue } from './subtitleParser';
import {
  clampSpeed,
  mapVolumeAndBoost,
  checkABLoop,
  getNextTrackIndex,
  calculateProgressPercent,
} from './playerMath';

test('formatTime formats seconds properly', () => {
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(9), '00:09');
  assert.equal(formatTime(65), '01:05');
  assert.equal(formatTime(600), '10:00');
  assert.equal(formatTime(3665), '01:01:05');
  assert.equal(formatTime(-10), '00:00');
  assert.equal(formatTime(NaN), '00:00');
});

test('formatRemainingTime formats negative remaining duration', () => {
  assert.equal(formatRemainingTime(10, 60), '-00:50');
  assert.equal(formatRemainingTime(60, 60), '-00:00');
  assert.equal(formatRemainingTime(0, 0), '-00:00');
});

test('clampSpeed restricts speed between 0.25 and 4.0', () => {
  assert.equal(clampSpeed(0.1), 0.25);
  assert.equal(clampSpeed(1.25), 1.25);
  assert.equal(clampSpeed(2.0), 2.0);
  assert.equal(clampSpeed(5.5), 4.0);
  assert.equal(clampSpeed(NaN), 1.0);
});

test('mapVolumeAndBoost calculates normal volume and audio boost', () => {
  // Muted
  const muted = mapVolumeAndBoost(100, true);
  assert.equal(muted.effectiveMuted, true);
  assert.equal(muted.elementVolume, 0);

  // 50%
  const half = mapVolumeAndBoost(50, false);
  assert.equal(half.elementVolume, 0.5);
  assert.equal(half.gainValue, 1.0);
  assert.equal(half.isBoosted, false);

  // 100%
  const full = mapVolumeAndBoost(100, false);
  assert.equal(full.elementVolume, 1.0);
  assert.equal(full.gainValue, 1.0);
  assert.equal(full.isBoosted, false);

  // 175% Boost
  const boost = mapVolumeAndBoost(175, false);
  assert.equal(boost.elementVolume, 1.0);
  assert.equal(boost.gainValue, 1.75);
  assert.equal(boost.isBoosted, true);
});

test('checkABLoop triggers seek target when currentTime reaches B', () => {
  // Not at B yet
  const res1 = checkABLoop(12.5, 10, 20);
  assert.equal(res1.shouldLoop, false);

  // Reached B
  const res2 = checkABLoop(20.1, 10, 20);
  assert.equal(res2.shouldLoop, true);
  assert.equal(res2.seekTarget, 10);

  // Point B not set or invalid
  const res3 = checkABLoop(25, 10, null);
  assert.equal(res3.shouldLoop, false);
});

test('getNextTrackIndex handles loop modes', () => {
  assert.equal(getNextTrackIndex(0, 3, 'all'), 1);
  assert.equal(getNextTrackIndex(2, 3, 'all'), 0);
  assert.equal(getNextTrackIndex(2, 3, 'off'), null);
  assert.equal(getNextTrackIndex(1, 3, 'one'), 1);
});

test('calculateProgressPercent computes valid scrubber percentage', () => {
  assert.equal(calculateProgressPercent(30, 60), 50);
  assert.equal(calculateProgressPercent(0, 60), 0);
  assert.equal(calculateProgressPercent(70, 60), 100);
  assert.equal(calculateProgressPercent(10, 0), 0);
});

test('parseSubtitleText parses standard SRT / VTT cues', () => {
  const sampleVtt = `WEBVTT

1
00:00:01.000 --> 00:00:04.000
Welcome to NovaPlay

2
00:00:05.500 --> 00:00:08.200
Experience cinematic video controls
`;
  const cues = parseSubtitleText(sampleVtt);
  assert.equal(cues.length, 2);
  assert.equal(cues[0].start, 1.0);
  assert.equal(cues[0].end, 4.0);
  assert.equal(cues[0].text, 'Welcome to NovaPlay');

  const cue = findActiveCue(cues, 2.5);
  assert.ok(cue);
  assert.equal(cue?.text, 'Welcome to NovaPlay');

  const none = findActiveCue(cues, 4.5);
  assert.equal(none, null);

  // With offset
  const offsetCue = findActiveCue(cues, 6.0, 0.5); // adjusted = 5.5
  assert.ok(offsetCue);
  assert.equal(offsetCue?.text, 'Experience cinematic video controls');
});
