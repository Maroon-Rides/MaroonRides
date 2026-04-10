import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { setMode } from 'mode-watcher';

export async function migratePrefs() {
  const currentVersion = Number((await Preferences.get({ key: 'version' })).value ?? 0);

  if (currentVersion < 1) {
    // initial iOS migration
    if (Capacitor.getPlatform() === 'ios') {
      try {
        const iosRCTPrefs = await Filesystem.readFile({
          directory: Directory.Library,
          path: 'Application Support/com.bwees.reveille-rides/RCTAsyncLocalStorage_V1/manifest.json',
        });

        const manifest = JSON.parse(atob(iosRCTPrefs.data as string));

        await Preferences.set({
          key: 'favorites',
          value: manifest['favorites'] ?? '[]',
        });

        await Preferences.set({
          key: 'defaultGroup',
          value: manifest['default-group'] ?? '0',
        });

        // Theme watcher handles its own saving of theme preference
        // just migrate the old app preference over.
        let mode = 'system';
        if (manifest['app-theme'] === '1') {
          mode = 'light';
        } else if (manifest['app-theme'] === '2') {
          mode = 'dark';
        }
        setMode(mode as 'system' | 'light' | 'dark');
      } catch (e) {
        console.log('Error migrating iOS RCTAsyncLocalStorage_V1 manifest:', e);
      }
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
