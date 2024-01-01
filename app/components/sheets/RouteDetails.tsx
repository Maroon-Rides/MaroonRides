import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {Ionicons, FontAwesome} from '@expo/vector-icons';
import useAppStore from "../../stores/useAppStore";
import BusIcon from "../ui/BusIcon";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { FlatList } from "react-native-gesture-handler";
import TimeBubble from "../ui/TimeBubble";
import FavoritePill from "../ui/FavoritePill";

// TODO: Fill in route details with new UI
const RouteDetails: React.FC = () => {
    const clearSelectedRoute = useAppStore((state) => state.clearSelectedRoute);
    const setSheetView = useAppStore((state) => state.setSheetView);

    const selectedRoute = useAppStore((state) => state.selectedRoute);

    const [selectedDirection, setSelectedDirection] = useState(0);

    const [processedStops, setProcessedStops] = useState<any[]>([]);

    const handleClearSelectedRoute = () => {
        clearSelectedRoute();
        setSheetView("routeList");
    }

    useEffect(() => {
        if (!selectedRoute) return;

        const processedStops: any[] = [];

        const directionPath = selectedRoute.patternPaths[selectedDirection]?.patternPoints ?? [];

        for (const point of directionPath) {
            if (!point.stop) continue;

            processedStops.push(point.stop);
        }

        // TODO: process active buses and insert into proper locations


        setProcessedStops(processedStops);
    }, [selectedRoute, selectedDirection])

    return (
        <View>
            <View style={{ flexDirection: "row", alignItems: 'center', marginBottom: 8, marginHorizontal: 16 }}>
                <BusIcon name={selectedRoute!.shortName} color={selectedRoute!.directionList[0]!.lineColor} style={{marginRight: 16}}/>
                <Text style={{ fontWeight: 'bold', fontSize: 28, flex: 1}}>{selectedRoute!.name}</Text>

                <TouchableOpacity style={{ alignContent: 'center', justifyContent: 'flex-end' }} onPress={handleClearSelectedRoute}>
                    <Ionicons name="close-circle" size={32} color="grey" />
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", alignItems: 'center', marginBottom: 8, marginLeft: 16 }}>
                <FavoritePill routeId={selectedRoute!.key} />
            </View>


            <SegmentedControl
                style={{ marginHorizontal: 16 }}
                values={selectedRoute?.directionList.map(direction => direction.destination) ?? []}
                selectedIndex={selectedDirection}
                onChange={(event) => {
                    setSelectedDirection(event.nativeEvent.selectedSegmentIndex);
                }}
            />


            <FlatList
                data={processedStops}
                style={{paddingTop: 8, height: "100%", marginLeft: 16}}
                contentContainerStyle={{ paddingBottom: 120 }}
                renderItem={({item: stop}) => {
                    return (
                        <View style={{marginTop: 4}}>
                            <Text style={{fontSize: 22, fontWeight: "bold"}}>{stop.name}</Text>
                            <Text style={{marginBottom: 8}}>Running 10 minutes late</Text>
                            <TimeBubble time="12:50" color={selectedRoute!.directionList[0]!.lineColor} />
                            
                            {/* Line seperator */}
                            <View style={{height: 1, backgroundColor: "#eaeaea", marginTop: 8}} />
                        </View>
                    )
                }}
            />
        </View>
    )
}

export default RouteDetails;