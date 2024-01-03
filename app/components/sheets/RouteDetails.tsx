import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, NativeSyntheticEvent, Alert } from "react-native";
import { BottomSheetModal, BottomSheetView, BottomSheetFlatList } from "@gorhom/bottom-sheet";
import SegmentedControl, { NativeSegmentedControlIOSChangeEvent } from "@react-native-segmented-control/segmented-control";
import {Ionicons } from '@expo/vector-icons';
import { MapRoute, MapStop, RouteDirectionTime, getNextDepartureTimes } from "aggie-spirit-api";
import useAppStore from "../../stores/useAppStore";
import BusIcon from "../ui/BusIcon";
import TimeBubble from "../ui/TimeBubble";
import FavoritePill from "../ui/FavoritePill";
import { FlatList } from "react-native-gesture-handler";
import { late } from "zod";

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
    
    const [selectedDirection, setSelectedDirection] = useState(0);
    const [processedStops, setProcessedStops] = useState<MapStop[]>([]);
    const [selectedRoute, setSelectedRoute] = useState<MapRoute | null>(null);
    
    const handleClearSelectedRoute = () => {
        sheetRef.current?.dismiss();
        clearSelectedRoute();
        // clearStopEstimates();
    }
    
    useEffect(() => {
        if (!selectedRoute) return;
        
        const processedStops: MapStop[] = [];
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
        loadStopEstimates();
    }, [currentSelectedRoute])

    function loadStopEstimates() {
        if (!selectedRoute || !authToken) return;
        let allStops: MapStop[] = [];

        for (const path of selectedRoute.patternPaths) {
            for (const point of path.patternPoints) {
                if (!point.stop) continue;
                allStops.push(point.stop);
            }
        }

        var directionKeys = selectedRoute.patternPaths.map(direction => direction.directionKey);

        // load stop estimates
        for (const stop of allStops) {
            try {
                getNextDepartureTimes(selectedRoute.key, directionKeys, stop.stopCode, authToken).then((response) => {
                    console.log(response)
                    updateStopEstimate(response, stop.stopCode);
                })
            } catch (error) {
                console.error(error);
                continue;
            }
        }
    }

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
                    values={selectedRoute?.directionList.map(direction => direction.destination) ?? []}
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
                        const departureTimes = stopEstimates.find((stopEstimate) => stopEstimate.stopCode === stop.stopCode)
                        var directionTimes: RouteDirectionTime | undefined;
                        
                        if (departureTimes) {
                            directionTimes = departureTimes?.departureTimes.routeDirectionTimes.find((directionTime) => directionTime.directionKey === selectedRoute?.patternPaths[selectedDirection]?.directionKey ?? "")
                        }
                        
                        if (!directionTimes) directionTimes = { nextDeparts: [], directionKey: "",  routeKey: ""};

                        var lateAverage = 0;
                        for (const departTime of directionTimes.nextDeparts) {
                            var estimated = new Date(departTime.estimatedDepartTimeUtc ?? "");
                            var scheduled = new Date(departTime.scheduledDepartTimeUtc ?? "");
                            const delay = estimated.getTime() - scheduled.getTime()
                            if (isNaN(delay)) continue;
                            if (estimated && scheduled) lateAverage += delay;
                        }

                        lateAverage /= directionTimes.nextDeparts.length;
                        lateAverage /= 1000 * 60; // convert to minutes
                        lateAverage = Math.round(lateAverage);

                        var lateString = "No Times Available";
                        if (!isNaN(lateAverage)) {
                            if (lateAverage > 0) lateString = `${lateAverage} ${lateAverage > 1 ? "minutes" : "minute"} late`;
                            else if (lateAverage < 0) lateString = `${Math.abs(lateAverage)} ${Math.abs(lateAverage) > 1 ? "minutes" : "minute"} early`;
                            else lateString = "On time";
                        } 

                        return (
                            <View style={{marginTop: 4}}>
                                <Text style={{fontSize: 22, fontWeight: "bold"}}>{stop.name}</Text>
                                <Text style={{marginBottom: 8}}>{lateString}</Text>
                                

                                <FlatList
                                    horizontal
                                    data={directionTimes.nextDeparts}
                                    keyExtractor={(_, index) => String(index)}
                                    renderItem={({item: departureTime, index}) => {
                                        var date;
                                        var live = false;
                                        

                                        if (departureTime.estimatedDepartTimeUtc !== null) {
                                            date = new Date(departureTime.estimatedDepartTimeUtc ?? "")
                                            live = true;
                                        } else {
                                            date = new Date(departureTime.scheduledDepartTimeUtc ?? "")
                                        }

                                        const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'America/Chicago' })
                                        
                                        // cut off the AM/PM
                                        const stringTime = time.split(" ")[0] ?? ""; // yes it is a " " not a " ", stupid JS
                                        return (
                                            <TimeBubble time={stringTime} color={index==0 ? selectedRoute!.directionList[0]!.lineColor : "#909090"} live={live}/>
                                        )
                                    }}
                                />
                                
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