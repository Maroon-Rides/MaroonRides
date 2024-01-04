import React, { useEffect } from 'react';
import { Alert, Text, View } from 'react-native';

import { GetStopEstimatesResponseSchema, IRouteDirectionTime, IRouteStopSchedule } from '../../../utils/interfaces';
import BusIcon from './BusIcon';
import TimeBubble from './TimeBubble';
import { RouteStopSchedule, getStopEstimates } from 'aggie-spirit-api';
import useAppStore from '../../stores/useAppStore';


interface Props {
    item: IRouteStopSchedule
    tintColor: string
    stopCode: string
}

const Timetable: React.FC<Props> = ({ item, tintColor, stopCode }) => {

    const authToken = useAppStore((state) => state.authToken);
    const [estimate, setEstimate] = React.useState<RouteStopSchedule | null>(null);

    useEffect(() => {
        getStopEstimates(stopCode, new Date(), authToken!)
            .then((response) => {
                try {
                    GetStopEstimatesResponseSchema.parse(response);
                    const estimate = response.routeStopSchedules.find((schedule) => schedule.directionName === item.directionName && schedule.routeName === item.routeName)
                    if (estimate) setEstimate(estimate);
                } catch (error) {
                    console.error(error);
                    Alert.alert("Error while loading stop estimates");
                }
            })
    }, [])

    return (
        <View style={{ marginLeft: 16, paddingTop: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <BusIcon name={item.routeNumber} color={tintColor} style={{ marginRight: 8 }} />
                <View>
                    <Text style={{ fontWeight: "bold", fontSize: 24, flex: 1 }}>{item.routeName}</Text>
                    <Text>{item.directionName}</Text>
                </View>
            </View>

            <View style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
                marginRight: 16,
                flexWrap: "wrap"
            }}>

                {item.stopTimes.length > 0 && item.stopTimes.map((time) => {
                    // check if time is in estimate
                    const timeEstimate = estimate?.stopTimes.find((stopTime) => {
                        return stopTime.tripPointId == time.tripPointId
                    })

                    const timeEstimateIndex = estimate?.stopTimes.findIndex((stopTime) => stopTime.tripPointId == time.tripPointId)
                    
                    var dt;
                    if (timeEstimate) dt = new Date(timeEstimate.estimatedDepartTimeUtc)
                    else dt = new Date(time.scheduledDepartTimeUtc)

                    let ds = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'America/Chicago' })

                    // cut off the AM/PM
                    ds = ds.substring(0, ds.length - 3);

                    let color;
                    if (dt! < new Date() && !timeEstimate) {
                        color = "grey";
                    } else if (timeEstimateIndex == 0) {
                        console.log(tintColor)
                        color = tintColor;
                    } else {
                        color = "black";
                    }
                    
                    return (
                        <View style={{ marginBottom: 8, flexBasis: "20%" }} key={time.scheduledDepartTimeUtc}>
                            <TimeBubble key={time.scheduledDepartTimeUtc} time={ds} color={color} live={timeEstimate !== undefined} />
                        </View>
                    )
                })}

                {item.stopTimes.length == 0 && !item.isEndOfRoute && <Text style={{ color: "grey" }}>Bus is not scheduled today.</Text>}
            </View>
        </View>
    );
};

export default Timetable;
