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
        { live && 
          <MaterialCommunityIcons name="rss" size={18} color="white" style={{paddingRight: 2}} />
        }
        
        <Text style={{fontSize: 16, textAlign: 'center', fontWeight: '600', color: textColor ?? 'white' }}>
            {time}
        </Text>
    </View>
  )
}

export default TimeBubble;