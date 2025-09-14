import useAppStore from '@data/state/app_state';
import { Bus, Route } from '@data/types';
import React, { memo } from 'react';
import { Platform, Text, View } from 'react-native';
import { Callout, Marker } from 'react-native-maps';
import AmenityRow from '../../ui/AmenityRow';
import BusIcon from '../../ui/BusIcon';
import BusMapIcon from '../mapIcons/BusMapIcon';

interface Props {
  bus: Bus;
  route: Route;
}

// Bus Marker with icon and callout
const BusMarker: React.FC<Props> = ({ bus, route }) => {
  const selectedDirection = useAppStore((state) => state.selectedDirection);

  const setSelectedDirection = useAppStore(
    (state) => state.setSelectedDirection,
  );

  //if direction is not selected and route is inactive, then call setSelectedDirection w/ parameter bus.directionKey
  const busDefaultDirection = () => {
    if (selectedDirection?.id !== bus.direction.id) {
      setSelectedDirection(bus.direction);
    }
  };

  return (
    <Marker
      key={`bus-marker-${bus.id}`}
      coordinate={{
        latitude: bus.location.latitude,
        longitude: bus.location.longitude,
      }}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 0.5 }}
      pointerEvents="auto"
      style={[
        { zIndex: 100, elevation: 100 },

        Platform.OS === 'android' && {
          width: 42,
          height: 42,
          justifyContent: 'center',
          alignItems: 'center',
        },
      ]}
      onPress={() => busDefaultDirection()}
    >
      {/* Bus Icon on Map*/}
      <BusMapIcon
        bus={bus}
        route={route}
        selectedDirection={selectedDirection}
      />

      <Callout style={{ zIndex: 1000, elevation: 1000 }}>
        <View
          style={[
            { width: 170 },
            Platform.OS === 'android' && {
              padding: 4,
              paddingVertical: 8,
            },
          ]}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              paddingBottom: 4,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#efefef',
                marginRight: 8,
                borderRadius: 4,
              }}
            >
              <BusIcon
                name={route.routeCode}
                color={route.tintColor}
                isCallout={true}
              />
              <Text
                style={{
                  fontSize: 12,
                  marginLeft: 6,
                  marginRight: 4,
                  color: 'grey',
                }}
              >
                {bus.name}
              </Text>
            </View>
            <View style={{ flex: 1 }} />
            <AmenityRow amenities={bus.amenities} color="gray" size={20} />
          </View>

          {!!bus.direction && !bus.direction.isOnlyDirection && (
            <Text
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignSelf: 'flex-start',
                marginBottom: 4,
                marginTop: 2,
              }}
            >
              <Text style={{ fontWeight: '700', color: route.tintColor }}>
                To:{' '}
              </Text>
              <Text style={{ fontSize: 14, marginLeft: 2, color: 'black' }}>
                {bus.direction?.name}
              </Text>
            </Text>
          )}
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <Text
              style={{
                fontWeight: 'bold',
                color: '#6B7280',
                fontSize: 11,
                marginTop: 4,
              }}
            >
              {bus.capacity}% Full
            </Text>

            <Text
              style={{
                fontWeight: 'bold',
                color: '#6B7280',
                fontSize: 11,
                marginTop: 4,
              }}
            >
              {bus.speed.toFixed(0)} MPH
            </Text>
          </View>
        </View>
      </Callout>
    </Marker>
  );
};

export default memo(BusMarker);
