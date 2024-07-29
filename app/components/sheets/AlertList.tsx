import React, { memo, useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { BottomSheetModal, BottomSheetView, BottomSheetFlatList } from "@gorhom/bottom-sheet";
import Ionicons from '@expo/vector-icons/Ionicons';

import useAppStore from "../../data/app_state";
import SheetHeader from "../ui/SheetHeader";
import { IMapServiceInterruption } from "utils/interfaces";
import { useRoutes, useServiceInterruptions } from "app/data/api_query";

interface SheetProps {
    sheetRef: React.RefObject<BottomSheetModal>
}

// AlertList (for all routes and current route)
const AlertList: React.FC<SheetProps> = ({ sheetRef }) => {

    const snapPoints = ['25%', '45%', '85%'];

    const theme = useAppStore((state) => state.theme);
    const selectedRoute = useAppStore((state) => state.selectedRoute);
    const presentSheet = useAppStore((state) => state.presentSheet);
    const setSelectedAlert = useAppStore((state) => state.setSelectedAlert);
    const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);
    const [shownAlerts, setShownAlerts] = useState<IMapServiceInterruption[]>([]);

    const { data: routes } = useRoutes();
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
            onAnimate={(_, to) => {
                if (!selectedRoute && to == 1) {        
                    const affectedRoutes = routes?.filter(route => route.directionList.flatMap(direction => direction.serviceInterruptionKeys).length > 0)
                    setDrawnRoutes(affectedRoutes ?? [])
        
                    return;
                }
            }}
        >
            <BottomSheetView>
                {/* header */}
                <SheetHeader
                    title="Alerts"
                    subtitle={selectedRoute ? selectedRoute.name : "All Routes"}
                    icon={
                        <TouchableOpacity style={{ marginLeft: 10 }} onPress={() => sheetRef.current?.dismiss()}>
                            <Ionicons name="close-circle" size={28} color={theme.exitButton} />
                        </TouchableOpacity>
                    }
                />

                <View style={{ height: 1, backgroundColor: theme.divider, marginTop: 8 }} />

                {isError ?
                    <View style={{ alignItems: 'center', paddingTop: 16 }}>
                        <Text style={{color: theme.subtitle}}>Error loading alerts. Please try again later.</Text>
                    </View>
                : (shownAlerts.length === 0 &&
                    <View style={{ alignItems: 'center', paddingTop: 16 }}>
                        <Text style={{color: theme.subtitle }}>There are no active alerts at this time.</Text>
                    </View>)
                }

            </BottomSheetView>


            <BottomSheetFlatList
                data={shownAlerts.filter((obj, index, self) => self.findIndex(o => o.name === obj.name) === index)}
                keyExtractor={alert => alert.key}
                style={{ height: "100%", marginLeft: 16, paddingTop: 8 }}
                contentContainerStyle={{ paddingBottom: 35, paddingRight: 16 }}
                renderItem={({ item: alert }) => {
                    return (
                        <TouchableOpacity
                            onPress={() => {
                                displayDetailAlert(alert);
                            }}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginVertical: 4,
                                backgroundColor: theme.secondaryBackground,
                                padding: 8,
                                borderRadius: 8,
                            }}
                        >
                            <Ionicons name="warning" size={32} color={theme.alertSymbol} style={{ marginRight: 8 }} />
                            <Text style={{ flex: 1, color: theme.text }}>{alert.name}</Text>
                            <Ionicons name="chevron-forward" size={24} color="grey" />
                        </TouchableOpacity>
                    );
                }}
            />
        </BottomSheetModal>

    )
}

export default memo(AlertList);