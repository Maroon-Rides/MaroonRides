import React, { memo, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert, NativeSyntheticEvent } from "react-native";
import { BottomSheetModal, BottomSheetView, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import Ionicons from '@expo/vector-icons/Ionicons';
import SheetHeader from "../ui/SheetHeader";
import SegmentedControl, { NativeSegmentedControlIOSChangeEvent } from "@react-native-segmented-control/segmented-control";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAppStore from "../../stores/useAppStore";

interface SheetProps {
    sheetRef: React.RefObject<BottomSheetModal>
}

// Settings (for all routes and current route)
const Settings: React.FC<SheetProps> = ({ sheetRef }) => {
    const snapPoints = ['25%', '45%', '85%'];

    const [defaultGroup, setDefaultGroup] = useState(0);
    const [themeSetting, setTheme] = useState(0);
    const theme = useAppStore((state) => state.theme);

    useEffect(() => {
        try {
            AsyncStorage.getItem('default-group').then((defaultGroup: string | null) => {
                if (!defaultGroup) return;    
                setDefaultGroup(Number(defaultGroup));
            })

            AsyncStorage.getItem('app-theme').then((theme: string | null) => {
                if (!theme) return;
                setTheme(Number(theme));
            })
        } catch(error) {
            console.error(error);
            Alert.alert("Something Went Wrong", "Please try again later")
            return;
        }
    }, [])

    function setDefaultGroupValue(evt: NativeSyntheticEvent<NativeSegmentedControlIOSChangeEvent>) {
        setDefaultGroup(evt.nativeEvent.selectedSegmentIndex);
        AsyncStorage.setItem('default-group', evt.nativeEvent.selectedSegmentIndex.toString());
    }

    function setAppThemeValue(evt: NativeSyntheticEvent<NativeSegmentedControlIOSChangeEvent>) {
        setTheme(evt.nativeEvent.selectedSegmentIndex);
        AsyncStorage.setItem('app-theme', evt.nativeEvent.selectedSegmentIndex.toString());

        // show alert to restart app
        Alert.alert("Restart App", "Please restart the app to see the changes.");
    }



    return (
        <BottomSheetModal 
            ref={sheetRef} 
            snapPoints={snapPoints} 
            index={1} 
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
                    />
                </View>
            </BottomSheetScrollView>
        </BottomSheetModal>

    )
}

export default memo(Settings);