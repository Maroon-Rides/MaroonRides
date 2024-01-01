import React, { useRef } from "react";

import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

import RouteDetails from "./RouteDetails";
import RoutesList from "./RoutesList";

import useAppStore from "../stores/useAppStore";
import AlertList from "./AlertList";

const Index: React.FC = () => {
    const sheetRef = useRef<BottomSheet>(null);
    const sheetView = useAppStore((state) => state.sheetView);
    const snapPoints = ['35%', '16%', '80%'];

    return (
        <BottomSheet ref={sheetRef} snapPoints={snapPoints}>
            <BottomSheetView style={{ display: 'flex', flex: 1, paddingHorizontal: 16 }} >
                {sheetView === "routeList" && <RoutesList />}
                {sheetView === "routeDetails" && <RouteDetails />}
                {sheetView === "alerts" && <AlertList />}
            </BottomSheetView>
        </BottomSheet>
    );
};
export default Index;

