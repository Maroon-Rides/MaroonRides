import React, { memo, useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { BottomSheetModal, BottomSheetView, BottomSheetFlatList } from "@gorhom/bottom-sheet";
import Ionicons from '@expo/vector-icons/Ionicons';
import useAppStore from "../../../data/app_state";
import SheetHeader from "../../ui/SheetHeader";
import { IMapServiceInterruption } from "utils/interfaces";
import { useServiceInterruptions } from "app/data/api_query";
import { TextInput } from "react-native-gesture-handler";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface SheetProps {
    sheetRef: React.RefObject<BottomSheetModal>
}

// AlertList (for all routes and current route)
const InputRoute: React.FC<SheetProps> = ({ sheetRef }) => {

    const snapPoints = ['25%', '45%', '85%'];

    const theme = useAppStore((state) => state.theme);
    const selectedRoute = useAppStore((state) => state.selectedRoute);
    const presentSheet = useAppStore((state) => state.presentSheet);
    const setSelectedAlert = useAppStore((state) => state.setSelectedAlert);
    const [shownAlerts, setShownAlerts] = useState<IMapServiceInterruption[]>([]);

    const { data: alerts, isError } = useServiceInterruptions()

    // If no route is selected, we're looking at all routes, therefore show all alerts
    // If a route is selected, only show the alerts for that route
    useEffect(() => {
        if (!alerts) {
            setShownAlerts([]);
            return
        }

        if (!selectedRoute) {
            setShownAlerts(alerts);
            return;
        }

        const alertKeys = selectedRoute.directionList.flatMap(direction => direction.serviceInterruptionKeys);
        const filteredAlerts = alerts.filter(alert => alertKeys.includes(Number(alert.key)));

        setShownAlerts(filteredAlerts);
    }, [selectedRoute, alerts]);

    const displayDetailAlert = (alert: IMapServiceInterruption) => {
        setSelectedAlert(alert);
        presentSheet("alertsDetail");
    }
    return (
        <BottomSheetModal 
            ref={sheetRef} 
            snapPoints={snapPoints} 
            index={1} 
            backgroundStyle={{backgroundColor: theme.background}}
            handleIndicatorStyle={{backgroundColor: theme.divider}}
        >
            <BottomSheetView>
                {/* header */}
                <SheetHeader
                    title="Plan a Route"
                    icon={
                        <TouchableOpacity style={{ marginLeft: 10 }} onPress={() => sheetRef.current?.dismiss()}>
                            <Ionicons name="close-circle" size={28} color={theme.exitButton} />
                        </TouchableOpacity>
                    }
                />

                <View style={{ height: 1, backgroundColor: theme.divider, marginTop: 8 }} />

                {/* Route Details Input */}

                <View style={{paddingHorizontal: 16}}>
                    {/* Endpoint Input */}
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16}}>
                        {/* Icons */}
                        <View style={{paddingRight: 8, alignItems: "center"}}>
                            <View
                                style={{
                                    backgroundColor: theme.secondaryBackground,
                                    borderRadius: 999,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: 36,
                                    width: 36,
                                    paddingVertical: 2,
                                }}
                            >
                                <Ionicons name="location" size={22} color={theme.text} />
                            </View>
                            {/* 3 dots */}
                            <View style={{marginVertical: 2}}>
                                <View style={{height: 4, width: 4, backgroundColor: theme.text, borderRadius: 999, marginVertical: 2}}></View>
                                <View style={{height: 4, width: 4, backgroundColor: theme.text, borderRadius: 999, marginVertical: 2}}></View>
                            </View>
                            
                            <View
                                style={{
                                    backgroundColor: theme.secondaryBackground,
                                    borderRadius: 999,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: 36,
                                    width: 36,
                                    paddingVertical: 2,
                                }}
                            >
                                <Ionicons name="location" size={22} color={theme.text} />
                            </View>                      
                        </View>

                        {/* Text Inputs */}
                        <View style={{flex: 1}}>
                            <TextInput
                                style={{
                                    backgroundColor: theme.secondaryBackground,
                                    color: theme.text,
                                    padding: 8,
                                    borderRadius: 8,
                                    height: 40
                                }}
                                placeholder="Start Location"
                            ></TextInput>
                            <View style={{height: 16}}></View>
                            <TextInput
                                style={{
                                    backgroundColor: theme.secondaryBackground,
                                    color: theme.text,
                                    padding: 8,
                                    borderRadius: 8,
                                    height: 40
                                }}
                                placeholder="End Location"
                            ></TextInput>
                        </View>

                        <TouchableOpacity
                            style={{
                                marginHorizontal: 8
                            
                            }}
                        >
                            <MaterialCommunityIcons name="swap-vertical" size={28} color={theme.subtitle} />
                        </TouchableOpacity>
                    </View>
                </View>

            </BottomSheetView>


            
        </BottomSheetModal>

    )
}

export default memo(InputRoute);