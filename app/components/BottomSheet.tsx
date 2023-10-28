import React, { useEffect, useRef, useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import {RouteGroup, getRoutesByGroup, getRouteBuses, getRouteByName} from "aggie-spirit-api"
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';

import { styled } from "nativewind";
import { TouchableOpacity } from "react-native-gesture-handler";

const StyledBottomSheetView = styled(BottomSheetView);
  
function Index({ setDrawnRoutes }) {
    const sheetRef = useRef<BottomSheet>(null);

    const snapPoints = [ '35%', '10%', '75%'];

    const [groups, setGroups] = useState()
    const [selectedGroup, setSelectedGroup] = useState()
    const [selectedIndex, setSelectedIndex] = useState(0)

    const [selectedRoute, setSelectedRoute] = useState()

    // download data
    useEffect(() => {
        (async () => {
            console.log("Refresh data")
            var data = JSON.parse(await AsyncStorage.getItem("routeCache") || "{}")

            if (data == null) {
                data = await getRoutesByGroup([RouteGroup.ON_CAMPUS, RouteGroup.OFF_CAMPUS])
                await AsyncStorage.setItem("routeCache", JSON.stringify(data))
            } 

            // set the correct names to be used with the segmented control
            data["On Campus"] = data.OnCampus
            delete data.OnCampus

            data["Off Campus"] = data.OffCampus
            delete data.OffCampus

            // Gameday
            if (data.Gameday && data.Gameday.length == 0) {
                delete data.Gameday
            }

            setGroups(data)
            setSelectedGroup(data["On Campus"])
            setDrawnRoutes(data["On Campus"])
        })();
    }, []);

    return (
        <BottomSheet ref={sheetRef} snapPoints={snapPoints}>
            { selectedRoute ? (
            <StyledBottomSheetView className="flex flex-1 px-4 pt-2">
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
                        <Text>sdafaf</Text>
                    </View>
                    
                    {/* Spacer */}
                    <View className="flex-1" />
                    <TouchableOpacity onPress={() => { 
                        setDrawnRoutes(selectedGroup)
                        sheetRef.current?.snapToIndex(0)
                        setSelectedRoute(undefined)
                    }}>

                        <Ionicons name="close" size={24} />
                    </TouchableOpacity>
                </View>

            </StyledBottomSheetView>
            ) : (
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
                    style={{shadowRadius: 20, shadowOpacity: 0.1, shadowColor: "black", marginBottom: 18}}
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
                                            {busRoute.routeInfo.patternPaths[0].patternPoints[0].name} | {busRoute.routeInfo.patternPaths[1].patternPoints[0].name}
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