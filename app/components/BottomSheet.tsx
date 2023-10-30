import React, { useEffect, useRef, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, Dimensions } from "react-native";
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { RouteGroup, getRoutesByGroup } from "aggie-spirit-api"
import AsyncStorage from '@react-native-async-storage/async-storage';


import { styled } from "nativewind";

const StyledBottomSheetView = styled(BottomSheetView);
  
function Index() {
    const sheetRef = useRef<BottomSheet>(null);

    const snapPoints = ['15%','35%', '80%']; 

    const [groups, setGroups] = useState()
    const [selectedGroup, setSelectedGroup] = useState()

    const [currentSnapPointIndex, setCurrentSnapPointIndex] = useState(0);
    const handleSnapChange = (index: any) => {
        setCurrentSnapPointIndex(index);
    };

    const calculateFlatListHeight = () => {
        const { width, height } = Dimensions.get('window');
        let currentPercent=snapPoints[currentSnapPointIndex];
        let snapValue=0;
        if(currentPercent != undefined){
            snapValue = parseFloat(currentPercent.replace('%', ''));
        }
        else{
            snapValue=35;
        }
        let newHeight=height*(snapValue/100)
        newHeight-=60;
        return newHeight;
    };
    // download data
    useEffect(() => {
        (async () => {
            let data = await AsyncStorage.getItem("routeCache").then((routeCache) => routeCache ? JSON.parse(routeCache) : null);
            
            if (data == null) {
                data = await getRoutesByGroup([RouteGroup.ON_CAMPUS, RouteGroup.OFF_CAMPUS])
                await AsyncStorage.setItem("routeCache", JSON.stringify(data));
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
        })();
    }, []);

    return (
        <BottomSheet ref={sheetRef} snapPoints={snapPoints} onChange={handleSnapChange}>
            <StyledBottomSheetView className="flex flex-1 px-4">
                { groups == undefined ? (
                    <ActivityIndicator />
                ) : (
                    <View>
                    <SegmentedControl
                    values={Object.keys(groups)}
                    selectedIndex={0}
                    onValueChange={(value) => {
                        setSelectedGroup(groups[value])
                    }}
                />
                    <FlatList style={{ height: calculateFlatListHeight()}}
                        data={selectedGroup}
                        keyExtractor={busRoute => busRoute.key}
                        renderItem={({ item: busRoute }) => {
                            return (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }} >
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
                                    <Text className="font-bold text-xl">{busRoute.name}</Text>
                                </View>
                            )
                        }}                        
                    />
                    </View>
                )}
            </StyledBottomSheetView>
        </BottomSheet>
    );
};

export default Index;
