const test = require('node:test');
const assert = require('node:assert/strict');

const { SessionManager } = require('../../dist/modules/SessionManager.js');
const { SessionNotFoundError } = require('../../dist/types/index.js');

test('SessionManager creates, updates, and ends a session', () => {
  const manager = new SessionManager();
  const sessionId = manager.createSession({
    genre: 'Pop',
    mood: 'Upbeat',
  });

  const created = manager.getSession(sessionId);
  assert.ok(created);
  assert.equal(created.metadata.genre, 'Pop');
  assert.equal(created.sections.length, 0);

  manager.updateSessionMetadata(sessionId, { mood: 'Melancholic' });
  const updated = manager.getSessionOrThrow(sessionId);
  assert.equal(updated.metadata.mood, 'Melancholic');

  const ended = manager.endSession(sessionId);
  assert.equal(ended, true);
  assert.equal(manager.getSession(sessionId), null);
});

test('SessionManager throws for unknown session lookups', () => {
  const manager = new SessionManager();

  assert.throws(
    () => manager.getSessionOrThrow('missing-session'),
    SessionNotFoundError
  );
});
