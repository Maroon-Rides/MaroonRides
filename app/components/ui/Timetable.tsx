import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GetStopEstimatesResponseSchema, IRouteStopSchedule } from '../../../utils/interfaces';
import BusIcon from './BusIcon';
import { RouteStopSchedule, getStopEstimates } from 'aggie-spirit-api';
import useAppStore from '../../stores/useAppStore';
import moment from 'moment';


interface Props {
    item: IRouteStopSchedule
    tintColor: string
    stopCode: string
}

interface TableItem {
    time: string,
    color: string,
    shouldHighlight: boolean
    live: boolean,
}

interface TableItemRow {
    items: TableItem[],
    shouldHighlight: boolean
}

const Timetable: React.FC<Props> = ({ item, tintColor, stopCode }) => {

    const authToken = useAppStore((state) => state.authToken);
    const [estimate, setEstimate] = useState<RouteStopSchedule | null>(null);
    const [tableRows, setTableRows] = useState<TableItemRow[]>([]);

    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getStopEstimates(stopCode, moment().toDate(), authToken!);
                GetStopEstimatesResponseSchema.parse(response);

                const estimate = response.routeStopSchedules.find((schedule) => schedule.directionName === item.directionName && schedule.routeName === item.routeName);

                if (estimate) {
                    setEstimate(estimate);
                }
            } catch (error) {
                console.error(error);

                setError(true);

                return;
            }

            setError(false);
        };

        fetchData(); // Call the async function immediately
    }, [stopCode, authToken, item.directionName, item.routeName]);

    useEffect(() => {
        const now = moment();
        let foundNextStop = false;

        const sliceLength = 5;

        let processed = item.stopTimes.map((time) => {
            const timeEstimateIndex = estimate?.stopTimes.findIndex((stopTime) => stopTime.tripPointId == time.tripPointId)
            const timeEstimate = estimate?.stopTimes[timeEstimateIndex!];

            let departTime = timeEstimate ? moment(timeEstimate.estimatedDepartTimeUtc) : moment(time.scheduledDepartTimeUtc);
            let relativeMinutes = departTime.diff(now, "minutes")

            let shouldHighlight = false;
            let color = "grey";

            if (relativeMinutes >= 0 || timeEstimate?.isRealtime) {
                color = "black";
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
                live: (timeEstimate && timeEstimate.isRealtime) ?? false
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
    }, [estimate])

    if(error) {
        return <Text style={{ textAlign: 'center', marginTop: 10 }}>Something went wrong. Please try again later</Text>
    }

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
                marginBottom: 8,
                marginRight: 16,
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
                                backgroundColor: row.shouldHighlight ? tintColor + "40" : (rowIndex % 2 == 0 ? "#efefef" : "white"),
                            }}
                            key={rowIndex}
                        >
                            {row.items.map((item, colIndex) => {
                                return (
                                    <View style={{
                                        flexBasis: "20%",
                                        marginLeft: colIndex == 0 ? 16 : 0,
                                        flexDirection: "row",
                                    }}
                                        key={colIndex}>
                                        <Text style={{
                                            color: item.color,
                                            fontWeight: item.color == tintColor ? "bold" : "normal",
                                            fontSize: 16,
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
                {item.stopTimes.length == 0 && !item.isEndOfRoute && <Text style={{ color: "#8e8e9332", textAlign: "center" }}>Timetable Unavailable</Text>}
            </View>
        </View>
    );
};

export default Timetable;
