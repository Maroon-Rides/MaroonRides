import { ActivityIndicator, Button, Text, TouchableOpacity, View } from "react-native";
import { BottomSheetModal, BottomSheetView, BottomSheetFlatList, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import BusIcon from "../ui/BusIcon";
import { useDebugValue, useEffect, useState } from "react";
import { MapStop, RouteStopSchedule, StopSchedulesResponse, getStopSchedules } from "aggie-spirit-api";
import useAppStore from "../../stores/useAppStore";
import { Ionicons } from "@expo/vector-icons";
import TimeBubble from "../ui/TimeBubble";
import Timetable from "../ui/Timetable";
import { FlatList } from "react-native-gesture-handler";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";


interface SheetProps {
    sheetRef: React.RefObject<BottomSheetModal>
}

// TODO: Fill in route details with new UI
const StopTimetable: React.FC<SheetProps> = ({ sheetRef }) => {
    const currentSelectedStop = useAppStore((state) => state.selectedStop);
    const setCurrentSelectedStop = useAppStore((state) => state.setSelectedStop);
    const selectedRoute = useAppStore((state) => state.selectedRoute);
    const authToken = useAppStore((state) => state.authToken);
    const routes = useAppStore((state) => state.routes);

    const [ selectedStop, setSelectedStop ] = useState<MapStop | null>(null);
    const [ showNonRouteSchedules, setShowNonRouteSchedules ] = useState<boolean>(false);
    const [ nonRouteSchedules, setNonRouteSchedules ] = useState<RouteStopSchedule[] | null>(null);
    const [ routeSchedules, setRouteSchedules ] = useState<RouteStopSchedule[] | null>(null);

    function loadSchedule(newSelectedStop: MapStop | null = null) {
        if (!newSelectedStop) return;

        getStopSchedules(newSelectedStop?.stopCode, new Date(), authToken!)
            .then((response) => {
                // find the schedules for the selected route
                var routeStops = response.routeStopSchedules.filter((schedule) => schedule.routeName === selectedRoute?.name)

                // filter anything that is end of route
                routeStops = routeStops.filter((schedule) => !schedule.isEndOfRoute);
                setRouteSchedules(routeStops);

                // filter out non route schedules
                var nonRouteStops = response.routeStopSchedules.filter((schedule) => schedule.routeName !== selectedRoute?.name)

                // filter anything that doesnt have stop times
                nonRouteStops = nonRouteStops.filter((schedule) => schedule.stopTimes.length > 0);
                setNonRouteSchedules(nonRouteStops)  
            })
            .catch((error) => {
                console.error(error);
            })
    }

    function getLineColor(shortName: string) {
        const route = routes.find((route) => route.shortName === shortName);
        return route?.directionList[0]?.lineColor ?? "#500000";
    }


    // prevent data from disappearing when the sheet is closed
    useEffect(() => {
        if (!currentSelectedStop) return;

        setSelectedStop(currentSelectedStop);
        loadSchedule(currentSelectedStop);
    }, [currentSelectedStop])


    const snapPoints = ['25%', '45%', '85%'];

    function closeModal() {
        sheetRef.current?.dismiss();
        setRouteSchedules(null);
        setNonRouteSchedules(null);
        setCurrentSelectedStop(null);
        setShowNonRouteSchedules(false);
    }

    return (
        <BottomSheetModal
            ref={sheetRef}
            snapPoints={snapPoints}
            index={1}
            enablePanDownToClose={false}
        >
            <BottomSheetView>
                <View style={{ flexDirection: "row", alignItems: 'center', marginBottom: 8, marginHorizontal: 16 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 28, flex: 1 }}>{selectedStop?.name ?? "Something went wrong"}</Text>

                    <TouchableOpacity style={{ alignContent: 'center', justifyContent: 'flex-end' }} onPress={closeModal}>
                        <Ionicons name="close-circle" size={32} color="grey" />
                    </TouchableOpacity>
                </View>
                <View style={{ height: 1, backgroundColor: "#eaeaea", marginTop: 8 }} />

                { !routeSchedules && <ActivityIndicator style={{ marginTop: 16 }} /> }
            </BottomSheetView>
            <BottomSheetScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 35, paddingTop: 4 }}>
                { routeSchedules &&
                    <FlatList
                        data={routeSchedules}
                        scrollEnabled={false}
                        keyExtractor={(item, index) => index.toString()}
                        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: "#eaeaea", marginVertical: 8 }} />}
                        renderItem={({ item, index }) => {
                            return (
                                <View>
                                    <Timetable item={item} tintColor={getLineColor(item.routeNumber)} />
                                </View>
                            )
                        }}
                    />
                }

                

                { showNonRouteSchedules &&
                    <View>
                        <View style={{ height: 1, backgroundColor: "#eaeaea", marginVertical: 8 }} />
                        <FlatList
                            data={nonRouteSchedules}
                            keyExtractor={(item, index) => index.toString()}
                            scrollEnabled={false}
                            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: "#eaeaea", marginVertical: 8 }} />}
                            renderItem={({ item }) => {
                                return (
                                    <Timetable item={item} tintColor={getLineColor(item.routeNumber)} />
                                )
                            }}
                        />
                    </View>
                }

                { nonRouteSchedules && nonRouteSchedules.length > 0 && 
                    // show other routes button
                    <TouchableOpacity 
                        style={{
                            padding: 8,
                            paddingHorizontal: 16,
                            marginHorizontal: 16,
                            borderRadius: 8,
                            marginTop: 16,
                            alignSelf: 'center',
                            backgroundColor: getLineColor(selectedRoute?.shortName ?? "#550000"),
                        }}
                        onPress={() => setShowNonRouteSchedules(!showNonRouteSchedules)}
                    >
                        <Text style={{color: "white"}}>{showNonRouteSchedules ? "Hide": "Show"} Other Routes</Text>
                    </TouchableOpacity>
                }

            </BottomSheetScrollView>
            

            
        </BottomSheetModal>
    )
}


export default StopTimetable;