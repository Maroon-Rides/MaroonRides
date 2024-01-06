import React, { useEffect } from 'react';
import { Alert, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GetStopEstimatesResponseSchema, IRouteStopSchedule } from '../../../utils/interfaces';
import BusIcon from './BusIcon';
import { RouteStopSchedule, getStopEstimates } from 'aggie-spirit-api';
import useAppStore from '../../stores/useAppStore';


interface Props {
    item: IRouteStopSchedule
    tintColor: string
    stopCode: string
}

interface TableItem {
    time: string,
    color: string,
    live: boolean,
    shouldHighlight: boolean
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

    useEffect(() => {
        const processed = item.stopTimes.map((time) => {
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

            var shouldHighlight = false;

            let color;
            if (dt! < new Date() && !timeEstimate) {
                color = "grey";
            } else if (timeEstimateIndex == 0) {
                color = tintColor;
                shouldHighlight = true;
            } else {
                color = "black";
                shouldHighlight = true;
            }
            
            return {
                time: ds,
                color: color,
                shouldHighlight: shouldHighlight,
                live: timeEstimate !== undefined
            }
        })

        var stopRows: TableItemRow[] = [];

        var foundHighlight = false;
        // chunk into rows of 3
        for (let i = 0; i < processed.length; i += 4) {   
            var shouldHighlight = processed.slice(i, i + 4).some((item) => item.shouldHighlight)  
            stopRows.push({
                items: processed.slice(i, i + 4),
                shouldHighlight: shouldHighlight && !foundHighlight
            })
            if (shouldHighlight) foundHighlight = true;
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
                marginLeft: 48 + 8,
                marginRight: 24,
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
                                        flexBasis: "25%",
                                        marginLeft: colIndex == 0 ? 16 : 0,
                                        flexDirection: "row",
                                    }}
                                    key={colIndex}>
                                        <Text style={{
                                                color: item.color,
                                                fontWeight: "bold",
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
                {item.stopTimes.length == 0 && !item.isEndOfRoute && <Text style={{ color: "grey" }}>Bus is not scheduled today.</Text>}
            </View>
        </View>
    );
};

export default Timetable;
