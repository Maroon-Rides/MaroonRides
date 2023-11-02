import { ActivityIndicator, Text, View, FlatList, Platform, Switch } from 'react-native'
import React, { useState, useRef } from 'react'

const ToggleSlider = ({ isOn, onChange, from, to }) => {
    const [state, setState] = useState(isOn);
  
    const toggleSwitch = (newValue) => {
      setState(newValue);
      onChange(newValue);
    };
  
    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        // transform: [{ scaleX: 1.5}, {scaleY: 1.5}]
    }}>
        <Text style={{marginRight: 10}}>{from}</Text>

        <Switch 
            value={state}
            onValueChange={toggleSwitch}
            trackColor={{ false: '#ffffff', true: 'gray'}}
            thumbColor={state ? 'white' : 'gray'}

        />
        
        <Text style={{marginLeft: 10}}>{to}</Text>

      </View>
    );
  };

const handleToggle = (state) => {
    console.log("Button state is now:", state ? "On" : "Off");
};

function Timetable({ timetable, flatListHeight, highlightColor }) {
    const stops=Object.keys(timetable[0]);
    timetable=timetable[0];
    
    const renderHeaders = () => {
        return (
            <View style={{ flexDirection: 'row', justifyContent: 'space-around'}}>
                {stops.map((stop, index) => (
                    <Text style={{ fontWeight: 'bold', marginRight: 20 }} key={index}>
                        {stop}
                    </Text>
                ))}
            </View>
        );
    };
    

    const generateRowData = () => {
        const maxRowCount = Math.max(...stops.map(stop => timetable[stop].length));
        const rows = [];
        for (let i = 0; i < maxRowCount; i++) {
            const row = {};
            stops.forEach(stop => {
                row[stop] = timetable[stop][i] || null; // null for missing values
            });
            rows.push(row);
        }
        return rows;
    };

    function formatTime(date) {
        const hours = date.getHours() % 12 || 12; // Convert to 12-hour format and use 12 for midnight
        const minutes = date.getMinutes();
        const amPm = date.getHours() < 12 ? 'AM' : 'PM';
    
        const paddedHours = String(hours).padStart(2, '0');
        const paddedMinutes = String(minutes).padStart(2, '0');
    
        return `${paddedHours}:${paddedMinutes} ${amPm}`;
    }
    
    const rowData = generateRowData();

    const currentTime = new Date();
    return (
        // <View>
        //     <FlatList
        //         style={{ height: flatListHeight-70 }}
        //         data={rowData}
        //         keyExtractor={(item, index) => index.toString()}
        //         renderItem={({ item: row, index: rowIndex }) => {
          
        //             return(
        //             <View style={{flexDirection: 'row',
        //                 alignItems: 'center', 
        //                 justifyContent: 'space-between', 
        //                 // backgroundColor: rowIndex % 2 === 0 ? '#F2F2F2' : 'white',
        //                 backgroundColor: rowIndex%2==0? '#F2F2F2':'white',
        //                 paddingTop: 5,
        //                 paddingBottom: 5 }}>
                     
        //                 {stops.map((stop, colIndex) => (
        //                     <View key={colIndex} style={{ flexDirection: 'column', alignItems: 'center'}}>

        //                             <Text style={{color: row[stop] && row[stop] > currentTime ? 'black' : '#707373', 
        //                                           opacity: row[stop]==null? 0:1,
        //                                           fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        //                                           fontSize: 15, }}>
        //                                 {row[stop] == null? '12345678': (formatTime(row[stop]))}
        //                             </Text>
        //                     </View>
        //                 ))}
        //             </View>
        //         )}}
        //     />
        // </View>
        <View>
            {/* <View style={{flexDirection:"row"}}>
                
                {stops.map((stop, index) => (
                    <Text style={{fontWeight: 'bold', flex:1}} key={index}>{stop}</Text>
                ))}
            </View> */}
            <ToggleSlider isOn={true} onChange={handleToggle} from={Object.keys(timetable)[Object.keys(timetable).length-1]} to={Object.keys(timetable)[0]}/>
            <View style={{height: 1, 
                        width: '100%', 
                        backgroundColor: '#F2F2F2',
                        marginTop: 15}} />

            <FlatList style={{ height: flatListHeight-70}}
        
                data={stops}
                numColumns={stops.length}
                ListHeaderComponent={renderHeaders()}

                renderItem={({ item: data, index }) => (

                    <View style={{flexDirection: 'column', alignItems: 'center', flex:1, justifyContent:"flex-end"}}>
                        {/* <Text style={{fontWeight: 'bold', marginRight: 20, opacity: 1}} >{data}</Text> */}
                        {timetable[data].map((data, index) => (
                                <Text style={{ 
                                            color: data > currentTime ? 'black' : '#707373',
                                            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                                            paddingTop:10,
                                            paddingBottom:10}}
                                    key={index}>{formatTime(data)}</Text>
                        ))}
                    </View>
                )}
                
            />
    </View>
    )
    
                            
}

export default Timetable;