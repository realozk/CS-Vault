const NEW_CONTENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function isContentNew(publishedAt: number | null, now = Date.now()): boolean {
  if (publishedAt === null || !Number.isFinite(publishedAt)) return false;
  const age = now - publishedAt;
  return age >= 0 && age < NEW_CONTENT_WINDOW_MS;
}

// Check when the page opens, so a static deployment can expire its badges
// without another build, an API request, or a background timer.
export function refreshNewContentBadges(root: ParentNode, now = Date.now()): void {
  root.querySelectorAll<HTMLElement>('[data-new-content-at]').forEach(badge => {
    badge.hidden = !isContentNew(Number(badge.dataset.newContentAt), now);
  });
}
