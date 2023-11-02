import { ActivityIndicator, Text, View, Switch } from 'react-native'
import React, { useState, useEffect } from 'react'


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


function Timetable({ timetable }) {
    // Uncomment to view the incoming data!
    useEffect(() => {
        console.log(Object.keys(timetable[0]))
    }, [timetable])
    
    return (
        <View>
            <ToggleSlider isOn={true} onChange={handleToggle} from={Object.keys(timetable[0])[Object.keys(timetable[0]).length-1]} to={Object.keys(timetable[0])[0]}/>
            <View style={{height: 1, 
                        width: '100%', 
                        backgroundColor: '#F2F2F2',
                        marginTop: 15}} />
            <Text>{'Time table goes here'}</Text>
        </View>
        
    )
}

export default Timetable;