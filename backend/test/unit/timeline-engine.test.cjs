const test = require('node:test');
const assert = require('node:assert/strict');

const { sessionManager } = require('../../dist/modules/SessionManager.js');
const { TimelineEngine } = require('../../dist/modules/TimelineEngine.js');
const { SectionNotFoundError } = require('../../dist/types/index.js');

test.beforeEach(() => {
  sessionManager.clearAllSessions();
});

test.after(() => {
  sessionManager.clearAllSessions();
});

test('TimelineEngine adds, updates, and duplicates sections', () => {
  const engine = new TimelineEngine();
  const sessionId = sessionManager.createSession({
    genre: 'Indie',
    mood: 'Reflective',
  });

  const original = engine.addSection(sessionId, 'verse', 'Verse 1', 'line one');
  assert.equal(original.type, 'verse');
  assert.equal(original.label, 'Verse 1');

  const updated = engine.updateSection(sessionId, original.id, {
    content: 'updated line',
    label: 'Verse 1A',
  });
  assert.equal(updated.content, 'updated line');
  assert.equal(updated.label, 'Verse 1A');

  const duplicate = engine.duplicateSection(sessionId, original.id);
  assert.notEqual(duplicate.id, original.id);
  assert.equal(duplicate.content, 'updated line');
  assert.equal(duplicate.label, 'Verse 1A (Copy)');
});

test('TimelineEngine rejects reorder operations with unknown IDs', () => {
  const engine = new TimelineEngine();
  const sessionId = sessionManager.createSession({
    genre: 'Rock',
    mood: 'Energetic',
  });

  const section = engine.addSection(sessionId, 'chorus', 'Chorus', 'hook');

  assert.throws(
    () => engine.reorderSections(sessionId, [section.id, 'missing-section']),
    SectionNotFoundError
  );
});
