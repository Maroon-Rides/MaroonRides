import { BottomSheetModal } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeSegmentedControlIOSChangeEvent } from '@react-native-segmented-control/segmented-control';
import { NativeSyntheticEvent } from 'react-native';
import { SearchSuggestion } from './interfaces';

export interface SheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
}

export type SegmentedControlEvent =
  NativeSyntheticEvent<NativeSegmentedControlIOSChangeEvent>;

// given a hex code without the #, return a lighter version of it
export function getLighterColor(color: string): string {
  color = color;

  // remove the # from the beginning of the color
  color = color.substring(1);

  // Parse the color components from the input string
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // Increase the brightness of each color component
  const lightenedR = Math.min(r + 100, 255);
  const lightenedG = Math.min(g + 100, 255);
  const lightenedB = Math.min(b + 100, 255);

  // Convert the lightened color components back to a hex string
  const lightenedColor =
    lightenedR.toString(16).padStart(2, '0') +
    lightenedG.toString(16).padStart(2, '0') +
    lightenedB.toString(16).padStart(2, '0');

  return '#' + lightenedColor;
}

export async function getColorScheme(): Promise<string> {
  const themeIndex = await AsyncStorage.getItem('app-theme');
  const systemTheme = (await AsyncStorage.getItem('system-theme')) ?? 'light';

  switch (themeIndex) {
    case '1':
      return 'light';
    case '2':
      return 'dark';
    default:
      return systemTheme;
  }
}

export function suggestionEqual(lhs: SearchSuggestion, rhs: SearchSuggestion) {
  if (lhs.type !== rhs.type) return false;

  if (lhs.type === 'map') return rhs.placeId === lhs.placeId;
  if (lhs.type === 'stop') return rhs.stopCode === lhs.stopCode;

  return false;
}
