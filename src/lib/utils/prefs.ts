import { Preferences } from '@capacitor/preferences';
import { setMode } from 'mode-watcher';
import { readLegacyPrefs } from './legacy-migration';

export async function migratePrefs() {
  const currentVersion = Number((await Preferences.get({ key: 'version' })).value ?? 0);

  if (currentVersion < 1) {
    // initial iOS/Android react native migration
    const legacyPrefs = await readLegacyPrefs();

    if (legacyPrefs) {
      await Preferences.set({
        key: 'favorites',
        value: legacyPrefs['favorites'] ?? '[]',
      });

      await Preferences.set({
        key: 'defaultGroup',
        value: legacyPrefs['default-group'] ?? '0',
      });

      // Theme watcher handles its own saving of theme preference
      // just migrate the old app preference over.
      let mode = 'system';
      if (legacyPrefs['app-theme'] === '1') {
        mode = 'light';
      } else if (legacyPrefs['app-theme'] === '2') {
        mode = 'dark';
      }

      setMode(mode as 'system' | 'light' | 'dark');
    }

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
