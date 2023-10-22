import React, { useCallback, useRef, useState } from 'react';

import { SafeAreaView, Text } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

const Home = () => {
    const sheetRef = useRef<BottomSheet>(null);
    const [isOpen, setIsOpen] = useState(true);

    const snapPoints = ['25%'];

    return (
        <SafeAreaView className='flex flex-1 justify-center items-center'>
            <Text>Revellie Rides</Text>

            <BottomSheet ref={sheetRef} snapPoints={snapPoints}>
                <BottomSheetView>
                    <Text>Hello World</Text>
                </BottomSheetView>
            </BottomSheet>
        </SafeAreaView>
    )
}

export default Home;