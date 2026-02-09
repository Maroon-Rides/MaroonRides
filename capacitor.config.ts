import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bwees.reveillerides',
  appName: 'Maroon Rides',
  webDir: 'build',
  server: {
    url: 'http://100.89.139.58:5173',
    cleartext: true,
  },
};

export default config;
