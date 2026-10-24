/** Per-device preferences (audio, accessibility, graphics). Stored in localStorage. */
export interface Settings {
  sound: boolean;
  ambient: number;
  music: number;
  sfx: number;
  motion: "system" | "on" | "off";
  textLarge: boolean;
  highContrast: boolean;
  grain: boolean;
  rain: boolean;
  voices: boolean; // suspects speak their lines aloud
  voiceVolume: number;
  voiceRate: number;
  micAutoSend: boolean; // send spoken questions as soon as you stop talking
}

export const DEFAULT_SETTINGS: Settings = {
  sound: false, // audio is off until the player turns it on
  ambient: 0.6, music: 0.4, sfx: 0.7,
  motion: "system", textLarge: false, highContrast: false, grain: true, rain: true,
  voices: true, voiceVolume: 1, voiceRate: 1, micAutoSend: true,
};

const KEY = "dai.settings";

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}

export function storeSettings(s: Settings) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage blocked: settings last for this visit */ }
}

export function applySettingsToDocument(s: Settings) {
  const c = document.documentElement.classList;
  c.toggle("text-large", s.textLarge);
  c.toggle("high-contrast", s.highContrast);
  c.toggle("no-grain", !s.grain);
  c.toggle("no-rain", !s.rain);
  c.toggle("motion-off", s.motion === "off");
  c.toggle("motion-on", s.motion === "on");
}

export function prefersReducedMotion(s: Settings): boolean {
  if (s.motion === "off") return true;
  if (s.motion === "on") return false;
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}
