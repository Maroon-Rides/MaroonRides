import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";
import { BottomSheetModal, BottomSheetView, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { FlatList } from "react-native-gesture-handler";
import { getStopSchedules } from "aggie-spirit-api";
import { Ionicons } from "@expo/vector-icons";

import useAppStore from "../../stores/useAppStore";
import { IRouteStopSchedule, IStop } from "../../../utils/interfaces";
import Timetable from "../ui/Timetable";

interface SheetProps {
    sheetRef: React.RefObject<BottomSheetModal>
}

// TODO: Fill in route details with new UI
const StopTimetable: React.FC<SheetProps> = ({ sheetRef }) => {
    const authToken = useAppStore((state) => state.authToken);
    const routes = useAppStore((state) => state.routes);

    const selectedStop = useAppStore((state) => state.selectedStop);
    const setSelectedStop = useAppStore((state) => state.setSelectedStop);

    const selectedRoute = useAppStore((state) => state.selectedRoute);

    const [tempSelectedStop, setTempSelectedStop] = useState<IStop | null>(null);
    const [showNonRouteSchedules, setShowNonRouteSchedules] = useState<boolean>(false);
    const [nonRouteSchedules, setNonRouteSchedules] = useState<IRouteStopSchedule[] | null>(null);
    const [routeSchedules, setRouteSchedules] = useState<IRouteStopSchedule[] | null>(null);

    function loadSchedule(newSelectedStop: IStop | null = null) {
        if (!newSelectedStop || !authToken) return;

        try {
            getStopSchedules(newSelectedStop?.stopCode, new Date(), authToken)
                .then((response) => {
                    // find the schedules for the selected route
                    let routeStops = response.routeStopSchedules.filter((schedule) => schedule.routeName === selectedRoute?.name)

                    // filter anything that is end of route
                    routeStops = routeStops.filter((schedule) => !schedule.isEndOfRoute);
                    setRouteSchedules(routeStops);

                    // filter out non route schedules
                    let nonRouteStops = response.routeStopSchedules.filter((schedule) => schedule.routeName !== selectedRoute?.name)

                    // filter anything that doesnt have stop times
                    nonRouteStops = nonRouteStops.filter((schedule) => schedule.stopTimes.length > 0);
                    setNonRouteSchedules(nonRouteStops)
                })
        } catch (error) {
            console.error(error);

            Alert.alert("Error while fetching stop schedules");
        }
    }

    function getLineColor(shortName: string) {
        const route = routes.find((route) => route.shortName === shortName);
        return route?.directionList[0]?.lineColor ?? "#500000";
    }

    // prevent data from disappearing when the sheet is closed
    useEffect(() => {
        if (!selectedStop) return;

        setTempSelectedStop(selectedStop);
        loadSchedule(selectedStop);
    }, [selectedStop])


    const snapPoints = ['25%', '45%', '85%'];

    function closeModal() {
        sheetRef.current?.dismiss();
        setRouteSchedules(null);
        setNonRouteSchedules(null);
        setSelectedStop(null);
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
                    <Text style={{ fontWeight: 'bold', fontSize: 28, flex: 1 }}>{tempSelectedStop?.name ?? "Something went wrong"}</Text>

                    <TouchableOpacity style={{ alignContent: 'center', justifyContent: 'flex-end' }} onPress={closeModal}>
                        <Ionicons name="close-circle" size={32} color="grey" />
                    </TouchableOpacity>
                </View>
                <View style={{ height: 1, backgroundColor: "#eaeaea", marginTop: 8 }} />

                {!routeSchedules && <ActivityIndicator style={{ marginTop: 16 }} />}
            </BottomSheetView>

            <BottomSheetScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 35, paddingTop: 4 }}>
                {routeSchedules &&
                    <FlatList
                        data={routeSchedules}
                        scrollEnabled={false}
                        keyExtractor={(_, index) => index.toString()}
                        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: "#eaeaea", marginVertical: 8 }} />}
                        renderItem={({ item, index }) => {
                            return (
                                <View key={index}>
                                    <Timetable item={item} tintColor={getLineColor(item.routeNumber)} />
                                </View>
                            )
                        }}
                    />
                }



                {showNonRouteSchedules &&
                    <View>
                        <View style={{ height: 1, backgroundColor: "#eaeaea", marginVertical: 8 }} />
                        <FlatList
                            data={nonRouteSchedules}
                            keyExtractor={(_, index) => index.toString()}
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

                {nonRouteSchedules && nonRouteSchedules.length > 0 &&
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
                        <Text style={{ color: "white" }}>{showNonRouteSchedules ? "Hide" : "Show"} Other Routes</Text>
                    </TouchableOpacity>
                }

            </BottomSheetScrollView>
        </BottomSheetModal>
    )
}


export default StopTimetable;