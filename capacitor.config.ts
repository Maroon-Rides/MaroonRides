import type { CapacitorConfig } from '@capacitor/cli';

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
  ...devConfig,
};

export default config;
