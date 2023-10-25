import React, { useEffect, useRef, useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { RouteGroup, getRoutesByGroup } from "aggie-spirit-api"

import { styled } from "nativewind";

const StyledBottomSheetView = styled(BottomSheetView);
  
function Index() {
    const sheetRef = useRef<BottomSheet>(null);

    const snapPoints = ['35%'];

    const [groups, setGroups] = useState()
    const [groupNames, setGroupNames] = useState();
    const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);


    // download data
    useEffect(() => {
        (async () => {
            console.log("Refresh data")
            var d = await getRoutesByGroup(RouteGroup.ON_CAMPUS)
            console.log(d)

            var g = {}

            // OnCampus
            if (d.OnCampus && d.OnCampus.length > 0) {
                g["On Campus"] = d.OnCampus
            } 

            // OnCampus
            if (d.OffCampus && d.OffCampus.length > 0) {
                g["Off Campus"] = d.OffCampus
            } 
            // Gameday
            if (d.Gameday && d.Gameday.length > 0) {
                g["Gameday"] = d.Gameday
            } 

            setGroups(Object.values(g))
            setGroupNames(Object.keys(g))            
        })();
    }, []);

    return (
        <BottomSheet ref={sheetRef} snapPoints={snapPoints}>
            <StyledBottomSheetView className="flex flex-1 px-4">
                { groups == undefined ? (
                    <ActivityIndicator />
                ) : (
                    <View>
                    <SegmentedControl
                    values={groupNames}
                    selectedIndex={selectedGroupIndex}
                    onChange={(event) => {
                        setSelectedGroupIndex(event.nativeEvent.selectedSegmentIndex)
                    }}
                />
                    <FlatList
                        data={groups[selectedGroupIndex]}
                        renderItem={({ item: busRoute }) => {
                            return (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
                                    <View className="w-12 h-10 rounded-lg mr-4 content-center justify-center" style={{backgroundColor: busRoute.color}}>
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
                        
                        keyExtractor={busRoute => busRoute.id}
                    />
                    </View>
                )

                }

                

                
            </StyledBottomSheetView>
        </BottomSheet>
    );
};

export default Index;