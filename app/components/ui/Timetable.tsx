import React from 'react';
import { Text, View } from 'react-native';
import BusIcon from './BusIcon';
import TimeBubble from './TimeBubble';
import { RouteStopSchedule } from 'aggie-spirit-api';

interface Props {
    item: RouteStopSchedule
    tintColor: string
}

const Timetable: React.FC<Props> = ({ item, tintColor }) => {

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

                    const dt = new Date(time.scheduledDepartTimeUtc)
                    let ds = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'America/Chicago' })

                    // cut off the AM/PM
                    ds = ds.substring(0, ds.length - 3);

                    let color;
                    if (dt < new Date()) {
                        color = "grey";
                    }
                    else if (time.isRealtime) {
                        color = "green";
                    }
                    else {
                        color = "black";
                    }
                    return (
                        <View style={{ marginBottom: 8, flexBasis: "20%" }} key={time.scheduledDepartTimeUtc}>
                            <TimeBubble key={time.scheduledDepartTimeUtc} time={ds} color={color} live={time.isRealtime} />
                        </View>
                    )
                })}

                {item.stopTimes.length == 0 && !item.isEndOfRoute && <Text style={{ color: "grey" }}>Bus is not scheduled today.</Text>}
            </View>
        </View>
    );
};

export default Timetable;
