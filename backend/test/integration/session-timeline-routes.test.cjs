const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const { sessionRouter } = require('../../dist/routes/session.js');
const { timelineRouter } = require('../../dist/routes/timeline.js');
const { sessionManager } = require('../../dist/modules/SessionManager.js');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/session', sessionRouter);
  app.use('/api/timeline', timelineRouter);
  return app;
}

function startServer(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function stopServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function requestJson(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json();
  return { response, body };
}

test.beforeEach(() => {
  sessionManager.clearAllSessions();
});

test.after(() => {
  sessionManager.clearAllSessions();
});

test('session and timeline routes support a full happy path', async () => {
  const server = await startServer(createApp());
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const start = await requestJson(baseUrl, '/api/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metadata: { genre: 'Pop', mood: 'Uplifting' },
      }),
    });

    assert.equal(start.response.status, 201);
    assert.ok(start.body.sessionId);

    const add = await requestJson(baseUrl, '/api/timeline/section', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: start.body.sessionId,
        type: 'verse',
        label: 'Verse 1',
      }),
    });
    assert.equal(add.response.status, 201);
    assert.equal(add.body.label, 'Verse 1');

    const update = await requestJson(
      baseUrl,
      `/api/timeline/section/${add.body.id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: start.body.sessionId,
          content: 'updated lyrics',
        }),
      }
    );
    assert.equal(update.response.status, 200);
    assert.equal(update.body.content, 'updated lyrics');

    const end = await requestJson(baseUrl, '/api/session/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: start.body.sessionId }),
    });
    assert.equal(end.response.status, 200);
    assert.equal(end.body.message, 'Session ended successfully');
  } finally {
    await stopServer(server);
  }
});

test('routes return 400 for missing required fields', async () => {
  const server = await startServer(createApp());
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const start = await requestJson(baseUrl, '/api/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(start.response.status, 400);
    assert.equal(start.body.error, 'Missing required field: metadata');

    const add = await requestJson(baseUrl, '/api/timeline/section', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(add.response.status, 400);
    assert.equal(add.body.error, 'Missing required fields: sessionId, type, label');
  } finally {
    await stopServer(server);
  }
});
