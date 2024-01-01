import React from 'react'
import { View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  heading: number,
  color: string
}

const BusMapIcon: React.FC<Props> = ({ heading, color }) => {
  const getRotationProp = (bearing: number | undefined) => {
    return [{ rotate: bearing !== undefined ? `${Math.round(bearing) - 135}deg` : '0deg' }]
  };
  
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      width: 30,
      height: 30,
      borderTopLeftRadius: 15,
      borderTopRightRadius: 15,
      borderBottomLeftRadius: 15,
      backgroundColor: "#" + color,
      borderColor: "#" + color,
      borderWidth: 2,
      transform: getRotationProp(heading)
    }}>
      <MaterialCommunityIcons name="bus" size={18} color="white" style={{transform: getRotationProp(-heading-90)}} />
    </View>
  )
}

export default BusMapIcon;