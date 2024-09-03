import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IRouteStopSchedule } from '../../../utils/interfaces';
import BusIcon from './BusIcon';
import useAppStore from '../../data/app_state';
import moment from 'moment';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useTimetableEstimate } from 'app/data/api_query';

interface Props {
    item: IRouteStopSchedule
    tintColor: string
    stopCode: string
    dismissBack?: () => void
}

interface TableItem {
    time: string,
    color: string,
    shouldHighlight: boolean
    live: boolean,
    cancelled: boolean
}

interface TableItemRow {
    items: TableItem[],
    shouldHighlight: boolean,
}

const Timetable: React.FC<Props> = ({ item, tintColor, stopCode, dismissBack }) => {
    const selectedTimetableDate = useAppStore((state) => state.selectedTimetableDate);
    const theme = useAppStore((state) => state.theme);

    const [tableRows, setTableRows] = useState<TableItemRow[]>([]);
    const { data: estimate, isLoading } = useTimetableEstimate(stopCode, selectedTimetableDate || moment().toDate());

    useEffect(() => {
        const now = moment().toDate();

        let foundNextStop = false;

        const sliceLength = 5;

        let processed = item.stopTimes.map((time) => {
            const foundEstimate = estimate?.routeStopSchedules.find((schedule) => schedule.directionName === item.directionName && schedule.routeName === item.routeName);
            
            
            const timeEstimateIndex = foundEstimate?.stopTimes.findIndex((stopTime) => stopTime.tripPointId == time.tripPointId)
            const timeEstimate = foundEstimate?.stopTimes[timeEstimateIndex!];

            // have to check if it isnt undefined because if it is undefined, moment will default to current time
            const estimatedTime = timeEstimate && moment(timeEstimate?.estimatedDepartTimeUtc).isValid() ? moment(timeEstimate?.estimatedDepartTimeUtc) : null;
            const scheduledTime = moment(time.scheduledDepartTimeUtc);

            // switch to scheduled time if estimated time is invalid
            let departTime = estimatedTime ?? scheduledTime; 

            let shouldHighlight = false;
            let color = theme.subtitle;

            // if the time is in the future or realtime, highlight it
            // and the next stop isnt cancelled
            // and the time is in the same day

            if (departTime.isSame(now, 'day') 
                && departTime.diff(now, "minutes") >= 0
                || (timeEstimate?.isRealtime && !timeEstimate?.isCancelled)) {
                color = theme.text;
                shouldHighlight = true;
        
                if (!foundNextStop) {
                    color = tintColor;
                    foundNextStop = true;
                }
            }

            return {
                time: departTime.format("h:mm"),
                color: color,
                shouldHighlight: shouldHighlight,
                live: (timeEstimate && timeEstimate.isRealtime) ?? false,
                cancelled: timeEstimate?.isCancelled ?? false
            }
        })

        const stopRows: TableItemRow[] = [];
        let foundHighlight = false;

        // chunk into rows of 5
        for (let i = 0; i < processed.length; i += sliceLength) {
            // check if any of the items in the row should be highlighted
            let shouldHighlight = processed.slice(i, i + sliceLength).some((item) => item.shouldHighlight)

            let row = processed.slice(i, i + sliceLength)

            if (shouldHighlight && !foundHighlight) {
                // set all of the expired items to tint color and 50% opacity
                for (let j = 0; j < row.length; j++) {
                    if (row[j]!.color == "grey") {
                        row[j]!.color = tintColor + "80";
                    }
                }
            }

            // add row
            stopRows.push({
                items: row,
                shouldHighlight: shouldHighlight && !foundHighlight
            })

            shouldHighlight && (foundHighlight = true); // if we found a highlight, don't highlight any more rows
        }

        setTableRows(stopRows);
    }, [estimate, selectedTimetableDate])

    return (
        <View style={{ marginLeft: 16, paddingTop: 8 }}>
            <TouchableOpacity onPress={dismissBack} disabled={dismissBack == null} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <BusIcon name={item.routeNumber} color={tintColor} style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text
                            style={{ fontWeight: "bold", fontSize: 24, color: theme.text, flexShrink: 1 }}
                            numberOfLines={1}
                        >
                            {item.routeName}
                        </Text>
                        {isLoading && <ActivityIndicator />}
                    </View>
                    <Text style={{color: theme.subtitle}}>{item.directionName}</Text>
                </View>
            </TouchableOpacity>

            <View style={{
                marginBottom: 8,
            }}>
                    {tableRows.map((row, rowIndex) => {
                        return (
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    paddingVertical: 8,
                                    paddingHorizontal: 8,
                                    borderRadius: 8,
                                    backgroundColor: row.shouldHighlight ? tintColor + "40" : (rowIndex % 2 == 0 ? theme.timetableRowB : theme.timetableRowA),
                                }}
                                key={rowIndex}
                            >
                                {row.items.map((item, colIndex) => {
                                    return (
                                        <View style={{
                                            flexBasis: "20%",
                                            justifyContent: "center",
                                            flexDirection: "row",
                                        }}
                                            key={colIndex}>
                                            <Text style={{
                                                    color: item.color,
                                                    fontWeight: item.color == tintColor ? "bold" : "normal",
                                                    fontSize: 16,
                                                    textDecorationLine: item.cancelled ? "line-through" : "none"
                                                }}
                                            >{item.time}</Text>
                                        
                                            {item.live &&
                                                <MaterialCommunityIcons name="rss" size={12} color={item.color} style={{ marginRight: -2, paddingLeft: 1, alignSelf: "flex-start" }} />
                                            }
                                        </View>
                                    )
                                })}
                            </View>
                        )
                })}
                {item.stopTimes.length == 0 && !item.isEndOfRoute && <Text style={{ color: "grey", textAlign: "center" }}>No Timetable for Today</Text>}
            </View>
        </View>
    );
};

export default Timetable;
