import { modeStorageKey, setMode } from 'mode-watcher';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

export const PREFS_VERSION = 2;

// for android react native move
interface LegacyPrefsPlugin {
  getLegacyPrefs(): Promise<{ available: boolean; entries: Record<string, string> }>;
}
const LegacyPrefs = registerPlugin<LegacyPrefsPlugin>('LegacyPrefs');

export async function readLegacyPrefs(): Promise<Record<string, string> | null> {
  const platform = Capacitor.getPlatform();

  if (platform === 'ios') {
    try {
      const iosRCTPrefs = await Filesystem.readFile({
        directory: Directory.Library,
        path: 'Application Support/com.bwees.reveille-rides/RCTAsyncLocalStorage_V1/manifest.json',
      });

      return JSON.parse(atob(iosRCTPrefs.data as string));
    } catch (e) {
      console.log('Error migrating iOS RCTAsyncLocalStorage_V1 manifest:', e);
      return null;
    }
  }

  if (platform === 'android') {
    try {
      const { available, entries } = await LegacyPrefs.getLegacyPrefs();
      return available ? entries : null;
    } catch (e) {
      console.log('Error migrating Android RKStorage database:', e);
      return null;
    }
  }

  return null;
}

export async function importLegacyPrefs(
  legacy: Record<string, string | null>,
  { fillOnly = false }: { fillOnly?: boolean } = {},
) {
  const favorites = legacy['favorites'];
  if (favorites) {
    const current = (await Preferences.get({ key: 'favorites' })).value;
    const currentIsEmpty = !current || current === '[]';

    if (!fillOnly || currentIsEmpty) {
      await Preferences.set({ key: 'favorites', value: favorites });
    }
  }

  // rn stored the default group as an index
  const defaultGroup = legacy['default-group'] === '1' ? 'favorites' : 'all';
  const currentGroup = (await Preferences.get({ key: 'defaultGroup' })).value;

  if (!fillOnly || !currentGroup || currentGroup === 'all') {
    await Preferences.set({ key: 'defaultGroup', value: defaultGroup });
  }

  const userPickedMode = localStorage.getItem(modeStorageKey.current) !== null;
  if (!fillOnly || !userPickedMode) {
    let mode = 'system';
    if (legacy['app-theme'] === '1') {
      mode = 'light';
    } else if (legacy['app-theme'] === '2') {
      mode = 'dark';
    }
    setMode(mode as 'system' | 'light' | 'dark');
  }
}
