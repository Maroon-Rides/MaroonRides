import { Preferences } from '@capacitor/preferences';
import { readLegacyPrefs } from './legacy-migration';
import { modeStorageKey, setMode } from 'mode-watcher';

export const PREFS_VERSION = 2;
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

export async function migratePrefs() {
  const currentVersion = Number((await Preferences.get({ key: 'version' })).value ?? 0);
  if (currentVersion >= PREFS_VERSION) return; // explicit flow

  if (currentVersion < 1) {
    const legacy = await readLegacyPrefs();
    if (legacy) await importLegacyPrefs(legacy);

    console.log('Preferences migrated to version 1');
    await Preferences.set({ key: 'version', value: '1' });
  }

  if (currentVersion < 2) {
    // Migrate default group to string enums
    const defaultGroup = await Preferences.get({ key: 'defaultGroup' }).then((res) => res.value);

    await Preferences.set({
      key: 'defaultGroup',
      value: defaultGroup === '1' ? 'favorites' : 'all',
    });

    console.log('Preferences migrated to version 2');
    await Preferences.set({ key: 'version', value: '2' });
  }
}

export async function toggleFavorite(routeCode: string) {
  const favorites = JSON.parse((await Preferences.get({ key: 'favorites' })).value ?? '[]');
  const newFavorites = favorites.includes(routeCode)
    ? favorites.filter((code: string) => code !== routeCode)
    : [...favorites, routeCode];

  await Preferences.set({ key: 'favorites', value: JSON.stringify(newFavorites) });
}
