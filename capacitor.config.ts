import type { CapacitorConfig } from '@capacitor/cli';
import { devConfig } from './dev.config';

const config: CapacitorConfig = {
  appId: 'com.bwees.reveillerides',
  appName: 'Maroon Rides',
  webDir: 'build',
  ...devConfig,
};

export default config;
