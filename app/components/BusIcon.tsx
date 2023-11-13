import { View, Text } from 'react-native'
import React from 'react'

interface Props {
  sizing: string
  textSize: number
  name: string
  color: string
}

const BusIcon: React.FC<Props> = ({sizing, textSize, name, color}) => {
  return (
    <View className={"rounded-lg mr-4 content-center justify-center " + sizing} style={{backgroundColor: "#" + color}}>
        <Text 
            adjustsFontSizeToFit={true} 
            numberOfLines={1}
            className="text-center font-bold text-white p-1"
            style={{fontSize: textSize}} // this must be used, nativewind is broken :(
        >
            {name}
        </Text>
    </View>
  )
}

export default BusIcon;