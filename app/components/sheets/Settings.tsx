import React, { memo, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert, NativeSyntheticEvent, Platform, BackHandler } from "react-native";
import { BottomSheetModal, BottomSheetView, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import Ionicons from '@expo/vector-icons/Ionicons';
import SheetHeader from "../ui/SheetHeader";
import SegmentedControl, { NativeSegmentedControlIOSChangeEvent } from "@react-native-segmented-control/segmented-control";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAppStore from "../../data/app_state";
import { defaultGroupMutation, useDefaultRouteGroup } from "app/data/storage_query";

interface SheetProps {
    sheetRef: React.RefObject<BottomSheetModal>
}

// Settings (for all routes and current route)
const Settings: React.FC<SheetProps> = ({ sheetRef }) => {
    const snapPoints = ['25%', '45%', '85%'];
    const [snap, _] = useState(1)

    const [themeSetting, setTheme] = useState(0);
    const theme = useAppStore((state) => state.theme);

    const { data: defaultGroup } = useDefaultRouteGroup();
    const setDefaultGroup = defaultGroupMutation();


    function setDefaultGroupValue(evt: NativeSyntheticEvent<NativeSegmentedControlIOSChangeEvent>) {
        setDefaultGroup.mutate(evt.nativeEvent.selectedSegmentIndex);
    }

    function setAppThemeValue(evt: NativeSyntheticEvent<NativeSegmentedControlIOSChangeEvent>) {
        setTheme(evt.nativeEvent.selectedSegmentIndex);
        AsyncStorage.setItem('app-theme', evt.nativeEvent.selectedSegmentIndex.toString());

        // show alert to restart app
        Alert.alert("Restart App", "Please restart the app to see the changes.");
    }

    useEffect(() => {
        AsyncStorage.getItem('app-theme').then((value) => {
            if (value) {
                setTheme(Number(value));
            }
        })
    }, [])

    BackHandler.addEventListener('hardwareBackPress', () => {
        sheetRef.current?.dismiss()
        return false
    })

    return (
        <BottomSheetModal 
            ref={sheetRef} 
            snapPoints={snapPoints} 
            index={snap} 
            backgroundStyle={{backgroundColor: theme.background}}
            handleIndicatorStyle={{ backgroundColor: theme.divider }}
        >
            <BottomSheetView>
                {/* header */}
                <SheetHeader
                    title="Settings"
                    icon={
                        <TouchableOpacity style={{ marginLeft: 10 }} onPress={() => sheetRef.current?.dismiss()}>
                            <Ionicons name="close-circle" size={28} color={theme.exitButton} />
                        </TouchableOpacity>
                    }
                />
                <View style={{ height: 1, backgroundColor: theme.divider, marginTop: 8 }} />


            </BottomSheetView>


            <BottomSheetScrollView
                style={{ padding: 16 }}
            >
                <View style={{ marginBottom: 16 }}>
                    <Text style={{fontSize: 16, fontWeight: "bold", color: theme.text}}>Default Route Group</Text>
                    <Text style={{fontSize: 12, color: theme.subtitle, marginTop: 4}}>Choose the default route group to display when the app opens</Text>
                    <SegmentedControl
                        values={['All Routes', 'Favorites']}
                        selectedIndex={defaultGroup}
                        style={{ marginTop: 8 }}
                        onChange={setDefaultGroupValue}
                        backgroundColor={Platform.OS == "android" ? theme.androidSegmentedBackground : undefined}
                    />
                </View>

                <View style={{ marginBottom: 16 }}>
                    <Text style={{fontSize: 16, fontWeight: "bold", color: theme.text}}>App Theme</Text>
                    <Text style={{fontSize: 12, color: theme.subtitle, marginTop: 4}}>Choose the theme that the app uses.</Text>
                    <SegmentedControl
                        values={['System', 'Light', 'Dark']}
                        selectedIndex={themeSetting}
                        style={{ marginTop: 8 }}
                        onChange={setAppThemeValue}
                        backgroundColor={Platform.OS == "android" ? theme.androidSegmentedBackground : undefined}
                    />
                </View>
            </BottomSheetScrollView>
        </BottomSheetModal>

    )
}

export default memo(Settings);