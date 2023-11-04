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

    const [indexToScrollTo, setIndexToScrollTo] = useState(3); //to be implimented
    
    
    function formatTime(date) {
        const hours = date.getHours() % 12 || 12; 
        const minutes = date.getMinutes();
        const amPm = date.getHours() < 12 ? 'AM' : 'PM';
    
        const paddedHours = String(hours).padStart(2, '0');
        const paddedMinutes = String(minutes).padStart(2, '0');
    
        return `${paddedHours}:${paddedMinutes} ${amPm}`;
    }
    


    const currentTime = new Date();

    //attempt to find the row index to highlight
    // Object.keys(timetable[selectedIndex]).forEach((currentData, outerIndex) => {
    //     timetable[selectedIndex][currentData].forEach((innerData, innerIndex) => {
    //         if (innerData < currentTime) {
    //             if(indexToScrollTo==-1){
    //                 setIndexToScrollTo(innerData)
    //             }
    //         }
    //     });
    // });

    
    return (
        <View>
            <SegmentedControl
            values={[stops[stops.length-1], stops[0]]}
            selectedIndex={selectedIndex}
            onChange={(event) => setSelectedIndex(event.nativeEvent.selectedSegmentIndex)}
            />

            <View style={{ flexDirection: "row", paddingTop: 20}}>
                
            </View>           
            <View style={{height: 1, 
                        width: '100%', 
                        backgroundColor: '#F2F2F2',
                        marginTop: 15}} />



<FlatList 
    ref={flatListRef}
    key={`flatlist-${selectedIndex}`}
    style={{ height: flatListHeight-150}}
    data={Object.keys(timetable[selectedIndex])}
    numColumns={Object.keys(timetable[selectedIndex]).length}
    stickyHeaderIndices={[0]}
    ListHeaderComponent={
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {
                Object.keys(timetable[selectedIndex]).map((stop, index) => (
                    <Text 
                        style={{
                            fontWeight: 'bold',
                            flex: 1,
                            textAlign: 'center', // to center the text in its container
                            flexShrink: 1,
                            backgroundColor:'white'
                        }} 
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
    //callback when flatlist is loaded
    // onLayout={flatListRef.current.scrollToIndex(indexToScrollTo)}
    renderItem={({ item: data, index }) => {


        return (
            <View style={{
                flexDirection: 'column',
                flex:1
            }}>
                {timetable[selectedIndex][data].map((data, innerIndex) => (
                    <Text style={{ 
                            color: data > currentTime ? highlightColor : '#707373',
                            paddingTop: 10,
                            paddingBottom: 10,
                            backgroundColor: innerIndex === indexToScrollTo ? highlightColor+'33' : (innerIndex % 2 == 0 ? '#F2F2F2' : 'white'), 
                            textAlign: 'center',
                            flex:1
                        }}
                        key={innerIndex}
                    >
                        {formatTime(data)}
                    </Text>
                ))}
            </View>
        );
         
    }}
    
/>


    </View>
    )
    
                            
}

export default Timetable;