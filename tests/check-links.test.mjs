import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('link checker handles deployment base, relative pages, assets and anchors', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'cs-vault-links-'));
  try {
    await mkdir(path.join(root, 'course'));
    await writeFile(path.join(root, 'course/index.html'), '<main id="reading">Notes</main>');
    await writeFile(path.join(root, 'icon.svg'), '<svg/>');
    await writeFile(path.join(root, 'index.html'), '<a href="/CS-Vault/course/#reading">Course</a><a href="course/">Relative</a><img src="icon.svg"><a href="https://example.com/other">External</a>');
    const run = () => spawnSync(process.execPath, ['scripts/check-links.mjs', root], { encoding: 'utf8' });
    assert.equal(run().status, 0);
    await writeFile(path.join(root, 'index.html'), '<a href="/course/">Wrong base</a><img src="missing.svg"><a href="course/#missing">Bad anchor</a>');
    const failure = run();
    assert.equal(failure.status, 1);
    assert.match(failure.stderr, /missing deployment base/);
    assert.match(failure.stderr, /missing file/);
    assert.match(failure.stderr, /missing anchor/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('link checker rejects duplicate IDs, malformed paths and empty build output', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'cs-vault-link-structure-'));
  const run = () => spawnSync(process.execPath, ['scripts/check-links.mjs', root], { encoding: 'utf8' });
  try {
    assert.match(run().stderr, /No generated HTML pages/);
    await writeFile(path.join(root, 'index.html'), '<h2 id="same">First</h2><h2 id="same">Second</h2><a href="%E0%A4%A/">Bad path</a>');
    const failure = run();
    assert.equal(failure.status, 1);
    assert.match(failure.stderr, /duplicate id same/);
    assert.match(failure.stderr, /invalid encoded path/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
