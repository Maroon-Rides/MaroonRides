import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';
import semver from 'semver';
import { StorePlatform, storeUrl } from './app-store';

export const APP_VERSION = __APP_VERSION__;

export function isAppVersionSupported(minimumVersion: string): boolean {
  return semver.gte(APP_VERSION, minimumVersion);
}

export async function openAppStore() {
  const platform =
    Capacitor.getPlatform() === StorePlatform.ANDROID ? StorePlatform.ANDROID : StorePlatform.IOS;
  await AppLauncher.openUrl({ url: storeUrl(platform) });
}
