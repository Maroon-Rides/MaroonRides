import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Image, TouchableOpacity } from "react-native";
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { RouteGroup, getRoutesByGroup, getTimetable } from "aggie-spirit-api"
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styled } from "nativewind";
import Timetable from "./Timetable";
import Ionicons from '@expo/vector-icons/Ionicons';
import { IBusRoute } from "utils/interfaces";

const StyledBottomSheetView = styled(BottomSheetView);

interface Props {
    setDrawnRoutes: React.Dispatch<React.SetStateAction<IBusRoute[]>>
}

const Index: React.FC<Props> = ({ setDrawnRoutes }) => {
    const sheetRef = useRef<BottomSheet>(null);

    const snapPoints = ['16%', '35%', '80%'];

    const [groups, setGroups] = useState()
    const [selectedGroup, setSelectedGroup] = useState<IBusRoute[] | null>()
    const [selectedIndex, setSelectedIndex] = useState(0)

    const [selectedRoute, setSelectedRoute] = useState<IBusRoute | null>(null);

    const [busTimetable, setBusTimetable] = useState<any[] | null>()

    useEffect(() => {
        if (selectedRoute) {
            (async () => {
                const data = await getTimetable(selectedRoute.shortName);
                setBusTimetable(data);
                (busTimetable);
            })()
        } else {
            setBusTimetable(null) // clear out old data so we show a loading indicator for next selection
        }
    }, [selectedRoute])

    const [currentSnapPointIndex, setCurrentSnapPointIndex] = useState(0);
    const handleSnapChange = (index: any) => {
        setCurrentSnapPointIndex(index);
    };

    async function downloadData() {
        const data = await getRoutesByGroup([RouteGroup.ON_CAMPUS, RouteGroup.OFF_CAMPUS])
        await AsyncStorage.setItem("routeCache", JSON.stringify(data));
        await AsyncStorage.setItem("cacheDate", new Date().toLocaleDateString());
        return data;
    }

    // download data
    useEffect(() => {
        (async () => {
            let data;
            if (await AsyncStorage.getItem("cacheDate") != new Date().toLocaleDateString()) {
                try {
                    data = downloadData()
                } catch (e) {
                    console.log("Error downloading data for cache: " + e)

                    if (await AsyncStorage.getItem("routeCache")) {
                        console.log("Using cached data from last successful download")
                        data = await AsyncStorage.getItem("routeCache").then((routeCache) => routeCache ? JSON.parse(routeCache) : null);
                    } else {
                        console.log("No cached data available")
                    }
                }
            } else {
                console.log("Using cached data")
                data = await AsyncStorage.getItem("routeCache").then((routeCache) => routeCache ? JSON.parse(routeCache) : null);
                if (data == null) { // if for some reason the cache is empty but the date is today, redownload
                    try {
                        data = downloadData()
                    } catch (e) {
                        console.log("Error downloading data for cache: " + e)
                    }
                }
            }
            

            // set the correct names to be used with the segmented control and descriptions
            data["On Campus"] = data.OnCampus
            delete data.OnCampus
            data["On Campus"].forEach((route: IBusRoute) => {
                route.category = "On Campus"
                route.endpointName = route?.routeInfo?.patternPaths[0]?.patternPoints[0]?.name + " | " + route?.routeInfo?.patternPaths[1]?.patternPoints[0]?.name
            })

            // set the correct names to be used with the segmented control and descriptions
            data["Off Campus"] = data.OffCampus
            delete data.OffCampus
            data["Off Campus"].forEach((route: IBusRoute) => {
                route.category = "Off Campus"
                route.endpointName = route?.routeInfo?.patternPaths[0]?.patternPoints[0]?.name + " | " + route?.routeInfo?.patternPaths[1]?.patternPoints[0]?.name
            })

            // Gameday
            // set the correct names to be used with the segmented control and descriptions
            if (data.Gameday && data.Gameday.length == 0) {
                delete data.Gameday

                setSelectedIndex(0)

            } else if (data.Gameday) {
                data["Gameday"].forEach((route: IBusRoute) => {
                    route.category = "Gameday"

                    route.name = route.name.replace("Gameday ", "")
                    route.endpointName = route?.routeInfo?.patternPaths[0]?.patternPoints[0]?.name + " | " + route?.routeInfo?.patternPaths[1]?.patternPoints[0]?.name
                    // delete the duplicate route
                    route.routeInfo.patternPaths = [route.routeInfo.patternPaths[0]!]
                })
                setSelectedIndex(1)
            }

            setSelectedGroup(data["On Campus"])
            setDrawnRoutes(data["On Campus"])
            setGroups(data)
        })();
    }, []);

    return (
        <BottomSheet ref={sheetRef} snapPoints={snapPoints} onChange={handleSnapChange}>
            {/* Detail View */}
            {selectedRoute ? (
                <StyledBottomSheetView className="flex flex-1 px-4 pt-1">
                    <View className="flex-row align-center" >
                        <View className={`w-14 h-12 rounded-lg mr-3 content-center justify-center`} style={{ backgroundColor: "#" + selectedRoute.routeInfo.color }}>
                            <Text
                                adjustsFontSizeToFit={true}
                                numberOfLines={1}
                                className="text-center font-bold text-white p-1"
                                style={{ fontSize: 24 }} // this must be used, nativewind is broken :(
                            >
                                {selectedRoute.shortName}
                            </Text>
                        </View>
                        <View>
                            <Text className="font-bold text-2xl">{selectedRoute.name}</Text>
                            <Text>{selectedRoute.category}</Text>
                        </View>

                        {/* Spacer */}
                        <View className="flex-1" />

                        <TouchableOpacity 
                            className="content-center justify-right"
                            onPress={() => {
                                setDrawnRoutes(selectedGroup!)
                                sheetRef.current?.snapToIndex(1)
                                setSelectedRoute(null)
                            }}>
                            <Ionicons
                                name="close-circle"
                                size={32}
                                color="grey" />
                        </TouchableOpacity>

                    </View>

                    {/* Timetable View */}
                    <View className="mt-4">
                        {busTimetable ? (
                            (busTimetable.length != 0 ? (
                                <Timetable timetable={busTimetable} highlightColor={"#" + selectedRoute.routeInfo.color} />
                            ) : (
                                <Text className="text-center">No Timetable Available</Text>
                            ))
                        ) : (
                            <ActivityIndicator></ActivityIndicator>
                        )}
                    </View>

                </StyledBottomSheetView>
            ) :

                // List View
                (
                    <StyledBottomSheetView className="flex flex-1 px-4">
                        {groups == undefined ? (
                            <ActivityIndicator />
                        ) : (
                            <View>
                                <SegmentedControl
                                    values={Object.keys(groups)}
                                    selectedIndex={selectedIndex}
                                    onValueChange={(value) => {
                                        setSelectedGroup(groups[value])
                                        setDrawnRoutes(groups[value])
                                    }}
                                    onChange={(event) => setSelectedIndex(event.nativeEvent.selectedSegmentIndex)}

                                />
                                <ScrollView>
                                    {selectedGroup!.map((busRoute) => (
                                        <TouchableOpacity
                                            key={busRoute.key} // Use a unique key for each item
                                            className="flex flex-row align-center my-2"
                                            onPress={() => {
                                                setDrawnRoutes([busRoute]);
                                                sheetRef.current?.snapToIndex(1);
                                                setSelectedRoute(busRoute);
                                            }}
                                        >
                                            <View
                                                className="w-12 h-10 rounded-lg mr-4 content-center justify-center"
                                                style={{ backgroundColor: "#" + busRoute.routeInfo.color }}
                                            >
                                                <Text
                                                    adjustsFontSizeToFit={true}
                                                    numberOfLines={1}
                                                    className="text-center font-bold text-white p-1"
                                                    style={{ fontSize: 16 }} // this must be used, nativewind is broken :(
                                                >
                                                    {busRoute.shortName}
                                                </Text>
                                            </View>
                                            <View>
                                                <Text className="font-bold text-xl">{busRoute.name}</Text>
                                                <Text>{busRoute.endpointName}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                            </View>
                        )}
                    </StyledBottomSheetView>
                )}
        </BottomSheet>
    );
};
export default Index;

