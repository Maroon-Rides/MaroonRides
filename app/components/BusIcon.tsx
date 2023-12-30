import React from 'react'
import { View, Text } from 'react-native'

interface Props {
  name: string
  color: string
  isCallout?: boolean
}

const BusIcon: React.FC<Props> = ({name, color, isCallout=false}) => {
  return (
    <View style={{ backgroundColor: color, borderRadius: 6, marginRight: 16, alignItems: 'center', justifyContent: "center", width: isCallout ? 40 : 48, height: isCallout ? 24 : 40 }}>
        <Text adjustsFontSizeToFit={true} numberOfLines={1} style={{fontSize: 18, textAlign: 'center', fontWeight: 'bold', color: 'white', padding: 4}}>
            {name}
        </Text>
    </View>
  )
}

export default BusIcon;