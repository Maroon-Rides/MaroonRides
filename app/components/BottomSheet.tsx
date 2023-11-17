import React, { useEffect, useRef, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, FlatList } from "react-native";
import { RouteGroup, getRoutesByGroup, getTimetable } from "aggie-spirit-api"

import Ionicons from '@expo/vector-icons/Ionicons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Timetable from "./Timetable";
import BusIcon from "./BusIcon";
import { IBusRoute, ITimetable } from "utils/interfaces";


interface Props {
    setDrawnRoutes: React.Dispatch<React.SetStateAction<IBusRoute[]>>
}

const Index: React.FC<Props> = ({ setDrawnRoutes }) => {
    const sheetRef = useRef<BottomSheet>(null);

    const snapPoints = ['16%', '35%', '80%'];

    const [groups, setGroups] = useState(null);
    const [isGameday, setIsGameday] = useState(false);

    const [selectedGroup, setSelectedGroup] = useState<IBusRoute[] | null>()
    const [selectedIndex, setSelectedIndex] = useState(0)

    const [selectedRoute, setSelectedRoute] = useState<IBusRoute | null>(null);

    const [busTimetable, setBusTimetable] = useState<ITimetable | null>();

    const [_, setCurrentSnapPointIndex] = useState(0);

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

    const fetchAndCacheRoutesData = async () => {
        try {
            // Fetch routes data for specified groups
            const data = await getRoutesByGroup([RouteGroup.ON_CAMPUS, RouteGroup.OFF_CAMPUS]);

            // Cache the fetched data in AsyncStorage
            await AsyncStorage.setItem("routeCache", JSON.stringify(data));

            // Store the current date as the cache date
            await AsyncStorage.setItem("cacheDate", new Date().toLocaleDateString());

            // Return the fetched data
            return data;
        } catch (error) {
            // Handle errors, e.g., log or display an error message
            console.error("Error downloading data:", error);
            // Optionally, you can rethrow the error if needed
            throw error;
        }
    };


    useEffect(() => {
        (async () => {
            let data: any;

            const cacheDate = await AsyncStorage.getItem("cacheDate");
            const todayDateString = new Date().toLocaleDateString();

            if (cacheDate !== todayDateString) {
                data = await fetchAndCacheRoutesData().catch(async (downloadError) => {
                    console.error("Error downloading data for cache: ", downloadError);

                    await AsyncStorage.getItem("routeCache").then((res) => {
                        if (res) {
                            data = JSON.parse(res);
                        }
                    });
                });
            } else {
                console.log("Using cached data");

                const routeCache = await AsyncStorage.getItem("routeCache");
                data = routeCache ? JSON.parse(routeCache) : await fetchAndCacheRoutesData();
            }

            // Update names for segmented control and descriptions
            function updateRouteData(categoryKey: "On Campus" | "Off Campus" | "Gameday", originalKey: string) {
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
            setGroups(data)
        })()
    }, []);

    return (
        <BottomSheet ref={sheetRef} snapPoints={snapPoints} onChange={(index) => setCurrentSnapPointIndex(index)}>
            {/* Detail View */}
            {selectedRoute ? (
                <BottomSheetView style={{ display: 'flex', flex: 1, paddingHorizontal: 16, paddingTop: 4 }}>
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
                                sheetRef.current?.snapToIndex(1)
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

                </BottomSheetView>
            ) :

                // List View
                (
                    <BottomSheetView style={{ display: 'flex', flex: 1, paddingHorizontal: 16 }} >
                        {!groups ? (
                            <ActivityIndicator />
                        ) : (
                            <View style={{ height: "100%" }}>
                                <SegmentedControl values={isGameday ? ["On Campus", "Off Campus", "Gameday"] : ["On Campus", "Off Campus"]} selectedIndex={selectedIndex}
                                    onValueChange={(value) => {
                                        setSelectedGroup(groups[value])
                                        setDrawnRoutes(groups[value])
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
                                                    sheetRef.current?.snapToIndex(0)
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
                    </BottomSheetView>
                )}
        </BottomSheet>
    );
};
export default Index;

