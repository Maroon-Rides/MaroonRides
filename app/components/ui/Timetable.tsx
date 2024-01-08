import React, { useEffect } from 'react';
import { Alert, Text, View } from 'react-native';
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
    const [estimate, setEstimate] = React.useState<RouteStopSchedule | null>(null);
    const [tableRows, setTableRows] = React.useState<TableItemRow[]>([]);

    useEffect(() => {
        getStopEstimates(stopCode, moment().toDate(), authToken!)
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

    useEffect(() => {
        const now = moment();
        var foundNextStop = false
        const processed = item.stopTimes.map((time) => {
            const timeEstimateIndex = estimate?.stopTimes.findIndex((stopTime) => stopTime.tripPointId == time.tripPointId)
            const timeEstimate = estimate?.stopTimes[timeEstimateIndex!];

            var departTime = timeEstimate ? moment(timeEstimate.estimatedDepartTimeUtc) : moment(time.scheduledDepartTimeUtc);
            let relativeMinutes = departTime.diff(now, "minutes")

            let shouldHighlight = false;
            let color = "grey";

            if (relativeMinutes >= 0) {
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

        var stopRows: TableItemRow[] = [];
        var foundHighlight = false;

        // chunk into rows of 4
        for (let i = 0; i < processed.length; i += 5) {   
            // check if any of the items in the row should be highlighted
            var shouldHighlight = processed.slice(i, i + 4).some((item) => item.shouldHighlight)  

            // add row
            stopRows.push({
                items: processed.slice(i, i + 5),
                shouldHighlight: shouldHighlight && !foundHighlight
            })

            shouldHighlight && (foundHighlight = true); // if we found a highlight, don't highlight any more rows
        }

        setTableRows(stopRows);
    }, [estimate])

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

                { tableRows.map((row, rowIndex) => {
                    
                    // check if row has an item with a color that is not grey or black
                    
                    return (
                        <View 
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                paddingVertical: 8,
                                paddingHorizontal: 8,
                                borderRadius: 8,
                                backgroundColor: row.shouldHighlight ? tintColor+"40" : (rowIndex % 2 == 0 ? "#efefef" : "white"),
                            }}
                            key={rowIndex}
                        >
                            { row.items.map((item, colIndex) => {
                                return (
                                    <View style= {{
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
                                            <MaterialCommunityIcons name="rss" size={12} color={item.color} style={{marginRight: -2, paddingLeft: 1, alignSelf: "flex-start"}} />    
                                        }
                                    </View>
                                )
                            })}
                        </View>
                    )
                })}
                {item.stopTimes.length == 0 && !item.isEndOfRoute && <Text style={{ color: "grey", textAlign:"center" }}>Timetable Unavailable</Text>}
            </View>
        </View>
    );
};

export default Timetable;
