import { readFileSync } from 'node:fs';
import type { CapacitorConfig } from '@capacitor/cli';

const { version } = JSON.parse(readFileSync('./package.json', 'utf8'));

let devConfig: CapacitorConfig = {};
try {
  //@ts-expect-error ts-ignore
  devConfig = require('./dev.config').devConfig;
} catch {
  // dev.config.ts is optional and git-ignored; ignore if it doesn't exist.
}

const config: CapacitorConfig = {
  appId: 'com.maroonrides.maroonrides',
  appName: 'Maroon Rides',
  webDir: 'build',
  ios: { overrideUserAgent: `Maroon Rides App (iOS) v${version}` },
  android: { overrideUserAgent: `Maroon Rides App (Android) v${version}` },
  ...devConfig,
};

export default config;
