import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, NativeSyntheticEvent } from "react-native";
import {Ionicons } from '@expo/vector-icons';
import useAppStore from "../../stores/useAppStore";
import BusIcon from "../ui/BusIcon";
import SegmentedControl, { NativeSegmentedControlIOSChangeEvent } from "@react-native-segmented-control/segmented-control";
import TimeBubble from "../ui/TimeBubble";
import FavoritePill from "../ui/FavoritePill";
import { BottomSheetModal, BottomSheetView, BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { IMapRoute, IStop } from "utils/updatedInterfaces";

interface SheetProps {
    sheetRef: React.RefObject<BottomSheetModal>
}

// TODO: Fill in route details with new UI
const RouteDetails: React.FC<SheetProps> = ({ sheetRef }) => {
    const clearSelectedRoute = useAppStore((state) => state.clearSelectedRoute);
    const currentSelectedRoute = useAppStore((state) => state.selectedRoute);

    const [selectedDirection, setSelectedDirection] = useState(0);
    const [processedStops, setProcessedStops] = useState<IStop[]>([]);
    const [selectedRoute, setSelectedRoute] = useState<IMapRoute | null>(null);

    const handleClearSelectedRoute = () => {
        sheetRef.current?.dismiss();
        clearSelectedRoute();
    }

    useEffect(() => {
        if (!selectedRoute) return;

        const processedStops: IStop[] = [];

        const directionPath = selectedRoute.patternPaths[selectedDirection]?.patternPoints ?? [];

        for (const point of directionPath) {
            if (!point.stop) continue;

            processedStops.push(point.stop);
        }

        // TODO: process active buses and insert into proper locations


        setProcessedStops(processedStops);
    }, [selectedRoute, selectedDirection])


    // Update the selected route when the currentSelectedRoute changes but only if it is not null
    // Prevents visual glitch when the sheet is closed and the selected route is null
    useEffect(() => {
        if (!currentSelectedRoute) return;
        setSelectedRoute(currentSelectedRoute);
    }, [currentSelectedRoute])

    const handleSetSelectedDirection = (evt: NativeSyntheticEvent<NativeSegmentedControlIOSChangeEvent>) => {
        setSelectedDirection(evt.nativeEvent.selectedSegmentIndex);
    }

    const snapPoints = ['25%', '45%', '85%'];

    return ( 
        <BottomSheetModal 
            ref={sheetRef} 
            snapPoints={snapPoints} 
            index={1}
        >
        { selectedRoute &&
            <BottomSheetView>
                <View style={{ flexDirection: "row", alignItems: 'center', marginBottom: 8, marginHorizontal: 16 }}>
                    <BusIcon name={selectedRoute?.shortName ?? "Something went wrong" } color={selectedRoute?.directionList[0]?.lineColor ?? "#500000" } style={{marginRight: 16}}/>
                    <Text style={{ fontWeight: 'bold', fontSize: 28, flex: 1}}>{selectedRoute?.name ?? "Something went wrong"}</Text>

                    <TouchableOpacity style={{ alignContent: 'center', justifyContent: 'flex-end' }} onPress={handleClearSelectedRoute}>
                        <Ionicons name="close-circle" size={32} color="grey" />
                    </TouchableOpacity>
                </View>

                <View style={{ flexDirection: "row", alignItems: 'center', marginBottom: 8, marginLeft: 16 }}>
                    <FavoritePill routeId={selectedRoute!.key} />
                </View>


                <SegmentedControl
                    style={{ marginHorizontal: 16 }}
                    values={selectedRoute?.directionList.map(direction => "to " + direction.destination) ?? []}
                    selectedIndex={selectedDirection}
                    onChange={handleSetSelectedDirection}
                />

                <View style={{height: 1, backgroundColor: "#eaeaea", marginTop: 8}} />
            </BottomSheetView>
        }   

            { selectedRoute &&
                <BottomSheetFlatList
                    data={processedStops}
                    style={{paddingTop: 8, height: "100%", marginLeft: 16}}
                    contentContainerStyle={{ paddingBottom: 30 }}
                    renderItem={({item: stop}) => {
                        return (
                            <View style={{marginTop: 4}}>
                                <Text style={{fontSize: 22, fontWeight: "bold"}}>{stop.name}</Text>
                                <Text style={{marginBottom: 8}}>Running 10 minutes late</Text>
                                <TimeBubble time="12:50" color={selectedRoute!.directionList[0]!.lineColor} />
                                
                                {/* Line seperator */}
                                <View style={{height: 1, backgroundColor: "#eaeaea", marginTop: 8}} />
                            </View>
                        )
                    }}
                />
            }

            { !selectedRoute && (
                <View style={{ alignItems: 'center', marginTop: 16 }}>
                    <Text>Something went wrong.</Text>
                </View>
            ) }
    </BottomSheetModal>
)}


export default RouteDetails;