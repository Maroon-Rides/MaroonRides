import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SegmentedControl, {
  NativeSegmentedControlIOSChangeEvent,
} from '@react-native-segmented-control/segmented-control';
import { useQueryClient } from '@tanstack/react-query';
import React, { memo, useEffect, useState } from 'react';
import {
  Appearance,
  NativeSyntheticEvent,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import getTheme from 'src/app/theme';
import useAppStore from 'src/data/app_state';
import {
  defaultGroupMutation,
  useDefaultRouteGroup,
} from 'src/data/queries/structure/storage';
import { SheetProps } from 'src/utils';
import SheetHeader from '../ui/SheetHeader';

// Settings (for all routes and current route)
const Settings: React.FC<SheetProps> = ({ sheetRef }) => {
  const snapPoints = ['25%', '45%', '85%'];
  const [snap, _] = useState(1);

  const [themeSetting, setTheme] = useState(0);
  const [defaultGroupSetting, setDefaultGroupState] = useState(0);

  const theme = useAppStore((state) => state.theme);
  const setAppTheme = useAppStore((state) => state.setTheme);
  const dismissSheet = useAppStore((state) => state.dismissSheet);

  const { data: defaultGroup, refetch: refetchDefaultGroup } =
    useDefaultRouteGroup();
  const setDefaultGroup = defaultGroupMutation();
  const client = useQueryClient();

  function setDefaultGroupValue(
    evt: NativeSyntheticEvent<NativeSegmentedControlIOSChangeEvent>,
  ) {
    setDefaultGroupState(evt.nativeEvent.selectedSegmentIndex);
    setDefaultGroup.mutate(evt.nativeEvent.selectedSegmentIndex, {
      onSuccess: () => {
        refetchDefaultGroup();
      },
    });
  }

  function setAppThemeValue(
    evt: NativeSyntheticEvent<NativeSegmentedControlIOSChangeEvent>,
  ) {
    setTheme(evt.nativeEvent.selectedSegmentIndex);
    AsyncStorage.setItem(
      'app-theme',
      evt.nativeEvent.selectedSegmentIndex.toString(),
    );

    getTheme().then((theme) => {
      setAppTheme(theme);
      Appearance.setColorScheme(theme.mode);
    });
  }

  useEffect(() => {
    AsyncStorage.getItem('app-theme').then((value) => {
      if (value) {
        setTheme(Number(value));
      }
      const systemTheme = Appearance.getColorScheme() ?? 'light';
      AsyncStorage.setItem('system-theme', systemTheme);
    });
  }, []);

  useEffect(() => {
    if (defaultGroup) {
      setDefaultGroupState(defaultGroup);
    }
  }, [defaultGroup]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      index={snap}
      backgroundStyle={{ backgroundColor: theme.background }}
      handleIndicatorStyle={{ backgroundColor: theme.divider }}
      enablePanDownToClose={false}
      enableDynamicSizing={false}
    >
      <View>
        {/* header */}
        <SheetHeader
          title="Settings"
          icon={
            <TouchableOpacity
              style={{ marginLeft: 10 }}
              onPress={() => dismissSheet('settings')}
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
            selectedIndex={defaultGroupSetting}
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
    </BottomSheetModal>
  );
};

export default memo(Settings);
