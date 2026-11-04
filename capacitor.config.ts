import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'nl.btnt.scorekeeper',
  appName: 'Scorekeeper',
  webDir: 'dist',
  plugins: {
    Keyboard: {
      // Shrink the web view instead of panning the page under the status bar.
      resize: 'native',
    },
  },
};

export default config;
