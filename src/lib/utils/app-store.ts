export enum StorePlatform {
  IOS = 'ios',
  ANDROID = 'android',
}

const STORE_URLS: Record<StorePlatform, string> = {
  [StorePlatform.IOS]: 'https://apps.apple.com/app/id6475358068',
  [StorePlatform.ANDROID]:
    'https://play.google.com/store/apps/details?id=com.maroonrides.maroonrides',
};

const IOS_USER_AGENT = /iPhone|iPad|iPod/;
const ANDROID_USER_AGENT = /Android/;
const MAC_USER_AGENT = /Macintosh/;

export function storeUrl(platform: StorePlatform): string {
  return STORE_URLS[platform];
}

// iPadOS Safari reports itself as a Mac, so touch support is what tells them apart.
export function detectStorePlatform(
  userAgent: string,
  maxTouchPoints: number,
): StorePlatform | null {
  if (ANDROID_USER_AGENT.test(userAgent)) return StorePlatform.ANDROID;
  if (IOS_USER_AGENT.test(userAgent)) return StorePlatform.IOS;
  if (MAC_USER_AGENT.test(userAgent) && maxTouchPoints > 1) return StorePlatform.IOS;
  return null;
}
