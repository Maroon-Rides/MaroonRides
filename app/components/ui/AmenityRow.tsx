import {
  FontAwesome5,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import { Amenity } from 'app/data/datatypes';
import React, { memo, ReactElement } from 'react';
import { View, ViewProps } from 'react-native';

interface Props extends ViewProps {
  amenities: Amenity[];
  color: string;
  size: number;
}

const AmenityRow: React.FC<Props> = ({ amenities, color, size, style }) => {
  if (!amenities) return null;

  function getIcon(amenity: Amenity): ReactElement | null {
    switch (amenity) {
      case Amenity.AIR_CONDITIONING:
        return (
          <MaterialCommunityIcons
            name="air-conditioner"
            size={size}
            color={color}
          />
        );
      case Amenity.WHEELCHAIR_ACCESSIBLE:
        return <FontAwesome5 name="wheelchair" size={size - 4} color={color} />;
      case Amenity.WHEELCHAIR_LIFT:
        return <FontAwesome5 name="wheelchair" size={size - 4} color={color} />;
      case Amenity.BICYCLE_RACK:
        return (
          <MaterialIcons name="pedal-bike" size={size + 4} color={color} />
        );
      case Amenity.SHELTER:
        return (
          <MaterialCommunityIcons
            name="bus-stop"
            size={size + 4}
            color={color}
          />
        );
      default:
        return null;
    }
  }

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {amenities.map((amenity) => (
        <View key={amenity.valueOf()} style={{ paddingLeft: 4 }}>
          {getIcon(amenity)}
        </View>
      ))}
    </View>
  );
};

export default memo(AmenityRow);
