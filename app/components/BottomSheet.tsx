import React, { useRef, useState } from "react";

import { View, Text, FlatList } from "react-native";
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import SegmentedControl from '@react-native-segmented-control/segmented-control';

import { styled } from "nativewind";

import busRoutes from "../../utils/busroutes";

const StyledBottomSheetView = styled(BottomSheetView);
  
const index: React.FC = () => {
    const sheetRef = useRef<BottomSheet>(null);

    const snapPoints = ['35%'];

    const groups = [busRoutes.filter(route => route.onCampus), busRoutes.filter(route => !route.onCampus)]

    const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
    const [selectedGroup, setSelectedGroup] = useState(groups[0]);

    return (
        <BottomSheet ref={sheetRef} snapPoints={snapPoints}>
            <StyledBottomSheetView className="flex flex-1 px-4">
            <SegmentedControl
                values={['On Campus', 'Off Campus']}
                selectedIndex={selectedGroupIndex}
                onChange={(event) => {
                    setSelectedGroupIndex(event.nativeEvent.selectedSegmentIndex)
                    setSelectedGroup(groups[event.nativeEvent.selectedSegmentIndex])
                }}
            />
                <FlatList
                    data={selectedGroup}
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
            </StyledBottomSheetView>
        </BottomSheet>
    );
};

export default index;