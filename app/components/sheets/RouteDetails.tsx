import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, NativeSyntheticEvent, Alert } from "react-native";
import { BottomSheetModal, BottomSheetView, BottomSheetFlatList } from "@gorhom/bottom-sheet";
import SegmentedControl, { NativeSegmentedControlIOSChangeEvent } from "@react-native-segmented-control/segmented-control";
import { Ionicons } from '@expo/vector-icons';
import { getNextDepartureTimes } from "aggie-spirit-api";

import { GetNextDepartTimesResponseSchema, IMapRoute, IPatternPath, IRouteDirectionTime, IStop } from "../../../utils/interfaces";
import useAppStore from "../../stores/useAppStore";
import StopCell from "../ui/StopCell";
import BusIcon from "../ui/BusIcon";
import FavoritePill from "../ui/FavoritePill";
import AlertPill from "../ui/AlertPill";

interface SheetProps {
    sheetRef: React.RefObject<BottomSheetModal>
}

// TODO: Fill in route details with new UI
const RouteDetails: React.FC<SheetProps> = ({ sheetRef }) => {
    const authToken = useAppStore((state) => state.authToken);

    const currentSelectedRoute = useAppStore((state) => state.selectedRoute);
    const clearSelectedRoute = useAppStore((state) => state.clearSelectedRoute);

    const stopEstimates = useAppStore((state) => state.stopEstimates);
    const clearStopEstimates = useAppStore((state) => state.clearStopEstimates);
    const updateStopEstimate = useAppStore((state) => state.updateStopEstimate);

    const [selectedDirectionIndex, setSelectedDirectionIndex] = useState(0);
    const [processedStops, setProcessedStops] = useState<IStop[]>([]);
    const [selectedRoute, setSelectedRoute] = useState<IMapRoute | null>(null);

    // cleanup this view when the sheet is closed
    const closeModal = () => {
        sheetRef.current?.dismiss();
        clearSelectedRoute();
        clearStopEstimates();

        // reset direction selector
        setSelectedDirectionIndex(0);
    }

    function getPatternPathForSelectedRoute(): IPatternPath | undefined {
        if (!selectedRoute) return undefined;
        return selectedRoute.patternPaths.find(direction => direction.patternKey === selectedRoute.directionList[selectedDirectionIndex]?.patternList[0]?.key)
    }

    useEffect(() => {
        if (!selectedRoute) return;

        const processedStops: IStop[] = [];
        const directionPath = getPatternPathForSelectedRoute()?.patternPoints ?? [];

        for (const point of directionPath) {
            if (!point.stop) continue;
            processedStops.push(point.stop);
        }

        // TODO: process active buses and insert into proper locations
        setProcessedStops(processedStops);
    }, [selectedRoute, selectedDirectionIndex])

    // Update the selected route when the currentSelectedRoute changes but only if it is not null
    // Prevents visual glitch when the sheet is closed and the selected route is null
    useEffect(() => {
        if (!currentSelectedRoute) return;
        setSelectedRoute(currentSelectedRoute);

        loadStopEstimates();
    }, [currentSelectedRoute])

    async function loadStopEstimates() {
        clearStopEstimates();

        if (!currentSelectedRoute || !authToken) return;
        let allStops: IStop[] = [];

        for (const path of currentSelectedRoute.patternPaths) {
            for (const point of path.patternPoints) {
                if (!point.stop) continue;
                allStops.push(point.stop);
            }
        }

        const directionKeys = currentSelectedRoute.patternPaths.map(direction => direction.directionKey);

        // load stop estimates
        for (const stop of allStops) {
            try {
                const response = await getNextDepartureTimes(currentSelectedRoute.key, directionKeys, stop.stopCode, authToken);

                GetNextDepartTimesResponseSchema.parse(response);

                updateStopEstimate(response, response.stopCode);
            } catch (error) {
                console.error(error);
                continue;
            }
        }
    }

    const handleSetSelectedDirection = (evt: NativeSyntheticEvent<NativeSegmentedControlIOSChangeEvent>) => {
        setSelectedDirectionIndex(evt.nativeEvent.selectedSegmentIndex);
    }

    const snapPoints = ['25%', '45%', '85%'];

    return (
        <BottomSheetModal
            ref={sheetRef}
            snapPoints={snapPoints}
            index={1}
            enablePanDownToClose={false}
        >
            {selectedRoute &&
                <BottomSheetView>
                    <View style={{ flexDirection: "row", alignItems: 'center', marginBottom: 8, marginHorizontal: 16 }}>
                        <BusIcon name={selectedRoute?.shortName ?? "Something went wrong"} color={selectedRoute?.directionList[0]?.lineColor ?? "#500000"} style={{ marginRight: 16 }} />
                        <Text style={{ fontWeight: 'bold', fontSize: 28, flex: 1 }}>{selectedRoute?.name ?? "Something went wrong"}</Text>

                        <TouchableOpacity style={{ alignContent: 'center', justifyContent: 'flex-end' }} onPress={closeModal}>
                            <Ionicons name="close-circle" size={32} color="grey" />
                        </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: 'center', marginBottom: 8, marginLeft: 16, gap: 4 }}>
                        <FavoritePill routeId={selectedRoute!.key} />
                        <AlertPill routeId={selectedRoute!.key}/>
                    </View>


                    <SegmentedControl
                        style={{ marginHorizontal: 16 }}
                        values={selectedRoute?.directionList.map(direction => "to " + direction.destination) ?? []}
                        selectedIndex={selectedDirectionIndex}
                        onChange={handleSetSelectedDirection}
                    />
                    <View style={{ height: 1, backgroundColor: "#eaeaea", marginTop: 8 }} />
                </BottomSheetView>
            }

            {selectedRoute &&
                <BottomSheetFlatList
                    data={processedStops}
                    style={{ height: "100%", marginLeft: 16 }}
                    contentContainerStyle={{ paddingBottom: 35 }}
                    onRefresh={() => loadStopEstimates()}
                    refreshing={false}
                    ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: "#eaeaea", marginVertical: 4 }} />}
                    renderItem={({ item: stop, index }) => {
                        const departureTimes = stopEstimates.find((stopEstimate) => stopEstimate.stopCode === stop.stopCode);
                        let directionTimes: IRouteDirectionTime = { nextDeparts: [], directionKey: "", routeKey: "" };

                        if (departureTimes) {
                            const routePatternPath = getPatternPathForSelectedRoute()?.directionKey;
                            const tempDirectionTimes = departureTimes?.departureTimes.routeDirectionTimes.find((directionTime) => directionTime.directionKey === routePatternPath);

                            if (tempDirectionTimes) {
                                directionTimes = tempDirectionTimes;
                            }
                        }

                        return (
                            <StopCell
                                stop={stop}
                                directionTimes={directionTimes}
                                amenities={stopEstimates.find((stopEstimate) => stopEstimate.stopCode === stop.stopCode)?.departureTimes.amenities ?? []}
                                color={selectedRoute?.directionList[0]?.lineColor ?? "#909090"}
                                disabled={index === processedStops.length - 1}
                            />
                        );
                    }}
                />
            }

            {!selectedRoute && (
                <View style={{ alignItems: 'center', marginTop: 16 }}>
                    <Text>Something went wrong.</Text>
                </View>
            )}
        </BottomSheetModal>
    )
}


export default RouteDetails;