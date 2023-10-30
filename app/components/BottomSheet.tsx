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

                setSelectedGroup(data["On Campus"])
                setDrawnRoutes(data["On Campus"])

            } else if (data.Gameday) {
                data["Gameday"].forEach((route) => {
                    route.category = "Gameday"

                    route.name = route.name.replace("Gameday ", "")
                    route.endpointName = route.routeInfo.patternPaths[0].patternPoints[0].name + " | " + route.routeInfo.patternPaths[1].patternPoints[0].name
                    // delete the duplicate route
                    route.routeInfo.patternPaths = [route.routeInfo.patternPaths[0]]
                })


                setSelectedGroup(data["Gameday"])
                setDrawnRoutes(data["Gameday"])
            }
            
            setSelectedIndex(0)
            setGroups(data)
        })();
    }, []);

    return (
        <BottomSheet ref={sheetRef} snapPoints={snapPoints}>
            {/* Detail View */}
            { selectedRoute ? (
            <StyledBottomSheetView className="flex flex-1 px-4 pt-1">
                <View className="flex-row align-center" >
                    <View className="w-14 h-12 rounded-lg mr-3 content-center justify-center" style={{backgroundColor: "#" + selectedRoute.routeInfo.color}}>
                        <Text 
                            adjustsFontSizeToFit={true} 
                            numberOfLines={1}
                            className="text-center font-bold text-white p-1"
                            style={{fontSize: 24}} // this must be used, nativewind is broken :(
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
                            <Timetable timetable={busTimetable} />
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
                                    <View className="w-12 h-10 rounded-lg mr-4 content-center justify-center" style={{backgroundColor: "#" + busRoute.routeInfo.color}}>
                                        <Text 
                                            adjustsFontSizeToFit={true} 
                                            numberOfLines={1}
                                            className="text-center font-bold text-white p-1"
                                            style={{fontSize: 16}} // this must be used, nativewind is broken :(
                                        >
                                            {busRoute.shortName}
                                        </Text>
                                    </View>
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

