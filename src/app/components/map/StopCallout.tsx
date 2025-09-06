import moment from 'moment';
import React, { memo } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { Callout } from 'react-native-maps';
import { lightMode } from 'src/app/theme';
import useAppStore from 'src/data/app_state';
import { Direction, Route, Stop } from 'src/data/datatypes';
import { useStopAmenities, useStopEstimate } from 'src/data/queries/app';
import AmenityRow from '../ui/AmenityRow';
import BusIcon from '../ui/BusIcon';
import CalloutTimeBubble from '../ui/CalloutTimeBubble';

interface Props {
  stop: Stop;
  tintColor: string;
  route: Route;
  direction: Direction;
}

// Stop callout with time bubbles
const StopCallout: React.FC<Props> = ({
  stop,
  tintColor,
  route,
  direction,
}) => {
  const scrollToStop = useAppStore((state) => state.scrollToStop);
  const setSelectedDirection = useAppStore(
    (state) => state.setSelectedDirection,
  );

  const { data: estimates, isLoading } = useStopEstimate(
    route,
    direction,
    stop,
  );

  const { data: amenities } = useStopAmenities(route, direction, stop);

  return (
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
  );
};

export default memo(StopCallout);
