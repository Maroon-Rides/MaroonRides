import { ScrollView, Text, View, FlatList, Dimensions, Switch } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import SegmentedControl from '@react-native-segmented-control/segmented-control';



function Timetable({ timetable, flatListHeight, highlightColor }) {
    // useEffect(() => {
    //     console.log(timetable[1])
    // }, [timetable])
    const stops=Object.keys(timetable[0]);
    const [selectedIndex, setSelectedIndex] = useState(0)
    const flatListRef = useRef(null);

    const [processedTimetable, setProcessedTimetable] = useState<string[][]>(processTable(0)); //to be implimented
    const [indexToScrollTo, setIndexToScrollTo] = useState(-1); //to be implimented

    


    const currentTime = new Date();


    function findHighlight(index): int {
        var stops = Object.keys(timetable[index]);
        var numTimes = timetable[index][stops[0]].length;
        let result = 0;  // Default value
    
        outerLoop:  // Label for the outer loop
        for (var i = 0; i < numTimes; i++) {
            for (var j = 0; j < stops.length; j++) {
                if (timetable[index][stops[j]][i] > currentTime && indexToScrollTo === -1) {
                    result = i;
                    // console.log(result);
                    break outerLoop;  // Break out of the outer loop
                }
            }
        }
    
        return result;
    }
    

    function processTable(index): string[][] {
        var table = [];

        
        var numTimes = timetable[index][Object.keys(timetable[index])[0]].length;
        
        for (var i = 0; i < numTimes; i++) {
            var row: string[] = [];
            Object.keys(timetable[index]).forEach((stop) => {
                row.push(timetable[index][stop][i])
            })
            table.push(row)
        }

        return table;
    }



    useEffect(() => {
        setProcessedTimetable(processTable(selectedIndex))
        setIndexToScrollTo(findHighlight(selectedIndex))
    }, [selectedIndex])
    //convert the table to a 2d array


    // useEffect(() => {
    //     if (flatListRef.current) {
            
    //         flatListRef.current.scrollToIndex({ animated: true, index: indexToScrollTo });
    //     }
    // }, [selectedIndex]); 



    return (
        <View>
            <SegmentedControl
                values={[stops[stops.length-1], stops[0]]}
                selectedIndex={selectedIndex}
                onChange={(event) => {
                    setSelectedIndex(event.nativeEvent.selectedSegmentIndex);
                    setIndexToScrollTo(-1);
                    }}
            />

                  
            <View style={{height: 1, 
                        width: '100%', 
                        backgroundColor: '#F2F2F2',
                        marginTop: 8}} 
            />

            <FlatList 
                ref={flatListRef}
                key={`flatlist-${selectedIndex}`}
                style={{ height: flatListHeight-150}}
                data={processedTimetable}
                stickyHeaderIndices={[0]}
                ListHeaderComponent={
                    <View className='flex-row justify-between'>
                        {
                            Object.keys(timetable[selectedIndex]).map((stop, index) => (
                                <Text 

                                    className="font-bold flex-1 text-center flex-shrink-1 bg-white pb-2 pt-2"
                                    numberOfLines={2} 
                                    ellipsizeMode='tail' 
                                    key={index}
                                >
                                    {stop}
                                </Text>
                            ))
                        }
                    </View>
                }
        
                initialNumToRender={indexToScrollTo + 1}

                renderItem={({ item: row, index }) => {
                    return (
                        <View className='flex-grow flex-row rounded-lg' style={{ backgroundColor: index === indexToScrollTo ? highlightColor+'33' : (index % 2 == 0 ? '#F2F2F2' : 'white')}}>
                            {row.map((col, innerIndex) => (
                                <Text style={{ 
                                        color: index==indexToScrollTo ? highlightColor : (col > currentTime ? 'black' : '#707373'),
                                        paddingTop: 10,
                                        paddingBottom: 10,
                                        textAlign: 'center',
                                        flex:1,
                                        opacity: col===undefined? 0 : 1
                                    }}
                                    key={innerIndex}
                                >
                                    {col!=undefined? col.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'NO DATA'}
                                </Text>
                            ))}
                        </View>
                    );
                    
                }}

                onLayout={() => {
                    flatListRef.current.scrollToIndex({animation: false, index: indexToScrollTo });
                }} 

                onScrollToIndexFailed={() => {
                    setTimeout(() => {
                        flatListRef.current.scrollToIndex({animation: false, index: indexToScrollTo})
                        
                        }, 0); //react native FTW best workaround ever
                        //remove the timeout and it doesn't work
                    }}  
                
                />

        </View>
)}

export default Timetable;