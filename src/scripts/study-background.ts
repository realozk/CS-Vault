// A decorative pixel field: expanding waves reveal colour and drifting ASCII.
// Persisted across Home, Subject, and Quiz pages for continuous motion and transitions.
type Wave = {
  x: number; y: number; radius: number; speed: number;
  band: number; reach: number; power: number;
};
type Character = {
  col: number; row: number; phase: number; hue: number; symbol: number;
};
type PersistedStudyBgState = {
  canvas?: HTMLCanvasElement;
  width: number;
  height: number;
  waves: Wave[];
  characters: Character[];
  elapsed: number;
  collapsing: boolean;
  collapseProgress: number;
  collapseRadii: number[];
  collapsePowers: number[];
};

declare global {
  interface Window {
    __csVaultStudyBg?: PersistedStudyBgState;
  }
}

const initStudyBackground = () => {
const canvas = document.querySelector<HTMLCanvasElement>('.study-background-canvas');
const container = canvas?.parentElement;
const grid = container?.querySelector<HTMLElement>('.study-background-grid');
const context = canvas?.getContext('2d');

if (canvas && container && context && canvas.dataset.initialized !== 'true') {
  canvas.dataset.initialized = 'true';
  const cellSize = (width: number, height: number) => {
    // Retain the original texture on ordinary screens without multiplying work
    // on large/high-resolution displays.
    let size = Math.max(13, Math.ceil(Math.sqrt(width * height / 8000)));
    while (Math.ceil(width / size) * Math.ceil(height / size) > 8000) size++;
    return size;
  };
  const glyphs = '.:-=+*#%@<>/\\[]{}01';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionEnabled = () => document.documentElement.dataset.studyMotion !== 'off';
  const coarsePointer = window.matchMedia('(pointer: coarse)');
  const mobileBudget = () => coarsePointer.matches || window.innerWidth < 768;

  const isQuizUrl = (pathname: string) => /\/quiz\//.test(pathname);
  const isQuizPage = () =>
    Boolean(document.getElementById('quiz-widget')) || isQuizUrl(window.location.pathname);

  const saved = window.__csVaultStudyBg;
  let width = saved?.width ?? 0;
  let height = saved?.height ?? 0;
  let cell = cellSize(width, height);
  let columns = width > 0 ? Math.ceil(width / cell) : 0;
  let rows = height > 0 ? Math.ceil(height / cell) : 0;
  let waves: Wave[] = saved?.waves ?? [];
  let characters: Character[] = saved?.characters ?? [];
  let dark = document.documentElement.classList.contains('dark');
  let inView = true;
  let frame = 0;
  let previousTime = 0;
  let elapsed = saved?.elapsed ?? 0;
  let collapsing = saved ? saved.collapsing : isQuizPage();
  let collapseProgress = saved ? saved.collapseProgress : (collapsing ? 1 : 0);
  let collapseRadii: number[] = saved?.collapseRadii ?? [];
  let collapsePowers: number[] = saved?.collapsePowers ?? [];

  const applyTransitionOpacity = (progress: number) => {
    const t = Math.min(1, Math.max(0, progress));
    if (t <= 0) {
      if (grid) grid.style.opacity = '';
      if (canvas) canvas.style.opacity = '';
    } else if (t >= 1) {
      if (grid) grid.style.opacity = '0';
      if (canvas) canvas.style.opacity = '0';
    } else {
      const fade = (1 - t) ** 1.35;
      if (grid) grid.style.opacity = fade.toFixed(3);
      if (canvas) {
        const baseCanvasOpacity = dark ? 0.68 : 0.72;
        canvas.style.opacity = (baseCanvasOpacity * fade).toFixed(3);
      }
    }
  };

  container.classList.toggle('is-collapsing', collapsing);
  applyTransitionOpacity(collapseProgress);

  const syncSavedState = () => {
    window.__csVaultStudyBg = {
      canvas,
      width,
      height,
      waves,
      characters,
      elapsed,
      collapsing,
      collapseProgress,
      collapseRadii,
      collapsePowers,
    };
  };

  const random = (min: number, max: number) => min + Math.random() * (max - min);
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  function newWave(index: number, previous?: Wave): Wave {
    // Keep the three sources spread across the page, including partial edge rings.
    let x = 0;
    let y = 0;
    for (let attempt = 0; attempt < 10; attempt++) {
      x = width * (index + random(.05, .95)) / 3;
      y = random(height * .08, height * .82);
      if (!previous || Math.hypot(x - previous.x, y - previous.y) > height * .28) break;
    }
    return {
      x, y, radius: 0,
      speed: random(8.2 - index * 1.4, 11 - index * 1.3),
      band: random(16 + index * 7, 22 + index * 9),
      reach: Math.hypot(width, height) * random(.4 + index * .22, .58 + index * .24),
      power: .6 + index * .2,
    };
  }

  function strength(wave: Wave): number {
    return wave.power * (1 - clamp(wave.radius / wave.reach, 0, 1)) ** 2;
  }

  function captureCollapseSnapshot() {
    collapseRadii = waves.map((wave) => wave.radius);
    collapsePowers = waves.map((wave) => strength(wave));
  }

  function waveAt(distance: number, wave: Wave, radiusScale = 1): number {
    const r = wave.radius * radiusScale;
    const b = wave.band * radiusScale;
    if (r < 0.5 || b < 0.5) return 0;
    // Three soft fronts leave concentric rings instead of a solid, scaling blob.
    return (
      Math.exp(-Math.abs(distance - r) / b) +
      Math.exp(-Math.abs(distance - r + cell * 3.4 * radiusScale) / (b * 1.2)) * .62 +
      Math.exp(-Math.abs(distance - r + cell * 6.8 * radiusScale) / (b * 1.35)) * .38
    ) * strength(wave);
  }

  function paint(time: number, staticFrame = false) {
    if (!context || !canvas) return;
    const t = clamp(collapseProgress, 0, 1);
    applyTransitionOpacity(t);

    if (t >= 1) {
      context.clearRect(0, 0, width, height);
      return;
    }

    const isTransitioning = t > 0;
    const radiusScale = isTransitioning ? (1 - t) ** 1.65 : 1;
    const whiteMix = isTransitioning ? clamp((t ** 0.75) * 1.45, 0, 1) : 0;
    const fadeOut = isTransitioning ? (1 - t) ** 1.25 : 1;
    const ramp = isTransitioning ? Math.min(1, t / 0.15) : 0;

    // Fade the previous frame, preserving brief character trails on transparency.
    const baseErase = staticFrame ? 1 : (dark ? .16 : .08);
    const eraseAlpha = isTransitioning ? baseErase + (0.38 - baseErase) * ramp : baseErase;
    context.globalCompositeOperation = 'destination-out';
    context.fillStyle = `rgba(0, 0, 0, ${eraseAlpha})`;
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = 'source-over';
    context.shadowBlur = 0;

    const cellSat = (46 * (1 - whiteMix)).toFixed(1);
    const cellBaseL = dark ? 60 : 52;
    const cellLight = (cellBaseL + (100 - cellBaseL) * whiteMix).toFixed(1);
    const normalCellAlpha = staticFrame ? (dark ? .12 : .32) : (dark ? .035 : .08);
    const transitionCellAlpha = dark ? 0.18 : 0.28;
    const activeCellAlpha = isTransitioning
      ? (normalCellAlpha + (transitionCellAlpha - normalCellAlpha) * ramp) * fadeOut
      : normalCellAlpha;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = (col + .5) * cell;
        const y = (row + .5) * cell;
        let intensity = 0;
        for (const wave of waves) intensity += waveAt(Math.hypot(x - wave.x, y - wave.y), wave, radiusScale);
        intensity = Math.min(1, intensity);
        if (intensity < .06) continue;
        const hue = (Math.hypot(x - waves[0].x, y - waves[0].y) * .14 + waves[0].radius * .9) % 360;
        const alpha = intensity * activeCellAlpha;
        context.fillStyle = `hsla(${hue}, ${cellSat}%, ${cellLight}%, ${alpha})`;
        context.fillRect(col * cell + 1, row * cell + 1, cell - 2, cell - 2);
      }
    }

    const charSat = (100 * (1 - whiteMix)).toFixed(1);
    const charBaseL = dark ? 78 : 46;
    const charLight = (charBaseL + (100 - charBaseL) * whiteMix).toFixed(1);
    const shadowBaseL = dark ? 72 : 46;
    const shadowLight = (shadowBaseL + (100 - shadowBaseL) * whiteMix).toFixed(1);

    context.font = '13px ui-monospace, SFMono-Regular, Menlo, monospace';
    context.textAlign = 'center';
    context.textBaseline = 'top';
    for (const character of characters) {
      const x = (character.col + .5) * cell;
      const y = character.row * cell;
      let intensity = 0;
      let offsetX = 0;
      let offsetY = 0;
      let nearestWave = waves[0];
      let nearestDist = Infinity;
      for (const wave of waves) {
        const dx = x - wave.x;
        const dy = y - wave.y;
        const distance = Math.max(.001, Math.hypot(dx, dy));
        if (isTransitioning && distance < nearestDist) {
          nearestDist = distance;
          nearestWave = wave;
        }
        const front = waveAt(distance, wave, radiusScale);
        intensity += front;
        offsetX += dx / distance * front * cell * .7;
        offsetY += dy / distance * front * cell * .7;
      }
      const pulse = .82 + Math.sin(time / 950 + character.phase) * .12;
      const alpha = clamp(intensity * pulse, 0, 1) * clamp(1 - y / (height * 1.06), .22, 1);
      if (alpha < .015) continue;
      const symbol = glyphs[Math.floor(character.symbol + time / 220 + character.phase + alpha * 19) % glyphs.length];
      const hue = (character.hue + time * .045 + alpha * 90) % 360;
      const drawX = isTransitioning && nearestWave
        ? nearestWave.x + (x + offsetX - nearestWave.x) * radiusScale
        : x + offsetX;
      const drawY = isTransitioning && nearestWave
        ? nearestWave.y + (y + offsetY - nearestWave.y) * radiusScale
        : y + offsetY;
      context.fillStyle = `hsla(${hue}, ${charSat}%, ${charLight}%, ${Math.min(.86, .05 + alpha * .72) * fadeOut})`;
      context.shadowBlur = (4 + alpha * 8) * fadeOut;
      context.shadowColor = `hsla(${hue}, ${charSat}%, ${shadowLight}%, ${(.2 + alpha * .24) * fadeOut})`;
      context.fillText(symbol, drawX, drawY);
    }
    context.shadowBlur = 0;
  }

  function resize() {
    if (!canvas || !container || !context) return;
    const bounds = container.getBoundingClientRect();
    if (bounds.width < 10 || bounds.height < 10) return;
    // A long document must never turn a page transition into a full-page canvas.
    const nextWidth = Math.max(1, Math.round(Math.min(bounds.width, window.innerWidth)));
    const nextHeight = Math.max(1, Math.round(Math.min(bounds.height, window.innerHeight)));
    if (width === nextWidth && height === nextHeight && canvas.width === nextWidth && canvas.height === nextHeight && waves.length > 0) {
      return;
    }

    const hadWaves = waves.length > 0 && width > 0 && height > 0;
    const sourceCanvas =
      canvas.width === width && canvas.height === height
        ? canvas
        : (saved?.canvas && saved.canvas.width > 0 && saved.canvas.height > 0 ? saved.canvas : null);
    let snapshot: HTMLCanvasElement | null = null;
    if (hadWaves && sourceCanvas && sourceCanvas.width > 0 && sourceCanvas.height > 0) {
      snapshot = document.createElement('canvas');
      snapshot.width = sourceCanvas.width;
      snapshot.height = sourceCanvas.height;
      snapshot.getContext('2d')?.drawImage(sourceCanvas, 0, 0);
    }

    const prevWidth = width || nextWidth;
    const prevHeight = height || nextHeight;
    width = nextWidth;
    height = nextHeight;
    cell = cellSize(width, height);
    container.style.setProperty('--study-grid-size', `${cell}px`);
    // One physical pixel per CSS pixel retains the reference's soft pixel texture.
    canvas.width = width;
    canvas.height = height;
    columns = Math.ceil(width / cell);
    rows = Math.ceil(height / cell);

    if (hadWaves) {
      const scaleX = width / prevWidth;
      const scaleY = height / prevHeight;
      const scaleDiag = Math.hypot(width, height) / Math.hypot(prevWidth, prevHeight);
      for (const wave of waves) {
        wave.x *= scaleX;
        wave.y *= scaleY;
        wave.reach *= scaleDiag;
      }
      for (const character of characters) {
        character.col = ((character.col % columns) + columns) % columns;
        character.row = ((character.row % rows) + rows) % rows;
      }
      if (snapshot && collapseProgress < 1) {
        context.drawImage(snapshot, 0, 0, width, height);
      }
    } else {
      waves = [];
      for (let index = 0; index < 3; index++) waves.push(newWave(index, waves[index - 1]));
      waves.forEach((wave, index) => { wave.radius = Math.min(wave.reach * .35, 100 + index * 60); });
      const count = clamp(Math.floor(columns * rows / 72), 56, 180);
      characters = Array.from({ length: count }, () => ({
        col: Math.floor(random(0, columns)), row: Math.floor(random(0, rows)),
        phase: random(0, Math.PI * 2), hue: random(0, 360), symbol: Math.floor(random(0, glyphs.length)),
      }));
    }

    syncSavedState();

    if (motionEnabled()) {
      if (reducedMotion.matches) waves.forEach((wave, index) => { wave.radius = 70 + index * 25; });
      // Show the pixel field immediately instead of waiting for empty rings to grow.
      paint(elapsed, true);
    }
  }

  function animate(now: number) {
    frame = 0;
    if (document.hidden || !inView || reducedMotion.matches || !motionEnabled()) return;
    const isTransitioning =
      (collapsing && collapseProgress < 1) || (!collapsing && collapseProgress > 0);
    const activeInterval = 1000 / (isTransitioning ? (mobileBudget() ? 30 : 60) : (mobileBudget() ? 12 : 24));
    if (!previousTime) previousTime = now - activeInterval;
    const delta = now - previousTime;
    if (delta >= activeInterval) {
      const seconds = Math.min(delta / 1000, .1);
      previousTime = now;
      elapsed += seconds * 1000;

      if (collapsing && collapseProgress < 1) {
        collapseProgress = Math.min(1, collapseProgress + seconds / 0.72);
      } else if (!collapsing && collapseProgress > 0) {
        collapseProgress = Math.max(0, collapseProgress - seconds / 0.62);
      } else {
        waves.forEach((wave, index) => {
          wave.radius += wave.speed * seconds;
          if (wave.radius >= wave.reach) waves[index] = newWave(index, wave);
        });
      }

      for (const character of characters) {
        character.phase += seconds * 1.9;
        if (Math.random() < seconds * 2.4) {
          character.col = (character.col + (Math.random() < .5 ? -1 : 1) + columns) % columns;
          character.row = (character.row + (Math.random() < .5 ? -1 : 1) + rows) % rows;
        }
        if (Math.random() < seconds * .28) {
          character.col = Math.floor(random(0, columns));
          character.row = Math.floor(random(0, rows));
        }
      }
      syncSavedState();
      paint(elapsed);
    }
    if (!collapsing || collapseProgress < 1) {
      frame = requestAnimationFrame(animate);
    }
  }

  function startCollapse() {
    if (collapsing) return;
    if (collapseProgress <= 0.05) {
      captureCollapseSnapshot();
    }
    collapsing = true;
    container?.classList.add('is-collapsing');
    syncSavedState();
    updateMotion();
  }

  function startExpand() {
    if (!collapsing) return;
    if (collapseRadii.length === 0) {
      captureCollapseSnapshot();
    }
    collapsing = false;
    container?.classList.remove('is-collapsing');
    syncSavedState();
    updateMotion();
  }

  function updateMotion() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    if (!motionEnabled()) return;
    if (reducedMotion.matches) {
      collapseProgress = collapsing ? 1 : 0;
      waves.forEach((wave, index) => { wave.radius = 70 + index * 25; });
      paint(0, true);
    } else if (!document.hidden && inView && (!collapsing || collapseProgress < 1)) {
      frame = requestAnimationFrame(animate);
    }
  }

  const onMotionChange = () => {
    resize();
    updateMotion();
  };

  const onDocumentClick = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
    if (!link || link.target || link.hasAttribute('download')) return;
    try {
      const targetUrl = new URL(link.href, window.location.origin);
      if (targetUrl.origin !== window.location.origin) return;
      if (isQuizUrl(targetUrl.pathname)) {
        startCollapse();
      } else if (collapsing && targetUrl.pathname !== window.location.pathname) {
        startExpand();
      }
    } catch {
      // Ignore malformed hrefs.
    }
  };

  const onBeforePreparation = (event: Event) => {
    const navEvent = event as Event & { to?: URL };
    if (!navEvent.to) return;
    if (isQuizUrl(navEvent.to.pathname)) {
      startCollapse();
    } else {
      startExpand();
    }
  };

  const resizeObserver = new ResizeObserver(resize);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    updateMotion();
  });
  const themeObserver = new MutationObserver(() => {
    const nextDark = document.documentElement.classList.contains('dark');
    if (dark === nextDark) return;
    dark = nextDark;
    if (collapseProgress < 1 && motionEnabled()) {
      context.clearRect(0, 0, width, height);
      paint(elapsed, true);
    }
  });
  resize();
  resizeObserver.observe(container);
  intersectionObserver.observe(container);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('click', onDocumentClick, true);
  document.addEventListener('astro:before-preparation', onBeforePreparation);
  document.addEventListener('visibilitychange', updateMotion);
  reducedMotion.addEventListener('change', updateMotion);
  document.addEventListener('cs-vault:motion-change', onMotionChange);
  updateMotion();
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      resize();
      updateMotion();
    }
  });
  const cleanup = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    themeObserver.disconnect();
    document.removeEventListener('click', onDocumentClick, true);
    document.removeEventListener('astro:before-preparation', onBeforePreparation);
    document.removeEventListener('visibilitychange', updateMotion);
    reducedMotion.removeEventListener('change', updateMotion);
    document.removeEventListener('cs-vault:motion-change', onMotionChange);
    document.removeEventListener('astro:after-swap', onAfterSwap);
  };
  const onAfterSwap = () => {
    if (!document.contains(canvas)) {
      canvas.dataset.initialized = 'false';
      cleanup();
      return;
    }
    const nextDark = document.documentElement.classList.contains('dark');
    if (dark !== nextDark) {
      dark = nextDark;
      if (collapseProgress < 1 && motionEnabled()) {
        context.clearRect(0, 0, width, height);
        paint(elapsed, true);
      }
    }
    if (isQuizPage()) {
      startCollapse();
    } else {
      startExpand();
    }
    resize();
    updateMotion();
  };
  document.addEventListener('astro:after-swap', onAfterSwap);
  window.addEventListener('pagehide', (event) => {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    // Cached pages keep their observers so Back/Forward can resume the field.
    if (event.persisted) return;
    cleanup();
  });
}
};

initStudyBackground();
document.addEventListener('astro:after-swap', initStudyBackground);
document.addEventListener('astro:page-load', initStudyBackground);

export {};

