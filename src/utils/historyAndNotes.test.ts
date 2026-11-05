import test from 'node:test';
import assert from 'node:assert/strict';
import {
  upsertHistory,
  deleteHistoryItem,
  upsertNote,
  deleteNote,
  filterNotes,
  formatRelativeDate,
} from './historyAndNotes';
import { HistoryItem, VideoNote } from '../types/player';

test('upsertHistory puts latest item first and deduplicates', () => {
  const item1: HistoryItem = {
    id: 'vid-1',
    title: 'Intro Video',
    url: 'https://example.com/1.mp4',
    lastTime: 120,
    duration: 300,
    lastWatchedAt: 1000,
  };
  const item2: HistoryItem = {
    id: 'vid-2',
    title: 'Second Video',
    url: 'https://example.com/2.mp4',
    lastTime: 45,
    duration: 200,
    lastWatchedAt: 2000,
  };

  let history = upsertHistory([], item1);
  assert.equal(history.length, 1);
  assert.equal(history[0].id, 'vid-1');

  history = upsertHistory(history, item2);
  assert.equal(history.length, 2);
  assert.equal(history[0].id, 'vid-2');

  // Re-watching item1 updates lastTime and moves it to top
  const updatedItem1: HistoryItem = {
    ...item1,
    lastTime: 250,
    lastWatchedAt: 3000,
  };
  history = upsertHistory(history, updatedItem1);
  assert.equal(history.length, 2);
  assert.equal(history[0].id, 'vid-1');
  assert.equal(history[0].lastTime, 250);
});

test('deleteHistoryItem removes by id', () => {
  const history: HistoryItem[] = [
    {
      id: 'h1',
      title: 'V1',
      url: 'u1',
      lastTime: 10,
      duration: 100,
      lastWatchedAt: 1,
    },
    {
      id: 'h2',
      title: 'V2',
      url: 'u2',
      lastTime: 20,
      duration: 100,
      lastWatchedAt: 2,
    },
  ];

  const res = deleteHistoryItem(history, 'h1');
  assert.equal(res.length, 1);
  assert.equal(res[0].id, 'h2');
});

test('upsertNote sorts notes by timestamp', () => {
  const n1: VideoNote = {
    id: 'n1',
    videoId: 'v1',
    videoTitle: 'V1',
    timestamp: 60,
    createdAt: 10,
    text: 'Middle note',
  };
  const n2: VideoNote = {
    id: 'n2',
    videoId: 'v1',
    videoTitle: 'V1',
    timestamp: 10,
    createdAt: 20,
    text: 'Early note',
  };
  const n3: VideoNote = {
    id: 'n3',
    videoId: 'v1',
    videoTitle: 'V1',
    timestamp: 120,
    createdAt: 30,
    text: 'Late note',
  };

  let notes = upsertNote([], n1);
  notes = upsertNote(notes, n2);
  notes = upsertNote(notes, n3);

  assert.equal(notes.length, 3);
  assert.equal(notes[0].timestamp, 10);
  assert.equal(notes[1].timestamp, 60);
  assert.equal(notes[2].timestamp, 120);
});

test('deleteNote and filterNotes function as expected', () => {
  const notes: VideoNote[] = [
    { id: '1', videoId: 'a', videoTitle: 'A', timestamp: 10, createdAt: 1, text: 'Note A' },
    { id: '2', videoId: 'b', videoTitle: 'B', timestamp: 20, createdAt: 2, text: 'Note B' },
  ];

  const filtered = filterNotes(notes, 'a');
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, '1');

  const afterDelete = deleteNote(notes, '1');
  assert.equal(afterDelete.length, 1);
  assert.equal(afterDelete[0].id, '2');
});

test('formatRelativeDate returns human friendly text', () => {
  assert.equal(formatRelativeDate(Date.now() - 10000), 'Just now');
  assert.equal(formatRelativeDate(Date.now() - 120000), '2m ago');
});
