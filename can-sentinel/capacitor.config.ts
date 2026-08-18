import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cansentinel.app',
  appName: 'CAN Sentinel',
  webDir: 'dist',
  server: {
    cleartext: true
  }
};

export default config;
