import React, { memo } from "react";
import { View, TouchableOpacity } from "react-native";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import Ionicons from '@expo/vector-icons/Ionicons';

import useAppStore from "../../../data/app_state";
import SheetHeader from "../../ui/SheetHeader";


interface SheetProps {
    sheetRef: React.RefObject<BottomSheetModal>
}

// TripPlanDetail (for all routes and current route)
const TripPlanDetail: React.FC<SheetProps> = ({ sheetRef }) => {

    const snapPoints = ['25%', '45%', '85%'];

    const theme = useAppStore((state) => state.theme);
    const selectedRoutePlan = useAppStore((state) => state.selectedRoutePlan);

    return (
        <BottomSheetModal 
            ref={sheetRef} 
            snapPoints={snapPoints} 
            index={1} 
            backgroundStyle={{backgroundColor: theme.background}}
            handleIndicatorStyle={{backgroundColor: theme.divider}}
        >
            <BottomSheetView>
                {/* header */}
                <SheetHeader
                    title="Alerts"
                    subtitle={selectedRoutePlan?.optionIndex.toString() ?? "No route selected"}
                    icon={
                        <TouchableOpacity style={{ marginLeft: 10 }} onPress={() => sheetRef.current?.dismiss()}>
                            <Ionicons name="close-circle" size={28} color={theme.exitButton} />
                        </TouchableOpacity>
                    }
                />

                <View style={{ height: 1, backgroundColor: theme.divider, marginTop: 8 }} />
            </BottomSheetView>
        </BottomSheetModal>
    )
}

export default memo(TripPlanDetail);