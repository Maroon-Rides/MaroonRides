import { Capacitor, registerPlugin } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';

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