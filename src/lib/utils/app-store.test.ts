import { describe, expect, it } from 'vitest';
import { detectStorePlatform, StorePlatform } from './app-store';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const ANDROID =
  'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

describe('detectStorePlatform', () => {
  it('sends iPhones to the App Store', () => {
    expect(detectStorePlatform(IPHONE, 5)).toBe(StorePlatform.IOS);
  });

  it('sends Android phones to the Play Store', () => {
    expect(detectStorePlatform(ANDROID, 5)).toBe(StorePlatform.ANDROID);
  });

  it('treats a touch-capable Mac user agent as an iPad', () => {
    expect(detectStorePlatform(MAC, 5)).toBe(StorePlatform.IOS);
  });

  it('has no store for desktop browsers', () => {
    expect(detectStorePlatform(MAC, 0)).toBeNull();
    expect(detectStorePlatform(WINDOWS, 0)).toBeNull();
  });
});
