// Capture the browser's `beforeinstallprompt` event at module load — i.e. before
// React renders — because the event fires once, very early in page load, and is
// lost if no listener is attached when it arrives. Components subscribe via
// `subscribePWAInstall` and read the latest prompt with `getDeferredPrompt`.

let deferredPrompt = null;
let installed = false;
const listeners = new Set();
let initialized = false;

const notify = () => {
  for (const listener of listeners) listener();
};

export const initPWAInstallListener = () => {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    installed = true;
    deferredPrompt = null;
    notify();
  });
};

export const getDeferredPrompt = () => deferredPrompt;

export const isAppInstalled = () => installed;

export const consumeDeferredPrompt = () => {
  deferredPrompt = null;
  notify();
};

export const markInstalled = () => {
  installed = true;
  deferredPrompt = null;
  notify();
};

export const subscribePWAInstall = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
