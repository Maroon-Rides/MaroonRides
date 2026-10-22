declare global {
  const __APP_VERSION__: string;

  interface WindowEventMap {
    dynamictypechange: CustomEvent<{ bodyPointSize: number }>;
  }
}

export {};
