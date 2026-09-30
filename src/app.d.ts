declare global {
  interface WindowEventMap {
    dynamictypechange: CustomEvent<{ bodyPointSize: number }>;
  }
}

export {};
