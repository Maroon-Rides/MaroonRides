import React, { useState, useEffect } from "react";
import { ActivityIndicator, View, TouchableOpacity, FlatList, Text } from "react-native";
import SegmentedControl from '@react-native-segmented-control/segmented-control';

import BusIcon from "./BusIcon";

import { IRouteCategory, IBusRoute } from "utils/interfaces";
import useAppStore from "../stores/useAppStore";

const RoutesList: React.FC = () => {
    const routes = useAppStore((state) => state.routes);
    
    const setBusRoutes = useAppStore((state) => state.setBusRoutes);

    const selectedRouteCategory = useAppStore((state) => state.selectedRouteCategory);
    const setSelectedRouteCategory = useAppStore((state) => state.setSelectedRouteCategory);

    const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);

    const setSelectedGroup = useAppStore((state) => state.setSelectedGroup);

    const [selectedIndex, setSelectedIndex] = useState(0);

    const setIsGameday = useAppStore((state) => state.setIsGameday);

    const handleSelectedRouteCategorySwitch = (newRouteCategory: string) => {
        setSelectedRouteCategory(newRouteCategory as unknown as "On Campus" | "Off Campus");

        if(newRouteCategory === "On Campus") {
            setDrawnRoutes(routes.filter(route => route.category === "On Campus"));
        } else if(newRouteCategory === "Off Campus") {
            setDrawnRoutes(routes.filter(route => route.category === "Off Campus"));
        }
    }

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
            <View style={{ height: "100%" }}>
                    <SegmentedControl values={["On Campus", "Off Campus"]} selectedIndex={selectedIndex} onValueChange={handleSelectedRouteCategorySwitch} />
                    { !routes[0] ? <ActivityIndicator style={{ marginTop: 5 }} /> : (
                        <FlatList
                        contentContainerStyle={{ paddingBottom: 30 }}
                        data={routes.filter(route => route.category === selectedRouteCategory)}
                        keyExtractor={route => route.key}
                        renderItem={({ item: route }) => {
                            return (
                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }} >
                                    <BusIcon name={route.shortName} color={route.directionList[0]?.lineColor ?? "#000"} />
                                    <View>
                                        <Text style={{ fontWeight: 'bold', fontSize: 20, lineHeight: 28 }}>{route.name}</Text>
                                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                            {route.directionList.map((elm, index) => (
                                                <React.Fragment key={index}>
                                                    <Text style={{ marginRight: 5 }}>{elm.destination}</Text>
                                                    {index !== route.directionList.length - 1 && <Text style={{ marginLeft: 1, marginRight: 2 }}>|</Text>}
                                                </React.Fragment>
                                            ))}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )
                        }}
                    />
                    ) }
                </View>
        </>
    )
}

export default RoutesList