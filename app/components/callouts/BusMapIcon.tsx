import { View, Text } from 'react-native'
import React from 'react'
import Ionicons from '@expo/vector-icons/Ionicons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  heading: number,
  color: string
}

const BusMapIcon: React.FC<Props> = ({ heading, color }) => {

  function getRotationProp(bearing: number) {
    return [{rotate: bearing === undefined ? '0deg' : `${Math.round(bearing)-135}deg`}]
    
  }

  function getLighterColor(color: string) {
    // Parse the color components from the input string
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);

    // Increase the brightness of each color component
    const lightenedR = Math.min(r + 100, 255);
    const lightenedG = Math.min(g + 100, 255);
    const lightenedB = Math.min(b + 100, 255);

    // Convert the lightened color components back to a hex string
    const lightenedColor = (
        lightenedR.toString(16).padStart(2, '0') +
        lightenedG.toString(16).padStart(2, '0') +
        lightenedB.toString(16).padStart(2, '0')
    );

    return lightenedColor;
  } 

  return (
    // <View className="w-12 h-12 rounded-full" backgroundColor={color}>
    //     <Text> eafasdfasdf </Text>
    // </View>
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      width: 30,
      height: 30,
      borderTopLeftRadius: 15,
      borderTopRightRadius: 15,
      borderBottomLeftRadius: 15,
      backgroundColor: "#" + color,
      borderColor: "#" + getLighterColor(color),
      borderWidth: 2,
      transform: getRotationProp(heading)
    }}>
      <MaterialCommunityIcons name="bus" size={18} color="white" style={{transform: getRotationProp(-heading-90)}} />
    </View>
  )
}

export default BusMapIcon;