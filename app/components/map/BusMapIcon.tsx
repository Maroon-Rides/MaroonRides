import React from 'react'
import { View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  heading: number,
  color: string,
  borderColor?: string,
  iconColor: string
}

// Bus icon thats show on map
const BusMapIcon: React.FC<Props> = ({ heading, color, borderColor, iconColor }) => {
  // Calculate the rotation angle based on the bearing of the bus
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
      backgroundColor: color,
      borderColor: borderColor,
      borderWidth: borderColor ? 2 : 0,
      transform: getRotationProp(heading)
    }}>
      <MaterialCommunityIcons name="bus" size={18} color={iconColor} style={{transform: getRotationProp(-heading-90)}} />
    </View>
  )
}

// Not memoizing this component since the bearing changes when the bus moves
export default BusMapIcon;