import React from 'react'
import { View, Text } from 'react-native'

interface Props {
    time: string
    color: string,
    textColor?: string
}

const TimeBubble: React.FC<Props> = ({time, color, textColor}) => {
  return (
    <View style={{ backgroundColor: color, borderRadius: 6, alignItems: 'center', justifyContent: "center", width: 52}}>
        <Text style={{fontSize: 14, textAlign: 'center', fontWeight: '600', color: textColor ?? 'white', padding: 2}}>
            {time}
        </Text>
    </View>
  )
}

export default TimeBubble;