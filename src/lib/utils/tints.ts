import type { Route } from '$lib/data/types';

export function getRouteTint(route: Route, theme: 'light' | 'dark'): string {
  return theme === 'light' ? route.lightColor : route.darkColor;
}
