import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUDIO_ROOMS,
  type ChapterizerPersistenceState,
  curateAudioRoomByMood,
  formatTimecodeMmSs,
  saveAudioProgressTimecode,
  upsertTrackBookmarkNote,
} from './audioAgents';

test('AUDIO_ROOMS defines all 7 required music, audiobook & podcast 3D loop paths', () => {
  const paths = AUDIO_ROOMS.map((r) => r.videoLoopPath);
  assert.deepEqual(paths, [
    '/assets/rooms/audio/westworld-cafe.mp4',
    '/assets/rooms/audio/mj-concert.mp4',
    '/assets/rooms/audio/berlin-rave.mp4',
    '/assets/rooms/audio/tomorrowland.mp4',
    '/assets/rooms/audio/meditation.mp4',
    '/assets/rooms/audio/ac-library.mp4',
    '/assets/rooms/audio/podcast-studio.mp4',
  ]);
});

test('Mood & Frequency Curator Agent picks Berlin Rave for midnight 142 BPM high energy', () => {
  const ravePick = curateAudioRoomByMood({
    hourOfDay: 2,
    targetBpm: 142,
    mood: 'high_energy',
  });
  assert.equal(ravePick.recommendedRoom.id, 'berlin-rave');
  assert.ok(ravePick.matchScorePct >= 85);

  const sleepPick = curateAudioRoomByMood({
    hourOfDay: 23,
    targetBpm: 58,
    mood: 'sleep_meditation',
  });
  assert.equal(sleepPick.recommendedRoom.id, 'meditation');

  const bookPick = curateAudioRoomByMood({
    hourOfDay: 22,
    targetBpm: 72,
    mood: 'story_night',
  });
  assert.equal(bookPick.recommendedRoom.id, 'ac-library');
});

test('Chapterizer Agent formats timecodes, saves playback progress, and appends timestamped notes', () => {
  assert.equal(formatTimecodeMmSs(252), '04:12');

  const initial: ChapterizerPersistenceState = {
    progressByTrackSec: {},
    notes: [],
  };

  const withProgress = saveAudioProgressTimecode(initial, 'tr-ac-1', 410);
  assert.equal(withProgress.progressByTrackSec['tr-ac-1'], 410);

  const withNote = upsertTrackBookmarkNote(withProgress, {
    trackId: 'tr-ac-1',
    roomId: 'ac-library',
    timeSec: 415,
    noteText: 'کدهای داوینچی در کتابخانه',
  });
  assert.equal(withNote.notes.length, 1);
  assert.equal(withNote.notes[0].createdAtLabel, '06:55');
  assert.equal(withNote.progressByTrackSec['tr-ac-1'], 415);
});
