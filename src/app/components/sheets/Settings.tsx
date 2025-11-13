import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { SegmentedControlEvent } from '@lib/utils/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import React, { memo, useEffect, useState } from 'react';
import {
  Appearance,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ASQueryKey } from '@lib/queries/structure/aggie_spirit';
import {
  defaultGroupMutation,
  StorageKey,
  useDefaultRouteGroup,
} from '@lib/queries/structure/storage';
import useAppStore from '@lib/state/app_state';
import { useTheme } from '@lib/state/utils';
import { useQueryClient } from '@tanstack/react-query';
import getTheme from 'src/app/theme';
import { Sheets, useSheetController } from '../providers/sheet-controller';
import SheetHeader from '../ui/SheetHeader';
import BaseSheet, { SheetProps } from './BaseSheet';

// Settings (for all routes and current route)
const Settings: React.FC<SheetProps> = ({ sheetRef }) => {
  const [themeSetting, setTheme] = useState(0);

  const theme = useTheme();
  const setAppTheme = useAppStore((state) => state.setTheme);
  const { dismissSheet } = useSheetController();

  const { data: defaultGroup, refetch: refetchDefaultGroup } =
    useDefaultRouteGroup();
  const setDefaultGroup = defaultGroupMutation();
  const queryClient = useQueryClient();

  function setDefaultGroupValue(evt: SegmentedControlEvent) {
    setDefaultGroup.mutate(evt.nativeEvent.selectedSegmentIndex, {
      onSuccess: async () => {
        await refetchDefaultGroup();
      },
    });
  }

  async function setAppThemeValue(evt: SegmentedControlEvent) {
    setTheme(evt.nativeEvent.selectedSegmentIndex);
    await AsyncStorage.setItem(
      'app-theme',
      evt.nativeEvent.selectedSegmentIndex.toString(),
    );

    const newTheme = await getTheme();
    setAppTheme(newTheme);
    Appearance.setColorScheme(newTheme.mode);

    // refresh routes
    await queryClient.invalidateQueries({ queryKey: [ASQueryKey.ROUTE_LIST] });
  }

  // TODO: move this an app state load with a mutation?
  useEffect(() => {
    void AsyncStorage.getItem(StorageKey.APP_THEME).then(async (value) => {
      if (value) {
        setTheme(Number(value));
      }
      const systemTheme = Appearance.getColorScheme() ?? 'light';
      await AsyncStorage.setItem(StorageKey.SYSTEM_THEME, systemTheme);
    });
  }, []);

  return (
    <BaseSheet
      sheetKey={Sheets.SETTINGS}
      sheetRef={sheetRef}
      snapPoints={['25%', '45%', '85%']}
      initialSnapIndex={1}
    >
      <View>
        {/* header */}
        <SheetHeader
          title="Settings"
          icon={
            <TouchableOpacity
              style={{ marginLeft: 10 }}
              onPress={() => dismissSheet(Sheets.SETTINGS)}
            >
              <Ionicons
                name="close-circle"
                size={28}
                color={theme.exitButton}
              />
            </TouchableOpacity>
          }
        />
        <View
          style={{ height: 1, backgroundColor: theme.divider, marginTop: 8 }}
        />
      </View>

      <BottomSheetScrollView style={{ padding: 16 }}>
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>
            Default Route Group
          </Text>
          <Text style={{ fontSize: 12, color: theme.subtitle, marginTop: 4 }}>
            Choose the default route group to display when the app opens
          </Text>
          <SegmentedControl
            values={['All Routes', 'Favorites']}
            selectedIndex={defaultGroup}
            style={{ marginTop: 8 }}
            onChange={setDefaultGroupValue}
            backgroundColor={
              Platform.OS === 'android'
                ? theme.androidSegmentedBackground
                : undefined
            }
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>
            App Theme
          </Text>
          <Text style={{ fontSize: 12, color: theme.subtitle, marginTop: 4 }}>
            Choose the theme that the app uses.
          </Text>
          <SegmentedControl
            values={['System', 'Light', 'Dark']}
            selectedIndex={themeSetting}
            style={{ marginTop: 8 }}
            onChange={setAppThemeValue}
            backgroundColor={
              Platform.OS === 'android'
                ? theme.androidSegmentedBackground
                : undefined
            }
          />
        </View>
      </BottomSheetScrollView>
    </BaseSheet>
  );
};

export default memo(Settings);
