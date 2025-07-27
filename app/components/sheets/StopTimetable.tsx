import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { FlatList } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import useAppStore from "../../data/app_state";
import { IRouteStopSchedule, IStop } from "../../../utils/interfaces";
import Timetable from "../ui/Timetable";
import moment from "moment-strftime";
import DateSelector from '../ui/DateSelector';
import SheetHeader from "../ui/SheetHeader";
import { useRoutes, useSchedule } from "app/data/api_query";

interface SheetProps {
    sheetRef: React.RefObject<BottomSheetModal>
}

// Timtable with upcoming routes
const StopTimetable: React.FC<SheetProps> = ({ sheetRef }) => {
    const selectedStop = useAppStore((state) => state.selectedStop);
    const setSelectedStop = useAppStore((state) => state.setSelectedStop);

    const selectedRoute = useAppStore((state) => state.selectedRoute);
    const setSelectedRoute = useAppStore((state) => state.setSelectedRoute);
    const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);
    const presentSheet = useAppStore((state) => state.presentSheet);
    const dismissSheet = useAppStore((state) => state.dismissSheet);
    const setSheetCloseCallback = useAppStore((state) => state.setSheetCloseCallback);

    const selectedTimetableDate = useAppStore((state) => state.selectedTimetableDate);
    const setSelectedTimetableDate = useAppStore((state) => state.setSelectedTimetableDate);

    const [tempSelectedStop, setTempSelectedStop] = useState<IStop | null>(null);
    const [showNonRouteSchedules, setShowNonRouteSchedules] = useState<boolean>(false);
    const [nonRouteSchedules, setNonRouteSchedules] = useState<IRouteStopSchedule[] | null>(null);
    const [routeSchedules, setRouteSchedules] = useState<IRouteStopSchedule[] | null>(null);
    const theme = useAppStore((state) => state.theme);

    const { data: routes } = useRoutes();
    const { 
        data: stopSchedule, 
        isError: scheduleError, 
        isLoading: scheduleLoading
    } = useSchedule(selectedStop?.stopCode ?? "", selectedTimetableDate ?? moment().toDate());

    const dayDecrement = () => {
        // Decrease the date by one day
        const prevDate = moment(selectedTimetableDate || moment().toDate()).subtract(1, 'days').toDate();
        setRouteSchedules(null);
        setNonRouteSchedules(null);
        setSelectedTimetableDate(prevDate);
    };
    
    const dayIncrement = () => {
        // Increase the date by one day
        const nextDate = moment(selectedTimetableDate || moment().toDate()).add(1, 'days').toDate();
        setRouteSchedules(null);
        setNonRouteSchedules(null);
        setSelectedTimetableDate(nextDate);
    };

    useEffect(() => {
        if (!stopSchedule) return;

        // find the schedules for the selected route
        let routeStops = stopSchedule.routeStopSchedules.filter((schedule) => schedule.routeName === selectedRoute?.name && schedule.routeNumber === selectedRoute?.shortName)

        // filter anything that is end of route
        routeStops = routeStops.filter((schedule) => !schedule.isEndOfRoute);
        setRouteSchedules(routeStops);

        // filter out non route schedules
        let nonRouteStops = stopSchedule.routeStopSchedules.filter((schedule) => schedule.routeName !== selectedRoute?.name || schedule.routeNumber !== selectedRoute?.shortName)

        // filter anything that doesnt have stop times
        nonRouteStops = nonRouteStops.filter((schedule) => schedule.stopTimes.length > 0);
        setNonRouteSchedules(nonRouteStops)

    }, [stopSchedule]);

    function getLineColor(shortName: string) {
        const route = routes?.find((route) => route.shortName === shortName);
        return route?.directionList[0]?.lineColor ?? "#500000";
    }

    // prevent data from disappearing when the sheet is closed
    useEffect(() => {
        if (!selectedStop) return;

        if (!selectedTimetableDate) setSelectedTimetableDate(moment().toDate());

        setTempSelectedStop(selectedStop);
    }, [selectedStop, selectedTimetableDate])

    useEffect(() => {
        setSheetCloseCallback(() => {
            setRouteSchedules(null);
            setNonRouteSchedules(null);
            setSelectedStop(null);
            setShowNonRouteSchedules(false);
            setSelectedTimetableDate(null);
        }, "stopTimetable")
    }, [])


    const snapPoints = ['25%', '45%', '85%'];
    const [snap, _] = useState(2)

    return (
        <BottomSheetModal
            ref={sheetRef}
            snapPoints={snapPoints}
            index={snap}
            enablePanDownToClose={false}
            enableDynamicSizing={false}
            backgroundStyle={{ backgroundColor: theme.background }}
            handleIndicatorStyle={{ backgroundColor: theme.divider }}
        >
            <View>
                <SheetHeader
                    title={tempSelectedStop?.name ?? "Something went wrong"}
                    icon={
                        <TouchableOpacity style={{ marginLeft: 10 }} onPress={() => dismissSheet("stopTimetable")}>
                            <Ionicons name="close-circle" size={28} color={theme.exitButton} />
                        </TouchableOpacity>
                    }
                />
                <View style={{ height: 1, backgroundColor: theme.divider, marginTop: 8 }} />

            </View>

            { scheduleError && <Text style={{ textAlign: 'center', marginTop: 10, color: theme.subtitle }}>Unable to load schedules. Please try again later</Text> }

            {!scheduleError && (
                <BottomSheetScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 35, paddingTop: 4 }}>
                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8}}>
                        <View style={{flex: 1}} />
                        <DateSelector 
                            text={moment(selectedTimetableDate || moment()).strftime("%A, %B %d")} 
                            leftArrowShown={new Date() < (selectedTimetableDate || moment().toDate())} 
                            onLeftClick={dayDecrement} 
                            onRightClick={dayIncrement}
                        />
                        <View style={{flex: 1}} />
                    </View>

                    {scheduleLoading && <ActivityIndicator style={{ marginBottom: 8 }} />}

                    {routeSchedules && (
                        <FlatList
                            data={routeSchedules}
                            scrollEnabled={false}
                            keyExtractor={(_, index) => index.toString()}
                            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: theme.divider, marginVertical: 8 }} />}
                            style={{marginRight: 16}}
                            renderItem={({ item, index }) => {
                                return (
                                    <View key={index} style={{flex: 1}}>
                                        <Timetable item={item} tintColor={getLineColor(item.routeNumber)} stopCode={selectedStop?.stopCode ?? ""} />
                                    </View>
                                );
                            }}
                        />
                    )}

                    {showNonRouteSchedules && (
                        <View>
                            <View style={{ height: 1, backgroundColor: theme.divider, marginVertical: 8 }} />
                            <FlatList
                                data={nonRouteSchedules}
                                keyExtractor={(_, index) => index.toString()}
                                scrollEnabled={false}
                                style={{marginRight: 16}}
                                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: theme.divider, marginVertical: 8 }} />}
                                renderItem={({ item, index }) => {
                                    return <View key={index} style={{flex: 1}}>
                                        <Timetable 
                                            item={item} 
                                            dismissBack={() => {
                                                const route = routes!.find((route) => route.shortName === item.routeNumber);
                                                
                                                if (route) {
                                                    dismissSheet("stopTimetable")

                                                    setSelectedRoute(route);
                                                    setDrawnRoutes([route]);
                                                    presentSheet("routeDetails");
                                                }
                                            }}
                                            tintColor={getLineColor(item.routeNumber)} 
                                            stopCode={selectedStop?.stopCode ?? ""} 
                                        />
                                    </View>
                                }}
                            />
                        </View>
                    )}

                    {nonRouteSchedules && nonRouteSchedules.length > 0 && (
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
                    )}
                </BottomSheetScrollView>
            )}
        </BottomSheetModal>
    )
}

export default StopTimetable;