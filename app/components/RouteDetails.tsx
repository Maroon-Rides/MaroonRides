import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';
import { getTimetable } from "aggie-spirit-api"

import Timetable from "./Timetable";

import useAppStore from "../stores/useAppStore";
import { ITimetable } from "utils/interfaces";

const RouteDetails: React.FC = () => {
    const selectedRoute = useAppStore((state) => state.selectedRoute);
    const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);
    const setSelectedRoute = useAppStore((state) => state.setSelectedRoute);

    const selectedGroup = useAppStore((state) => state.selectedGroup);

    const [busTimetable, setBusTimetable] = useState<ITimetable | null>();

    useEffect(() => {
        // Check if a route is selected
        if (selectedRoute) {
            // Fetch timetable data asynchronously
            (async () => {
                try {
                    // Retrieve timetable data for the selected route
                    const data = await getTimetable(selectedRoute.shortName);

                    // Update the state with the fetched timetable data
                    setBusTimetable(data);
                } catch (error) {
                    // Handle errors, e.g., log or display an error message
                    console.error("Error fetching timetable:", error);
                }
            })();
        } else {
            // No route selected, clear out old data to show a loading indicator for the next selection
            setBusTimetable(null);
        }
    }, [selectedRoute]);


    return (
        selectedRoute && (<>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 56, height: 48, borderRadius: 8, marginRight: 12, alignContent: 'center', justifyContent: 'center', backgroundColor: "#" + selectedRoute.routeInfo.color }}>
                    <Text adjustsFontSizeToFit={true} numberOfLines={1} style={{ fontSize: 24, textAlign: 'center', fontWeight: 'bold', color: 'white', padding: 4 }} >
                        {selectedRoute.shortName}
                    </Text>
                </View>
                <View>
                    <Text style={{ fontWeight: 'bold', fontSize: 24, lineHeight: 32 }} >{selectedRoute.name}</Text>
                    <Text>{selectedRoute.category}</Text>
                </View>

                {/* Spacer */}
                <View style={{ flex: 1 }} />

                <TouchableOpacity style={{ alignContent: 'center', justifyContent: 'flex-end' }}
                    onPress={() => {
                        setDrawnRoutes(selectedGroup!)
                        setSelectedRoute(null)
                    }}>
                    <Ionicons name="close-circle" size={32} color="grey" />
                </TouchableOpacity>
            </View>

            {/* Timetable View */}
            <View style={{ marginTop: 16 }}>
                {busTimetable ? (
                    (busTimetable.length != 0 ? (<Timetable timetable={busTimetable} highlightColor={"#" + selectedRoute.routeInfo.color} />) : (<Text style={{ textAlign: 'center' }} >No Timetable Available</Text>))
                ) : (
                    <ActivityIndicator></ActivityIndicator>
                )}
            </View>
            </>)
    )
}

export default RouteDetails;