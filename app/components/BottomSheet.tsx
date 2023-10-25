import React, { useRef, useState } from "react";

import { View, Text, FlatList, Image } from "react-native";
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import DropDownPicker from 'react-native-dropdown-picker';
import { styled } from "nativewind";

import busRoutes from "../../utils/busroutes";

type ImageMapType = {
    [key in string]?: any;
};

const imageMap: ImageMapType = {
    '1': require('../../route_image/1.png'),
    '2': require('../../route_image/2.png'),
    '3': require('../../route_image/3.png'),
    '4': require('../../route_image/4.png'),
    '5': require('../../route_image/5.png'),
    '6': require('../../route_image/6.png'),
    '7': require('../../route_image/7.png'),
    '8': require('../../route_image/8.png'),
    '9': require('../../route_image/9.png'),
    '10': require('../../route_image/10.png'),
    '11': require('../../route_image/11.png'),
    '12': require('../../route_image/12.png'),
    '13': require('../../route_image/13.png'),
    '14': require('../../route_image/14.png'),
    '15': require('../../route_image/15.png'),
    '16': require('../../route_image/16.png'),
    '17': require('../../route_image/17.png'),
    '18': require('../../route_image/18.png'),
    '19': require('../../route_image/19.png'),
    '20': require('../../route_image/20.png'),
    '21': require('../../route_image/21.png'),
    '22': require('../../route_image/22.png'),
};

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
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
                                <Image
                                    source={imageMap[busRoute.id]}
                                    style={{ width: 50, height: 40, marginRight: 10, borderRadius: 10 }}
                                />
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2c3e50' }}>{busRoute.name}</Text>
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