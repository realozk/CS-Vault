// Keep the visitor's choice in memory too: blocked storage must not reset it
// when Astro replaces the page, and reused controls must only bind once.
const motionKey = 'cs-vault-motion';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let motionPreference = document.documentElement.dataset.studyMotion === 'on';
let storageUnavailable = false;
try {
  motionPreference = localStorage.getItem(motionKey) !== 'off';
} catch {
  // Keep the visible background default when browser storage is unavailable.
}

const applyMotionPreference = () => {
  const enabled = motionPreference && !reducedMotion.matches;
  const value = enabled ? 'on' : 'off';
  const changed = document.documentElement.dataset.studyMotion !== value;
  document.documentElement.dataset.studyMotion = value;
  const toggle = document.getElementById('study-motion-toggle') as HTMLInputElement | null;
  if (toggle) toggle.checked = motionPreference;
  const status = document.getElementById('study-motion-storage-status');
  if (status) {
    status.textContent = storageUnavailable ? status.dataset.storageMessage ?? '' : '';
    status.classList.toggle('hidden', !storageUnavailable);
  }
  if (changed) document.dispatchEvent(new Event('cs-vault:motion-change'));
};

const initAppearanceSettings = () => {
  applyMotionPreference();
  const toggle = document.getElementById('study-motion-toggle') as HTMLInputElement | null;
  if (!toggle || toggle.dataset.bound === 'true') return;
  toggle.dataset.bound = 'true';
  toggle.addEventListener('change', () => {
    motionPreference = toggle.checked;
    try {
      localStorage.setItem(motionKey, motionPreference ? 'on' : 'off');
      storageUnavailable = false;
    } catch {
      storageUnavailable = true;
    }
    applyMotionPreference();
  });
};

document.addEventListener('astro:before-swap', event => {
  const root = (event as Event & { newDocument?: Document }).newDocument?.documentElement;
  if (root) root.dataset.studyMotion = motionPreference && !reducedMotion.matches ? 'on' : 'off';
});
document.addEventListener('astro:after-swap', initAppearanceSettings);
document.addEventListener('astro:page-load', initAppearanceSettings);
reducedMotion.addEventListener('change', applyMotionPreference);
window.addEventListener('storage', event => {
  if (event.key !== motionKey && event.key !== null) return;
  motionPreference = event.newValue !== 'off';
  storageUnavailable = false;
  applyMotionPreference();
});
window.addEventListener('pageshow', initAppearanceSettings);
initAppearanceSettings();

export {};
