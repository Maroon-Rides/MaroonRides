import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';
import useAppStore from "../stores/useAppStore";
import BusIcon from "./BusIcon";

// TODO: Fill in route details with new UI
const RouteDetails: React.FC = () => {
    const clearSelectedRoute = useAppStore((state) => state.clearSelectedRoute);
    const setSheetView = useAppStore((state) => state.setSheetView);

    const selectedRoute = useAppStore((state) => state.selectedRoute);

    const handleClearSelectedRoute = () => {
        clearSelectedRoute();
        setSheetView("routeList");
    }


    return (
        <View>
            <View style={{ flexDirection: "row", alignItems: 'center', marginBottom: 8 }}>
                <BusIcon name={selectedRoute!.shortName} color={selectedRoute!.directionList[0]!.lineColor} style={{marginRight: 8}}/>
                <Text style={{ fontWeight: 'bold', fontSize: 32 }}>{selectedRoute!.name}</Text>

                <View style={{ flex: 1 }} />

                <TouchableOpacity style={{ alignContent: 'center', justifyContent: 'flex-end' }} onPress={handleClearSelectedRoute}>
                    <Ionicons name="close-circle" size={32} color="grey" />
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default RouteDetails;