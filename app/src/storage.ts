// Chrome Storage API wrapper for settings

export interface SendShortcutSettings {
  ctrlEnter: boolean;
  shiftEnter: boolean;
}

export const DEFAULT_SETTINGS: SendShortcutSettings = {
  ctrlEnter: true,
  shiftEnter: false,
};

const STORAGE_KEY = "sendShortcutSettings";

export async function getSettings(): Promise<SendShortcutSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(STORAGE_KEY, (result) => {
      const stored = result[STORAGE_KEY] as SendShortcutSettings | undefined;
      resolve(stored ?? DEFAULT_SETTINGS);
    });
  });
}

export async function saveSettings(settings: SendShortcutSettings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [STORAGE_KEY]: settings }, resolve);
  });
}

export function onSettingsChange(callback: (settings: SendShortcutSettings) => void): () => void {
  const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
    if (changes[STORAGE_KEY]) {
      const newValue = changes[STORAGE_KEY].newValue as SendShortcutSettings | undefined;
      callback(newValue ?? DEFAULT_SETTINGS);
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
