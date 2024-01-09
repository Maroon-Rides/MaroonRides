import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { BottomSheetModal, BottomSheetView, BottomSheetFlatList } from "@gorhom/bottom-sheet";
import Ionicons from '@expo/vector-icons/Ionicons';

import useAppStore from "../../stores/useAppStore";
import SheetHeader from "../ui/SheetHeader";
import { IMapServiceInterruption } from "utils/interfaces";

interface SheetProps {
    sheetRef: React.RefObject<BottomSheetModal>
}

// AlertList (for all routes and current route)
const AlertList: React.FC<SheetProps> = ({ sheetRef }) => {
    const snapPoints = ['25%', '45%', '85%'];

    const alerts = useAppStore((state) => state.mapServiceInterruption);
    const selectedRoute = useAppStore((state) => state.selectedRoute);

    const [shownAlerts, setShownAlerts] = useState<IMapServiceInterruption[]>([]);

    // If no route is selected, we're looking at all routes, therefore show all alerts
    // If a route is selected, only show the alerts for that route
    useEffect(() => {
        if (!selectedRoute) {
            setShownAlerts(alerts);

            return;
        }

        const alertKeys = selectedRoute.directionList.flatMap(direction => direction.serviceInterruptionKeys);
        const filteredAlerts = alerts.filter(alert => alertKeys.includes(Number(alert.key)));

        setShownAlerts(filteredAlerts);
    }, [selectedRoute, alerts]);

    return (
        <BottomSheetModal ref={sheetRef} snapPoints={snapPoints} >
            <BottomSheetView>
                {/* header */}
                <SheetHeader
                    title="Alerts"
                    subtitle={selectedRoute ? selectedRoute.name : "All Routes"}
                    icon={
                        <TouchableOpacity style={{ marginLeft: 10 }} onPress={() => sheetRef.current?.dismiss()}>
                            <Ionicons name="close-circle" size={28} color="grey" />
                        </TouchableOpacity>
                    }
                />

                <View style={{ height: 1, backgroundColor: "#eaeaea", marginTop: 8 }} />

                {shownAlerts.length === 0 &&
                    <View style={{ alignItems: 'center', paddingTop: 16 }}>
                        <Text>There are no active alerts at this time.</Text>
                    </View>
                }
            </BottomSheetView>


            <BottomSheetFlatList
                data={shownAlerts}
                keyExtractor={alert => alert.name}
                style={{ height: "100%", marginLeft: 16, paddingTop: 8 }}
                contentContainerStyle={{ paddingBottom: 35, paddingRight: 16 }}
                renderItem={({ item: alert }) => {
                    return (
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginVertical: 4,
                            backgroundColor: "#eaeaea",
                            padding: 8,
                            borderRadius: 8,
                        }}>
                            <Ionicons name="alert-circle" size={32} color="red" style={{ marginRight: 8 }} />
                            <Text style={{ flex: 1 }}>{alert.name}</Text>
                        </View>

                    )
                }}
            />
        </BottomSheetModal>

    )
}

export default AlertList;