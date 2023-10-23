import React, { useRef, useState } from "react";

import { View, Text, FlatList } from "react-native";
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import DropDownPicker from 'react-native-dropdown-picker';
import { styled } from "nativewind";

import busRoutes from "../../utils/busroutes";

const StyledBottomSheetView = styled(BottomSheetView);
const StyledDropDownPicker = styled(DropDownPicker);

const index: React.FC = () => {
    const sheetRef = useRef<BottomSheet>(null);

    const snapPoints = ['35%'];

    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('onCampus');
    const [items, setItems] = useState([
        { label: 'On Campus', value: 'onCampus' },
        { label: 'Off Campus', value: 'offCampus' },
        { label: 'All', value: 'all' }
    ]);

    return (
        <BottomSheet ref={sheetRef} snapPoints={snapPoints}>
            <StyledBottomSheetView className="flex flex-1 px-4">
                <StyledDropDownPicker
                    open={open}
                    value={value}
                    items={items}
                    setOpen={setOpen}
                    setValue={setValue}
                    setItems={setItems}
                    dropDownDirection="BOTTOM"
                    className="border border-gray-200"
                    showArrowIcon={false}
                    placeholder="On Campus"
                    dropDownContainerStyle={{ borderColor: 'lightgray' }}
                />
                <FlatList
                    data={(value === 'onCampus') ? busRoutes.filter(route => route.onCampus) : ((value === 'offCampus') ? busRoutes.filter((route) => !route.onCampus) : busRoutes)}
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