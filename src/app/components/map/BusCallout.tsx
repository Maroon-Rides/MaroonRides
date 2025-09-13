import { Bus, Route } from '@data/types';
import React, { memo } from 'react';
import { Platform, Text, View } from 'react-native';
import { Callout } from 'react-native-maps';
import AmenityRow from '../ui/AmenityRow';
import BusIcon from '../ui/BusIcon';
interface Props {
  bus: Bus;
  route: Route;
}

// Bus callout with amentities
const BusCallout: React.FC<Props> = ({ bus, route }) => {
  return (
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
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
  );
};

export default memo(BusCallout);
