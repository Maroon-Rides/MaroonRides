import { getLighterColor } from '@data/utils/utils';
import React, { memo, useEffect } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { Callout, MapMarker, Marker } from 'react-native-maps';

import { useStopAmenities, useStopEstimate } from '@data/queries/app';
import useAppStore from '@data/state/app_state';
import { Direction, Route, Stop } from '@data/types';
import moment from 'moment';
import { lightMode } from 'src/app/theme';
import AmenityRow from '../../ui/AmenityRow';
import BusIcon from '../../ui/BusIcon';
import CalloutTimeBubble from '../../ui/CalloutTimeBubble';

interface Props {
  stop: Stop;
  tintColor: string;
  route: Route;
  direction: Direction;
  isCalloutShown?: boolean;
  active: boolean;
}

// Stop marker with callout
const StopMarker: React.FC<Props> = ({
  stop,
  tintColor,
  route,
  direction,
  isCalloutShown = false,
  active,
}) => {
  const markerRef = React.useRef<MapMarker>(null);
  const setSelectedDirection = useAppStore(
    (state) => state.setSelectedDirection,
  );

  // If the global poppedUpStopCallout is the same as the current stop, show the callout on screen
  useEffect(() => {
    if (isCalloutShown) {
      markerRef.current?.showCallout();
    }
  }, [isCalloutShown]);

  const defaultDirection = () => {
    if (active === false) {
      setSelectedDirection(direction);
    }
  };

  const scrollToStop = useAppStore((state) => state.scrollToStop);

  const { data: estimates, isLoading } = useStopEstimate(
    route,
    direction,
    stop,
  );

  const { data: amenities } = useStopAmenities(route, direction, stop);

  return (
    <Marker
      ref={markerRef}
      coordinate={stop.location}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 0.5 }}
      pointerEvents="auto"
      onPress={() => defaultDirection()}
    >
      <View
        style={{
          width: 16,
          height: 16,
          borderWidth: 2,
          borderRadius: 9999,
          backgroundColor: active ? tintColor : tintColor + '60',
          borderColor: active
            ? getLighterColor(tintColor)
            : getLighterColor(tintColor) + '60',
          zIndex: active ? 700 : 400,
          elevation: active ? 700 : 400,
        }}
      />
      <Callout
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          width: 215,
          height: Platform.OS === 'android' ? 60 + 18 : 60,
          zIndex: 1000,
          elevation: 1000,
        }}
        onPress={() => {
          setSelectedDirection(direction);
          scrollToStop(stop);
        }}
      >
        <View
          style={[
            Platform.OS === 'android' && {
              padding: 4,
            },
          ]}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              alignSelf: 'flex-start',
            }}
          >
            <BusIcon
              name={route.routeCode}
              color={tintColor}
              isCallout={true}
              style={{ marginRight: 8 }}
            />
            <Text
              style={{ flex: 1, fontWeight: 'bold', color: 'black' }}
              numberOfLines={2}
            >
              {stop.name}
            </Text>
            <AmenityRow
              amenities={amenities || []}
              color={lightMode.subtitle}
              size={18}
            />
          </View>

          {isLoading ? (
            <ActivityIndicator style={{ marginTop: 8 }} />
          ) : estimates && estimates.length > 0 ? (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                alignSelf: 'flex-start',
                marginTop: 8,
              }}
            >
              <View style={{ flex: 1 }} />
              {estimates!.map((estimate, index) => {
                const date = estimate.estimatedTime ?? estimate.scheduledTime;
                const relative = date.diff(moment(), 'minutes');
                return (
                  <CalloutTimeBubble
                    key={`stop-callout-${index}`}
                    time={relative <= 0 ? 'Now' : relative.toString() + ' min'}
                    color={
                      index === 0 ? tintColor + '50' : lightMode.nextStopBubble
                    }
                    textColor={index === 0 ? tintColor : lightMode.text}
                    live={estimate.estimatedTime === null ? false : true}
                  />
                );
              })}
              <View style={{ flex: 1 }} />
            </View>
          ) : (
            <Text
              style={{
                marginTop: 8,
                alignSelf: 'center',
                color: lightMode.subtitle,
                fontSize: 12,
              }}
            >
              No upcoming departures
            </Text>
          )}
        </View>
      </Callout>
    </Marker>
  );
};

export default memo(StopMarker);
