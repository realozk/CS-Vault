import test from 'node:test';
import assert from 'node:assert/strict';
import { isContentNew, refreshNewContentBadges } from '../src/scripts/content-recency.ts';

const publishedAt = Date.parse('2026-10-14T00:00:00Z');
const week = 7 * 24 * 60 * 60 * 1000;

test('new content expires exactly seven days after publication', () => {
  assert.equal(isContentNew(publishedAt, publishedAt), true);
  assert.equal(isContentNew(publishedAt, publishedAt + week - 1), true);
  assert.equal(isContentNew(publishedAt, publishedAt + week), false);
  assert.equal(isContentNew(publishedAt, publishedAt + week * 2), false);
});

test('empty courses, invalid dates and future dates do not show New', () => {
  for (const date of [null, NaN, Infinity, publishedAt + 1]) {
    assert.equal(isContentNew(date, publishedAt), false);
  }
});

test('an unchanged static page expires badges when reopened, in either language', () => {
  const badges = ['New', 'جديد'].map(textContent => ({ textContent, hidden: true, dataset: { newContentAt: String(publishedAt) } }));
  const root = { querySelectorAll: () => badges };
  refreshNewContentBadges(root, publishedAt + week - 1);
  assert.ok(badges.every(badge => !badge.hidden));
  refreshNewContentBadges(root, publishedAt + week);
  assert.ok(badges.every(badge => badge.hidden));
});
