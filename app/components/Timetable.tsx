import { ActivityIndicator, Text, View } from 'react-native'
import React, { useEffect } from 'react'

function Timetable({ timetable }) {
    // Uncomment to view the incoming data!
    // useEffect(() => {
    //     console.log(timetable)
    // }, [timetable])

    return (
        <View>
            <Text>{Object.keys(timetable[0])}</Text>
        </View>
        
    )
}

export default Timetable;