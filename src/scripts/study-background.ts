// A decorative pixel field: expanding waves reveal colour and drifting ASCII.
// It is only mounted on the home page and never participates in study controls.
const canvas = document.querySelector<HTMLCanvasElement>('.study-background-canvas');
const container = canvas?.parentElement;
const context = canvas?.getContext('2d');

if (canvas && container && context) {
  const cell = 13;
  const glyphs = '.:-=+*#%@<>/\\[]{}01';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const frameInterval = 1000 / 24;
  type Wave = {
    x: number; y: number; radius: number; speed: number;
    band: number; reach: number; power: number;
  };
  type Character = {
    col: number; row: number; phase: number; hue: number; symbol: number;
  };
  let width = 0;
  let height = 0;
  let columns = 0;
  let rows = 0;
  let waves: Wave[] = [];
  let characters: Character[] = [];
  let dark = document.documentElement.classList.contains('dark');
  let inView = true;
  let frame = 0;
  let previousTime = 0;
  let elapsed = 0;

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

  function waveAt(distance: number, wave: Wave): number {
    // Three soft fronts leave concentric rings instead of a solid, scaling blob.
    return (
      Math.exp(-Math.abs(distance - wave.radius) / wave.band) +
      Math.exp(-Math.abs(distance - wave.radius + cell * 3.4) / (wave.band * 1.2)) * .62 +
      Math.exp(-Math.abs(distance - wave.radius + cell * 6.8) / (wave.band * 1.35)) * .38
    ) * strength(wave);
  }

  function paint(time: number, staticFrame = false) {
    if (!context || !canvas) return;
    // Fade the previous frame, preserving brief character trails on transparency.
    context.globalCompositeOperation = 'destination-out';
    context.fillStyle = `rgba(0, 0, 0, ${staticFrame ? 1 : dark ? .16 : .08})`;
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = 'source-over';
    context.shadowBlur = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = (col + .5) * cell;
        const y = (row + .5) * cell;
        let intensity = 0;
        for (const wave of waves) intensity += waveAt(Math.hypot(x - wave.x, y - wave.y), wave);
        intensity = Math.min(1, intensity);
        if (intensity < .06) continue;
        const hue = (Math.hypot(x - waves[0].x, y - waves[0].y) * .14 + waves[0].radius * .9) % 360;
        const alpha = intensity * (staticFrame ? dark ? .12 : .32 : dark ? .035 : .08);
        context.fillStyle = `hsla(${hue}, 46%, ${dark ? 60 : 52}%, ${alpha})`;
        context.fillRect(col * cell + 1, row * cell + 1, cell - 2, cell - 2);
      }
    }

    context.font = '13px ui-monospace, SFMono-Regular, Menlo, monospace';
    context.textAlign = 'center';
    context.textBaseline = 'top';
    for (const character of characters) {
      const x = (character.col + .5) * cell;
      const y = character.row * cell;
      let intensity = 0;
      let offsetX = 0;
      let offsetY = 0;
      for (const wave of waves) {
        const dx = x - wave.x;
        const dy = y - wave.y;
        const distance = Math.max(.001, Math.hypot(dx, dy));
        const front = waveAt(distance, wave);
        intensity += front;
        offsetX += dx / distance * front * cell * .7;
        offsetY += dy / distance * front * cell * .7;
      }
      const pulse = .82 + Math.sin(time / 950 + character.phase) * .12;
      const alpha = clamp(intensity * pulse, 0, 1) * clamp(1 - y / (height * 1.06), .22, 1);
      if (alpha < .015) continue;
      const symbol = glyphs[Math.floor(character.symbol + time / 220 + character.phase + alpha * 19) % glyphs.length];
      const hue = (character.hue + time * .045 + alpha * 90) % 360;
      context.fillStyle = `hsla(${hue}, 100%, ${dark ? 78 : 46}%, ${Math.min(.86, .05 + alpha * .72)})`;
      context.shadowBlur = 4 + alpha * 8;
      context.shadowColor = `hsla(${hue}, 100%, ${dark ? 72 : 46}%, ${.2 + alpha * .24})`;
      context.fillText(symbol, x + offsetX, y + offsetY);
    }
    context.shadowBlur = 0;
  }

  function resize() {
    if (!canvas || !container || !context) return;
    const bounds = container.getBoundingClientRect();
    if (width === Math.round(bounds.width) && height === Math.round(bounds.height)) return;
    width = Math.max(1, Math.round(bounds.width));
    height = Math.max(1, Math.round(bounds.height));
    // One physical pixel per CSS pixel retains the reference's soft pixel texture.
    canvas.width = width;
    canvas.height = height;
    columns = Math.ceil(width / cell);
    rows = Math.ceil(height / cell);
    waves = [];
    for (let index = 0; index < 3; index++) waves.push(newWave(index, waves[index - 1]));
    const count = clamp(Math.floor(columns * rows / 72), 56, 180);
    characters = Array.from({ length: count }, () => ({
      col: Math.floor(random(0, columns)), row: Math.floor(random(0, rows)),
      phase: random(0, Math.PI * 2), hue: random(0, 360), symbol: Math.floor(random(0, glyphs.length)),
    }));
    if (reducedMotion.matches) {
      waves.forEach((wave, index) => { wave.radius = 70 + index * 25; });
      paint(0, true);
    }
  }

  function animate(now: number) {
    frame = 0;
    if (document.hidden || !inView || reducedMotion.matches) return;
    if (!previousTime) previousTime = now - frameInterval;
    const delta = now - previousTime;
    if (delta >= frameInterval) {
      const seconds = Math.min(delta / 1000, .1);
      previousTime = now;
      elapsed += seconds * 1000;
      waves.forEach((wave, index) => {
        wave.radius += wave.speed * seconds;
        if (wave.radius >= wave.reach) waves[index] = newWave(index, wave);
      });
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
      paint(elapsed);
    }
    frame = requestAnimationFrame(animate);
  }

  function updateMotion() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    if (reducedMotion.matches) {
      waves.forEach((wave, index) => { wave.radius = 70 + index * 25; });
      paint(0, true);
    } else if (!document.hidden && inView) {
      frame = requestAnimationFrame(animate);
    }
  }

  const resizeObserver = new ResizeObserver(resize);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    updateMotion();
  });
  const themeObserver = new MutationObserver(() => {
    const nextDark = document.documentElement.classList.contains('dark');
    if (dark === nextDark) return;
    dark = nextDark;
    context.clearRect(0, 0, width, height);
    paint(elapsed, true);
  });
  resize();
  resizeObserver.observe(container);
  intersectionObserver.observe(container);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', updateMotion);
  reducedMotion.addEventListener('change', updateMotion);
  updateMotion();
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      resize();
      updateMotion();
    }
  });
  window.addEventListener('pagehide', (event) => {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    // Cached pages keep their observers so Back/Forward can resume the field.
    if (event.persisted) return;
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    themeObserver.disconnect();
    document.removeEventListener('visibilitychange', updateMotion);
    reducedMotion.removeEventListener('change', updateMotion);
  });
}
