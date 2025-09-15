import { useTheme } from '@data/state/utils';
import { RoutePlanMarkedPoint } from '@data/types';
import { getLighterColor } from '@data/utils/utils';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Platform, View } from 'react-native';
import { MapMarker, Marker } from 'react-native-maps';

interface Props {
  marker: RoutePlanMarkedPoint;
}

// Stop marker with callout
const RoutePlanMarker: React.FC<Props> = ({ marker }) => {
  const markerRef = React.useRef<MapMarker>(null);
  const theme = useTheme();

  function getIcon(type: 'point' | 'wait') {
    switch (type) {
      case 'point':
        return <MaterialCommunityIcons name="circle" size={10} color="white" />;
      case 'wait':
        return (
          <Ionicons
            name="time"
            size={16}
            color="white"
            style={{ transform: [{ rotate: '-45deg' }] }}
          />
        );
    }
  }

  return (
    <Marker
      ref={markerRef}
      coordinate={{
        latitude: marker.latitude,
        longitude: marker.longitude,
      }}
      style={[
        Platform.OS === 'android' && {
          height: 72,
          justifyContent: 'center',
          alignItems: 'center',
        },
      ]}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 0.5 }}
      pointerEvents="auto"
    >
      {marker.isOrigin ? (
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            backgroundColor: theme.myLocation,
            borderColor: getLighterColor(theme.myLocation),
            borderWidth: 2,
            borderRadius: 999,
            transform: [{ rotate: '45deg' }],
            zIndex: 800,
            elevation: 800,
          }}
        >
          {getIcon(marker.icon)}
        </View>
      ) : (
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: 30,
            height: 30,
            borderTopLeftRadius: 15,
            borderTopRightRadius: 15,
            borderBottomLeftRadius: 15,
            backgroundColor: theme.error,
            borderColor: getLighterColor(theme.error),
            borderWidth: 2,
            transform: [{ translateY: -20 }, { rotate: '45deg' }],
            zIndex: 800,
            elevation: 800,
          }}
        >
          {getIcon(marker.icon)}
        </View>
      )}
    </Marker>
  );
};

export default memo(RoutePlanMarker);
