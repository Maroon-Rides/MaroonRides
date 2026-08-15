import { Preferences } from '@capacitor/preferences';
import { PREFS_VERSION, readLegacyPrefs, importLegacyPrefs } from './legacy-migration';

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
