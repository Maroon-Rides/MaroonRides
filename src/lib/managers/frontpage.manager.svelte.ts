import { Preferences } from '@capacitor/preferences';

class FrontPageManager {
  favorites = $state<string[]>([]);
  selectedTab = $state('all');

  constructor() {
    this.loadDefaultGroup(); //only set once here since it only applies on-open
    this.loadFavorites();
  }

  async loadDefaultGroup() {
    this.selectedTab = (await Preferences.get({ key: 'defaultGroup' })).value ?? 'all';
  }
  async loadFavorites() {
    this.favorites = JSON.parse((await Preferences.get({ key: 'favorites' })).value ?? '[]');
  }
}

// Persist frontPageManager across Svelte HMRs
let frontPageManager: FrontPageManager;

if (import.meta.hot && import.meta.hot.data) {
  if (!import.meta.hot.data.frontPageManager) {
    import.meta.hot.data.frontPageManager = new FrontPageManager();
  }
  frontPageManager = import.meta.hot.data.frontPageManager;
} else {
  frontPageManager = new FrontPageManager();
}

export { frontPageManager };
