import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IDirection, IMapRoute, IStop } from "../../../utils/interfaces";
import TimeBubble from "./TimeBubble";
import useAppStore from "../../data/app_state";
import AmenityRow from "./AmenityRow";
import moment from "moment";
import { useStopEstimate } from "app/data/api_query";

interface Props {
    stop: IStop
    route: IMapRoute
    direction: IDirection
    color: string
    disabled: boolean
    setSheetPos: (pos: number) => void
}

const StopCell: React.FC<Props> = ({ stop, route, direction, color, disabled, setSheetPos }) => {
    const [status, setStatus] = useState('On Time');

    const presentSheet = useAppStore((state) => state.presentSheet);
    const setSelectedStop = useAppStore((state) => state.setSelectedStop);
    const zoomToStopLatLng = useAppStore((state) => state.zoomToStopLatLng);
    const setPoppedUpStopCallout = useAppStore((state) => state.setPoppedUpStopCallout);
    const selectedRoute = useAppStore((state) => state.selectedRoute);
    const theme = useAppStore((state) => state.theme);

    const { data: stopEstimate, isLoading, isError } = useStopEstimate(route.key, direction.key, stop.stopCode);

    useEffect(() => {
        if (!stopEstimate) return

        const estimate = stopEstimate.routeDirectionTimes[0]!;

        let totalDeviation = 0;

        for (const departTime of estimate.nextDeparts) {
            const estimatedTime = moment(departTime.estimatedDepartTimeUtc ?? "");
            const scheduledTime = moment(departTime.scheduledDepartTimeUtc ?? "");

            const delayLength = estimatedTime.diff(scheduledTime, "seconds");

            if (!isNaN(delayLength)) {
                totalDeviation += delayLength;
            }
        }

        const avgDeviation = totalDeviation / estimate.nextDeparts.length / (60);
        const roundedDeviation = Math.round(avgDeviation);

        if (estimate.directionKey === "") {
            setStatus('Loading');
        } else if (estimate.nextDeparts.length === 0) {
            setStatus("No times to show");
        } else if (roundedDeviation > 0) {
            setStatus(`${roundedDeviation} ${roundedDeviation > 1 ? "minutes" : "minute"} late`);
        } else if (roundedDeviation < 0) {
            setStatus(`${Math.abs(roundedDeviation)} ${Math.abs(roundedDeviation) > 1 ? "minutes" : "minute"} early`);
        } else {
            setStatus('On Time');
        }
    }, [stopEstimate]);

    // when cell is tapped, open the stop timetable
    function toTimetable() {
        setSelectedStop(stop);
        presentSheet("stopTimetable")
    }

    function zoomToStop() {
        // find the gps coordinates of the stop
        selectedRoute?.patternPaths.forEach((path) => {
            const point = path.patternPoints.find((point) => point.stop?.stopCode === stop.stopCode);
            if (point) {
                setSheetPos(1);
                zoomToStopLatLng(point.latitude, point.longitude);
                setTimeout(() => setPoppedUpStopCallout(stop), 300);
            }
        })
    }

    return (
        <TouchableOpacity style={{ marginTop: 8 }} onPress={zoomToStop}>
            <View style={{ flexDirection: "row", alignContent: "flex-start" }}>
                <Text style={{ fontSize: 22, fontWeight: "bold", width: "75%", color: theme.text }}>{stop.name}</Text>
                <View style={{ flex: 1 }} />
                <AmenityRow amenities={stopEstimate?.amenities ?? []} size={24} color={theme.subtitle} style={{ paddingRight: 16, alignSelf: "flex-start" }} />
            </View>

            { isLoading ? (
                <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 2 }}>
                    <ActivityIndicator style={{ justifyContent: "flex-start" }} />
                    <View style={{ flex: 1 }} />
                </View>
            ) : (
                <Text style={{ marginBottom: 12, marginTop: 4, color: theme.subtitle }}>
                    { isError
                        ? "Unable to load estimates. Please try again later."
                        : status
                    }</Text>
            )}

            <View style={{ flexDirection: "row", alignItems: "center", marginRight: 8, marginBottom: 8, marginTop: -4 }}>
                <FlatList
                    horizontal
                    scrollEnabled={false}
                    data={stopEstimate?.routeDirectionTimes[0]?.nextDeparts ?? []}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={({ item: departureTime, index }) => {
                        const date = moment(departureTime.estimatedDepartTimeUtc ?? departureTime.scheduledDepartTimeUtc ?? "");
                        const relative = date.diff(moment(), "minutes");
                        return (
                            <TimeBubble
                                key={index}
                                time={relative <= 0 ? "Now" : relative.toString() + " min"}
                                color={index == 0 ? color + (theme.mode == "dark" ? "65" : "40") : theme.nextStopBubble}
                                textColor={index == 0 ? (theme.mode == "dark" ? theme.text : color) : theme.text}
                                live={departureTime.estimatedDepartTimeUtc == null ? false : true}
                            />
                        )
                    }}
                />

                {/* <View style={{ flex: 1 }} /> */}
                {!disabled &&
                    <TouchableOpacity
                        style={{
                            alignItems: 'center',
                            flexDirection: "row",
                            paddingVertical: 4, // increase touch area
                            paddingLeft: 8, // increase touch area
                        }}
                        onPress={toTimetable}
                    >
                        {/* <MaterialCommunityIcons name="clock-outline" size={20} />                 */}
                        <Text style={{ fontSize: 16, textAlign: 'center', fontWeight: 'bold', marginVertical: 4, marginLeft: 4, marginRight: 2, color: color }}>
                            All
                        </Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={color} />

                    </TouchableOpacity>
                }
            </View>
        </TouchableOpacity>
    )
}

export default StopCell;