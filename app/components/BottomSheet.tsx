import React, { useEffect, useRef } from "react";

import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

import RouteDetails from "./sheets/RouteDetails";
import RoutesList from "./sheets/RoutesList";

import useAppStore from "../stores/useAppStore";
import AlertList from "./sheets/AlertList";

const Index: React.FC = () => {
    const sheetRef = useRef<BottomSheet>(null);
    const sheetView = useAppStore((state) => state.sheetView);
    const snapPoints = ['35%', '16%', '80%'];

    useEffect(() => {
        if (sheetView !== "alerts") sheetRef.current?.snapToIndex(0);
    }, [sheetView]);

    return (
        <BottomSheet ref={sheetRef} snapPoints={snapPoints}>
            <BottomSheetView style={{ display: 'flex', flex: 1 }} >
                {sheetView === "routeList" && <RoutesList />}
                {sheetView === "routeDetails" && <RouteDetails />}
                {sheetView === "alerts" && <AlertList />}
            </BottomSheetView>
        </BottomSheet>
    );
};
export default Index;

