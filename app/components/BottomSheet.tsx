import React, { useEffect, useRef, useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import {RouteGroup, getRoutesByGroup, getTimetable} from "aggie-spirit-api"
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { styled } from "nativewind";
import { TouchableOpacity } from "react-native-gesture-handler";
import Timetable from "./Timetable";
import BusIcon from "./BusIcon";

const StyledBottomSheetView = styled(BottomSheetView);
  
function Index({ setDrawnRoutes }) {

    const sheetRef = useRef<BottomSheet>(null);

    const snapPoints = [ '35%', 110, '80%'];

    const [groups, setGroups] = useState()
    const [selectedGroup, setSelectedGroup] = useState()
    const [selectedIndex, setSelectedIndex] = useState(0)

    const [selectedRoute, setSelectedRoute] = useState()

    const [busTimetable, setBusTimetable] = useState<any[]>()

    useEffect(() => {
        if (selectedRoute) {
            (async () => {
                var data = await getTimetable(selectedRoute.shortName)
                setBusTimetable(data)
            })()
        } else {
            setBusTimetable(null) // clear out old data so we show a loading indicator for next selection
        }
    }, [selectedRoute])

    // download data
    useEffect(() => {
        (async () => {
            console.log("Refresh data")
            let data = await AsyncStorage.getItem("routeCache").then((routeCache) => routeCache ? JSON.parse(routeCache) : null);
            
            if (data == null) {
                data = await getRoutesByGroup([RouteGroup.ON_CAMPUS, RouteGroup.OFF_CAMPUS])
                await AsyncStorage.setItem("routeCache", JSON.stringify(data));
            }

            // set the correct names to be used with the segmented control and descriptions
            data["On Campus"] = data.OnCampus
            delete data.OnCampus
            data["On Campus"].forEach((route) => {
                route.category = "On Campus"
                route.endpointName = route.routeInfo.patternPaths[0].patternPoints[0].name + " | " + route.routeInfo.patternPaths[1].patternPoints[0].name
            })

            // set the correct names to be used with the segmented control and descriptions
            data["Off Campus"] = data.OffCampus
            delete data.OffCampus
            data["Off Campus"].forEach((route) => {
                route.category = "Off Campus"
                route.endpointName = route.routeInfo.patternPaths[0].patternPoints[0].name + " | " + route.routeInfo.patternPaths[1].patternPoints[0].name
            })

            // Gameday
            // set the correct names to be used with the segmented control and descriptions
            if (data.Gameday && data.Gameday.length == 0) {
                delete data.Gameday

                setSelectedIndex(0)

            } else if (data.Gameday) {
                data["Gameday"].forEach((route) => {
                    route.category = "Gameday"

                    route.name = route.name.replace("Gameday ", "")
                    route.endpointName = route.routeInfo.patternPaths[0].patternPoints[0].name + " | " + route.routeInfo.patternPaths[1].patternPoints[0].name
                    // delete the duplicate route
                    route.routeInfo.patternPaths = [route.routeInfo.patternPaths[0]]
                })
                setSelectedIndex(1)
            }

            setSelectedGroup(data["On Campus"])
            setDrawnRoutes(data["On Campus"])
            setGroups(data)
        })();
    }, []);

    return (
        <BottomSheet ref={sheetRef} snapPoints={snapPoints}>
            {/* Detail View */}
            { selectedRoute ? (
            <StyledBottomSheetView className="flex flex-1 px-4 pt-1">
                <View className="flex-row align-center" >
                    <BusIcon 
                        sizing="w-16 h-12" 
                        textSize={24} 
                        busRoute={selectedRoute} 
                        name={selectedRoute.shortName} 
                        color={selectedRoute.routeInfo.color}
                    />
                    <View>
                        <Text className="font-bold text-2xl">{selectedRoute.name}</Text>
                        <Text>{selectedRoute.category}</Text>
                    </View>
                    
                    {/* Spacer */}
                    <View className="flex-1" />
                    <TouchableOpacity 
                        className="content-center justify-center"
                    onPress={() => { 
                        setDrawnRoutes(selectedGroup)
                        sheetRef.current?.snapToIndex(0)
                        setSelectedRoute(undefined)
                    }}>

                        <Ionicons name="close-circle" size={32} color="grey" />
                    </TouchableOpacity>
                </View>

                {/* Timetable View */}
                <View className="mt-4">
                    { busTimetable ? (
                        ( busTimetable.length != 0 ? (
                            <Timetable timetable={busTimetable} tintColor={"#" + selectedRoute.routeInfo.color} />
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
                { groups == undefined ? (
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
                    <FlatList
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
                                    }}
                                >
                                    <BusIcon 
                                        sizing="w-12 h-10" 
                                        busRoute={busRoute} 
                                        textSize={18} 
                                        name={busRoute.shortName} 
                                        color={busRoute.routeInfo.color}
                                    />
                                    <View>
                                        <Text className="font-bold text-xl">{busRoute.name}</Text>
                                        <Text>
                                            {busRoute.endpointName}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )
                        }}                        
                    />
                    </View>
                )}
            </StyledBottomSheetView>
            )}
        </BottomSheet>
    );
};
export default Index;

