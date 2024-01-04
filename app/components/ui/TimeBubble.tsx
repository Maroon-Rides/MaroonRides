import React from 'react'
import { View, Text } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
    time: string
    color: string,
    textColor?: string,
    live?: boolean
}

const TimeBubble: React.FC<Props> = ({time, color, textColor, live}) => {
  return (
    <View style={{ backgroundColor: color, borderRadius: 6, alignItems: 'center', justifyContent: "center", alignSelf: 'center', flexDirection: "row", padding: 4, paddingHorizontal: 8, marginRight: 4}}>
        <Text style={{fontSize: 16, textAlign: 'center', fontWeight: '600', color: textColor ?? 'white' }}>
            {time}
        </Text>

        { live && 
          <MaterialCommunityIcons name="rss" size={12} color="white" style={{marginRight: -2, paddingLeft: 1, alignSelf: "flex-start"}} />
        }
    </View>
  )
}

export default TimeBubble;