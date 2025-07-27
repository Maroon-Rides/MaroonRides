import React, { memo } from 'react'
import { View, ViewProps } from 'react-native'
import { IAmenity } from 'utils/interfaces'
import { MaterialCommunityIcons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

interface Props extends ViewProps {
    amenities: IAmenity[]
    color: string
    size: number
}

const AmenityRow: React.FC<Props> = ({amenities, color, size, style}) => {
    if (!amenities) return null;

    return (
          <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, style]}>
            {amenities.map((amenity: IAmenity) => (
                // switch case
                <View key={amenity.name} style={{paddingLeft: 4}}>
                    {amenity.name === "Air Conditioning" && <MaterialCommunityIcons name="air-conditioner" size={size} color={color} />}
                    {amenity.name === "Wheelchair Accessible" && <FontAwesome5 name="wheelchair" size={size-4} color={color} />}
                    {amenity.name === "Wheelchair Lift" && <FontAwesome5 name="wheelchair" size={size-4} color={color} />}
                    {amenity.name === "Bicycle Rack" && <MaterialIcons name="pedal-bike" size={size+4} color={color} />}
                    {amenity.name === "Shelter" && <MaterialCommunityIcons name="bus-stop-covered" size={size} color={color} />}
                </View>
                
            ))}
          </View>
    )
}

export default memo(AmenityRow);