import React, { useState, useEffect } from "react";
import { ActivityIndicator, View, TouchableOpacity, FlatList, Text } from "react-native";
import SegmentedControl from '@react-native-segmented-control/segmented-control';

import BusIcon from "./BusIcon";

import { IRouteCategory, IBusRoute } from "utils/interfaces";
import useAppStore, { fetchBusData } from "../stores/useAppStore";

const RoutesList: React.FC = () => {
    const busRoutes = useAppStore((state) => state.busRoutes);
    const setBusRoutes = useAppStore((state) => state.setBusRoutes);

    const setSelectedRoute = useAppStore((state) => state.setSelectedRoute);

    const setSelectedRouteCategory = useAppStore((state) => state.setSelectedRouteCategory);

    const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);

    const selectedGroup = useAppStore((state) => state.selectedGroup);
    const setSelectedGroup = useAppStore((state) => state.setSelectedGroup);

    const [selectedIndex, setSelectedIndex] = useState(0);

    const isGameday = useAppStore((state) => state.isGameday);
    const setIsGameday = useAppStore((state) => state.setIsGameday);

    useEffect(() => {
        (async () => {
            const data = await fetchBusData();

            // Update names for segmented control and descriptions
            function updateRouteData(categoryKey: IRouteCategory, originalKey: string) {
                data[categoryKey] = data[originalKey];
                delete data[originalKey];

                data[categoryKey].forEach((route: IBusRoute) => {
                    route.category = categoryKey;
                    const firstPointName = route?.routeInfo?.patternPaths[0]?.patternPoints[0]?.name;
                    const secondPointName = route?.routeInfo?.patternPaths[1]?.patternPoints[0]?.name;
                    route.endpointName = `${firstPointName} | ${secondPointName}`;
                });
            }

            // Set correct names for "On Campus" category
            updateRouteData("On Campus", "OnCampus");

            // Set correct names for "Off Campus" category
            updateRouteData("Off Campus", "OffCampus");


            // Gameday
            // Set correct names for segmented control and descriptions
            if (data.Gameday) {
                setIsGameday(true);

                data.Gameday.forEach((route: IBusRoute) => {
                    route.category = "Gameday";

                    // Remove "Gameday" prefix from route name
                    route.name = route.name.replace("Gameday ", "");

                    // Construct endpointName using pattern points
                    const firstPointName = route?.routeInfo?.patternPaths[0]?.patternPoints[0]?.name;
                    const secondPointName = route?.routeInfo?.patternPaths[1]?.patternPoints[0]?.name;
                    route.endpointName = `${firstPointName} | ${secondPointName}`;

                    // Delete duplicate route information
                    route.routeInfo.patternPaths = [route.routeInfo.patternPaths[0]!];
                });

                setSelectedIndex(1);
            } else {
                // If no Gameday data, clean up and set default selected index
                delete data.Gameday;
                setSelectedIndex(0);
                setIsGameday(false);
            }

            setSelectedGroup(data["On Campus"])
            setDrawnRoutes(data["On Campus"])
            setBusRoutes(data)
        })()
    }, []);

    return (
        <>
            {!busRoutes ? (
                <ActivityIndicator />
            ) : (
                <View style={{ height: "100%" }}>
                    <SegmentedControl values={isGameday ? ["On Campus", "Off Campus", "Gameday"] : ["On Campus", "Off Campus"]} selectedIndex={selectedIndex}
                        onValueChange={(value) => {
                            setSelectedRouteCategory(value as unknown as IRouteCategory);

                            setSelectedGroup(busRoutes[value])
                            setDrawnRoutes(busRoutes[value])
                        }}
                        onChange={(event) => setSelectedIndex(event.nativeEvent.selectedSegmentIndex)}
                    />
                    <FlatList
                        contentContainerStyle={{ paddingBottom: 30 }}
                        data={selectedGroup}
                        keyExtractor={busRoute => busRoute.key}
                        renderItem={({ item: busRoute }) => {
                            return (
                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}
                                    onPress={() => {
                                        setDrawnRoutes([busRoute])
                                        setSelectedRoute(busRoute)
                                    }}>
                                    <BusIcon name={busRoute.shortName} color={busRoute.routeInfo.color} />
                                    <View>
                                        <Text style={{ fontWeight: 'bold', fontSize: 20, lineHeight: 28 }}>{busRoute.name}</Text>
                                        <Text> {busRoute.endpointName} </Text>
                                    </View>
                                </TouchableOpacity>
                            )
                        }}
                    />
                </View>
            )}
        </>
    )
}

export default RoutesList