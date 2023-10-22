import React, {useCallback, useRef, useState} from "react";

import { Text } from "react-native";
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

const index: React.FC = () => {
    const sheetRef = useRef<BottomSheet>(null);
    const [isOpen, setIsOpen] = useState(true);

    const snapPoints = ['40%'];

    return (
        <BottomSheet ref={sheetRef} snapPoints={snapPoints}>
            <BottomSheetView>
                <Text>Hello World</Text>
            </BottomSheetView>
        </BottomSheet>
    );
};

export default index;