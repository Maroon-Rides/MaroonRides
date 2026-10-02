import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';
import semver from 'semver';

export const APP_VERSION = __APP_VERSION__;

const APP_STORE_URL = 'https://apps.apple.com/app/id6475358068';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.maroonrides.maroonrides';

export function isAppVersionSupported(minimumVersion: string): boolean {
  return semver.gte(APP_VERSION, minimumVersion);
}

export async function openAppStore() {
  const url = Capacitor.getPlatform() === 'android' ? PLAY_STORE_URL : APP_STORE_URL;
  await AppLauncher.openUrl({ url });
}
