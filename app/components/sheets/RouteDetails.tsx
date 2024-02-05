import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, NativeSyntheticEvent } from "react-native";
import { BottomSheetModal, BottomSheetView, BottomSheetFlatList } from "@gorhom/bottom-sheet";
import SegmentedControl, { NativeSegmentedControlIOSChangeEvent } from "@react-native-segmented-control/segmented-control";
import { Ionicons } from '@expo/vector-icons';
import { getNextDepartureTimes } from "aggie-spirit-api";

import { GetNextDepartTimesResponseSchema, ICachedStopEstimate, IMapRoute, IPatternPath, IRouteDirectionTime, IStop } from "../../../utils/interfaces";
import useAppStore from "../../stores/useAppStore";
import StopCell from "../ui/StopCell";
import BusIcon from "../ui/BusIcon";
import FavoritePill from "../ui/FavoritePill";
import AlertPill from "../ui/AlertPill";

interface SheetProps {
    sheetRef: React.RefObject<BottomSheetModal>
}

// Display details when a route is selected
const RouteDetails: React.FC<SheetProps> = ({ sheetRef }) => {
    const authToken = useAppStore((state) => state.authToken);

    const currentSelectedRoute = useAppStore((state) => state.selectedRoute);
    const clearSelectedRoute = useAppStore((state) => state.clearSelectedRoute);

    const setSelectedRouteDirection = useAppStore(state => state.setSelectedRouteDirection);
    const setSelectedStop = useAppStore(state => state.setSelectedStop);
    const stopEstimates = useAppStore((state) => state.stopEstimates);
    const setStopEstimates = useAppStore(state => state.setStopEstimates);

    // Controls SegmentedControl
    const [selectedDirectionIndex, setSelectedDirectionIndex] = useState(0);

    const [processedStops, setProcessedStops] = useState<IStop[]>([]);
    const [selectedRoute, setSelectedRoute] = useState<IMapRoute | null>(null);

    const [error, setError] = useState(false);

    // cleanup this view when the sheet is closed
    const closeModal = () => {
        sheetRef.current?.dismiss();
        clearSelectedRoute();
        setStopEstimates([]);
        setSelectedRouteDirection(null);
        setSelectedStop(null);

        // reset direction selector
        setSelectedDirectionIndex(0);
    }

    // Filters patternPaths for only the selected route from all patternPaths
    function getPatternPathForSelectedRoute(): IPatternPath | undefined {
        if (!selectedRoute) return undefined;
        return selectedRoute.patternPaths.find(direction => direction.patternKey === selectedRoute.directionList[selectedDirectionIndex]?.patternList[0]?.key)
    }

    // When a new route is selected or the direction of the route is changed, update the stops
    useEffect(() => {
        if (!selectedRoute) return;

        const processedStops: IStop[] = [];
        const directionPath = getPatternPathForSelectedRoute()?.patternPoints ?? [];

        for (const point of directionPath) {
            if (!point.stop) continue;
            processedStops.push(point.stop);
        }

        setProcessedStops(processedStops);
    }, [selectedRoute, selectedDirectionIndex])

    // Update the selected route when the currentSelectedRoute changes but only if it is not null
    // Prevents visual glitch when the sheet is closed and the selected route is null
    useEffect(() => {
        if (!currentSelectedRoute) return;
        setSelectedRoute(currentSelectedRoute);

        setSelectedRouteDirection(currentSelectedRoute.directionList[0]?.direction.key ?? null);

        loadStopEstimates();
    }, [currentSelectedRoute])

    useEffect(() => {
        return () => setSelectedRouteDirection(null);
    }, []);

    async function loadStopEstimates() {
        if (!currentSelectedRoute || !authToken) return;
        let allStops: IStop[] = [];

        for (const path of currentSelectedRoute.patternPaths) {
            for (const point of path.patternPoints) {
                if (!point.stop) continue;
                allStops.push(point.stop);
            }
        }

        const directionKeys = currentSelectedRoute.patternPaths.map(direction => direction.directionKey);

        const newStopEstimates: ICachedStopEstimate[] = [];

        // load stop estimates concurrently
        const promises = allStops.map(async stop => {
            try {
                const response = await getNextDepartureTimes(currentSelectedRoute.key, directionKeys, stop.stopCode, authToken);
                GetNextDepartTimesResponseSchema.parse(response);

                newStopEstimates.push({ stopCode: stop.stopCode, departureTimes: response });
            } catch (error) {
                console.error(error);

                setError(true);

                // Make sure to return as if we don't the error state will be reset by the next line
                return;
            }

            // If we rerun the request and there is no error, make sure to reset the error state
            setError(false);
        });

        await Promise.all(promises);
        setStopEstimates(newStopEstimates);
    }

    const handleSetSelectedDirection = (evt: NativeSyntheticEvent<NativeSegmentedControlIOSChangeEvent>) => {
        setSelectedDirectionIndex(evt.nativeEvent.selectedSegmentIndex);
        
        setSelectedRouteDirection(selectedRoute?.directionList[evt.nativeEvent.selectedSegmentIndex]?.direction.key ?? null);
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
                        <AlertPill routeId={selectedRoute!.key} />
                    </View>

                    { selectedRoute?.directionList.length > 1 && 
                        <SegmentedControl
                            style={{ marginHorizontal: 16 }}
                            values={selectedRoute?.directionList.map(direction => "to " + direction.destination) ?? []}
                            selectedIndex={selectedDirectionIndex}
                            onChange={handleSetSelectedDirection}
                        />
                    }
                    
                    <View style={{ height: 1, backgroundColor: "#eaeaea", marginTop: 8 }} />
                </BottomSheetView>
            }
            
            { error && <Text style={{ textAlign: 'center', marginTop: 10 }}>Something went wrong. Please try again later</Text> }

            {!error && selectedRoute &&
                <BottomSheetFlatList
                    data={processedStops}
                    extraData={[...stopEstimates]}
                    style={{ height: "100%" }}
                    contentContainerStyle={{ paddingBottom: 35, paddingLeft: 16 }}
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

                            // remove duplicate nextDeparts if there are any scheduledDepartTimeUtc duplicates
                            directionTimes.nextDeparts = directionTimes.nextDeparts.filter((value, index, self) => {
                                return self.findIndex((time) => time.scheduledDepartTimeUtc === value.scheduledDepartTimeUtc) === index;
                            });

                        }

                        return (
                            <StopCell
                                stop={stop}
                                directionTimes={directionTimes}
                                amenities={stopEstimates.find((stopEstimate) => stopEstimate.stopCode === stop.stopCode)?.departureTimes.amenities ?? []}
                                color={selectedRoute?.directionList[0]?.lineColor ?? "#909090"}
                                disabled={index === processedStops.length - 1}
                                setSheetPos={(pos) => sheetRef.current?.snapToIndex(pos)}
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
