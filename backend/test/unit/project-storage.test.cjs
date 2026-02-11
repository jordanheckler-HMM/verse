const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

test('ProjectStorage falls back to a user-writable directory when VERSE_PROJECTS_DIR is unset', async () => {
  const originalProjectsDir = process.env.VERSE_PROJECTS_DIR;

  try {
    delete process.env.VERSE_PROJECTS_DIR;

    const modulePath = require.resolve('../../dist/services/ProjectStorage.js');
    delete require.cache[modulePath];
    const ProjectStorage = require(modulePath);

    const project = await ProjectStorage.createProject(`fallback-dir-test-${Date.now()}`);
    const fallbackDir = path.join(os.homedir(), '.verse', 'projects');
    const savedPath = path.join(fallbackDir, `${project.id}.json`);

    await fs.access(savedPath);
    await ProjectStorage.deleteProject(project.id);
  } finally {
    if (originalProjectsDir === undefined) {
      delete process.env.VERSE_PROJECTS_DIR;
    } else {
      process.env.VERSE_PROJECTS_DIR = originalProjectsDir;
    }
  }
});
