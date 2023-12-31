import React, { useEffect, useRef } from "react";

import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

import RouteDetails from "./RouteDetails";
import RoutesList from "./RoutesList";

import useAppStore from "../stores/useAppStore";

const Index: React.FC = () => {
    const selectedRoute = useAppStore((state) => state.selectedRoute);

    const sheetRef = useRef<BottomSheet>(null);

    const snapPoints = ['16%', '35%', '80%'];
    
    useEffect(() => {
        if(selectedRoute) {
            sheetRef.current?.snapToIndex(1);
        } else {
            sheetRef.current?.snapToIndex(0);
        }
    }, [selectedRoute]);

    return (
        <BottomSheet ref={sheetRef} snapPoints={snapPoints}>
            <BottomSheetView style={{ display: 'flex', flex: 1, paddingHorizontal: 16 }} >
                { selectedRoute ? (<RouteDetails />) : (<RoutesList />) }
            </BottomSheetView>
        </BottomSheet>
    );
};
export default Index;

