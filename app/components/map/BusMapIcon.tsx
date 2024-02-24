import React from 'react'
import { View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getLighterColor } from 'app/utils';

interface Props {
  heading: number,
  tintColor: string,
  active: boolean
}

// Bus icon thats show on map
const BusMapIcon: React.FC<Props> = ({ heading, tintColor, active }) => {
  // Calculate the rotation angle based on the bearing of the bus
  const getRotationProp = (bearing: number | undefined) => {
    return [{ rotate: bearing !== undefined ? `${Math.round(bearing) - 135}deg` : '0deg' }]
  };

  const borderColor = active ? getLighterColor(tintColor) : undefined;

  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      width: 30,
      height: 30,
      borderTopLeftRadius: 15,
      borderTopRightRadius: 15,
      borderBottomLeftRadius: 15,
      backgroundColor: active ? tintColor : tintColor + "70",
      borderColor: borderColor,
      borderWidth: borderColor ? 2 : 0,
      transform: getRotationProp(heading)
    }}>
      <MaterialCommunityIcons name="bus" size={18} color={active ? "white" : "#ffffffcc"} style={{transform: getRotationProp(-heading-90)}} />
    </View>
  )
}

// Not memoizing this component since the bearing changes when the bus moves
export default BusMapIcon;