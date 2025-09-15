import useAppStore from './app_state';

export function useTheme() {
  const theme = useAppStore((state) => state.theme);
  return theme;
}
