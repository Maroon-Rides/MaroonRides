import { Text, View, ScrollView } from "react-native";
import React, { useState, useEffect } from "react";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { ITimetable } from "utils/interfaces";

interface Props {
    timetable: ITimetable;
    highlightColor: string;
}

const Timetable: React.FC<Props> = ({
    timetable,
    highlightColor,
}) => {
    const stops = Object.keys(timetable[0]!);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const [processedTimetable, setProcessedTimetable] = useState<string[][]>(
        processTable(0)
    ); //to be implimented
    const [indexToScrollTo, setIndexToScrollTo] = useState(-1); //to be implimented

    const currentTime = new Date();

    function findHighlight(index: number) {
        var stops = Object.keys(timetable[index]!);
        var numTimes = timetable[index][stops[0]].length;
        let result = 0; // Default value

        // Label for the outer loop
        outerLoop: for (var i = 0; i < numTimes; i++) {
            for (var j = 0; j < stops.length; j++) {
                if (
                    timetable[index][stops[j]][i] > currentTime &&
                    indexToScrollTo === -1 && timetable[index][stops[j]][i] !== null
                ) {
                    result = i;
                    break outerLoop; // Break out of the outer loop
                }
            }
        }

        return result;
    }

    function processTable(index: number) {
        var table = [];

        var numTimes = timetable[index][Object.keys(timetable[index])[0]].length;

        for (var i = 0; i < numTimes; i++) {
            var row: string[] = [];
            Object.keys(timetable[index]).forEach((stop) => {
                row.push(timetable[index][stop][i]);
            });
            table.push(row);
        }

        return table;
    }

    useEffect(() => {
        setProcessedTimetable(processTable(selectedIndex));
        setIndexToScrollTo(findHighlight(selectedIndex));
    }, [selectedIndex]);

    return (
        <View>
            <SegmentedControl
                values={[stops[stops.length - 1]!, stops[0]!]}
                selectedIndex={selectedIndex}
                onChange={(event) => {
                    setSelectedIndex(event.nativeEvent.selectedSegmentIndex);
                    setIndexToScrollTo(-1);
                }}
            />

            <View
                style={{
                    height: 1,
                    width: "100%",
                    backgroundColor: "#F2F2F2",
                    marginTop: 8,
                }}
            />


            <ScrollView>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    {Object.keys(timetable[selectedIndex]!).map((stop, index) => (
                        <Text
                            key={index}
                            style={{
                                flex: 1,
                                textAlign: "center",
                                backgroundColor: "white",
                                paddingVertical: 2,
                            }}
                        >
                            {stop}
                        </Text>
                    ))}
                </View>

                {processedTimetable.map((row, index) => (
                    <View
                        key={index}
                        style={{
                            flexDirection: "row",
                            backgroundColor:
                                index === indexToScrollTo
                                    ? `${highlightColor}33`
                                    : index % 2 === 0
                                        ? "#F2F2F2"
                                        : "white",
                            borderRadius: 8,
                        }}
                    >
                        {row.map((col, innerIndex) => (
                            <Text
                                key={innerIndex}
                                style={{
                                    color:
                                        index === indexToScrollTo
                                            ? (new Date(col) < currentTime 
                                                ? `${highlightColor}77`
                                                : highlightColor)
                                            : new Date(col) > currentTime
                                                ? "black"
                                                : "#707373",
                                    paddingTop: 10,
                                    paddingBottom: 10,
                                    textAlign: "center",
                                    flex: 1,
                                    opacity: col === undefined ? 0 : 1,
                                }}
                            >
                                {col !== null
                                    ? new Date(col).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })
                                    : ""}
                            </Text>
                        ))}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

export default Timetable;
