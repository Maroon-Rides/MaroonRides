import React, { useRef } from "react";

import { View, Text, FlatList } from "react-native";
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { styled } from "nativewind";

import busRoutes from "../../utils/busroutes";

const StyledBottomSheetView = styled(BottomSheetView);

const index: React.FC = () => {
    const sheetRef = useRef<BottomSheet>(null);

    const snapPoints = ['35%'];
    
    return (
        <BottomSheet ref={sheetRef} snapPoints={snapPoints}>
            <StyledBottomSheetView className="flex flex-1 p-4">
                <FlatList
                    data={busRoutes}
                    renderItem={({ item: busRoute }) => {
                        return (
                            <View className="my-3">
                                <Text className='text-lg font-bold text-neutral-900'>{busRoute.name}</Text>
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