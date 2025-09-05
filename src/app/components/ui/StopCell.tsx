import { MaterialCommunityIcons } from '@expo/vector-icons';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import useAppStore from 'src/data/app_state';
import { Direction, Route, Stop } from 'src/data/datatypes';
import { useStopAmenities, useStopEstimate } from 'src/data/queries/app';
import AmenityRow from './AmenityRow';
import TimeBubble from './TimeBubble';

interface Props {
  stop: Stop;
  route: Route;
  direction: Direction;
  color: string;
  disabled: boolean;
  setSheetPos: (pos: number) => void;
}

const StopCell: React.FC<Props> = ({
  stop,
  route,
  direction,
  color,
  disabled,
  setSheetPos,
}) => {
  const [status, setStatus] = useState('On Time');

  const presentSheet = useAppStore((state) => state.presentSheet);
  const setSelectedStop = useAppStore((state) => state.setSelectedStop);
  const zoomToStopLatLng = useAppStore((state) => state.zoomToStopLatLng);
  const setPoppedUpStopCallout = useAppStore(
    (state) => state.setPoppedUpStopCallout,
  );
  const theme = useAppStore((state) => state.theme);

  const {
    data: stopEstimates,
    isLoading,
    isError,
  } = useStopEstimate(route, direction, stop);

  const { data: stopAmenities } = useStopAmenities(route, direction, stop);

  useEffect(() => {
    if (!stopEstimates) return;

    // this is usually caused by out of date base data
    // therefore refresh the base data
    if (stopEstimates.length === 0) {
      setStatus('Error loading estimates, try again later.');
      return;
    }

    let deviation = 0;

    for (const estimate of stopEstimates) {
      if (!estimate.estimatedTime) continue;
      const delayLength = estimate.estimatedTime.diff(
        estimate.scheduledTime,
        'seconds',
      );

      if (!isNaN(delayLength)) {
        deviation = delayLength;
        break;
      }
    }

    const roundedDeviation = Math.round(deviation / 60);

    if (isLoading) {
      setStatus('Loading');
    } else if (stopEstimates.length === 0) {
      setStatus('No upcoming departures');
    } else if (roundedDeviation > 0) {
      setStatus(
        `${roundedDeviation} ${roundedDeviation > 1 ? 'minutes' : 'minute'} late`,
      );
    } else if (roundedDeviation < 0) {
      setStatus(
        `${Math.abs(roundedDeviation)} ${Math.abs(roundedDeviation) > 1 ? 'minutes' : 'minute'} early`,
      );
    } else {
      setStatus('On time');
    }
  }, [stopEstimates]);

  // when cell is tapped, open the stop timetable
  function toTimetable() {
    setSelectedStop(stop);
    presentSheet('stopTimetable');
  }

  function zoomToStop() {
    // find the gps coordinates of the stop
    setSheetPos(1);
    zoomToStopLatLng(stop.location.latitude, stop.location.longitude);
    setTimeout(() => setPoppedUpStopCallout(stop), 300);
  }

  return (
    <TouchableOpacity style={{ marginTop: 8 }} onPress={zoomToStop}>
      <View style={{ flexDirection: 'row', alignContent: 'flex-start' }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: 'bold',
            width: '75%',
            color: theme.text,
          }}
        >
          {stop.name}
        </Text>
        <View style={{ flex: 1 }} />
        <AmenityRow
          amenities={stopAmenities ?? []}
          size={24}
          color={theme.subtitle}
          style={{ paddingRight: 16, alignSelf: 'flex-start' }}
        />
      </View>

      {isLoading ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: 2,
          }}
        >
          <ActivityIndicator style={{ justifyContent: 'flex-start' }} />
          <View style={{ flex: 1 }} />
        </View>
      ) : (
        <Text style={{ marginBottom: 12, marginTop: 4, color: theme.subtitle }}>
          {isError
            ? 'Unable to load estimates. Please try again later.'
            : status}
        </Text>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginRight: 8,
          marginBottom: 8,
          marginTop: -4,
        }}
      >
        <FlatList
          horizontal
          scrollEnabled={false}
          data={stopEstimates}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item: estimate, index }) => {
            const date = estimate.estimatedTime ?? estimate.scheduledTime;
            const relative = date.diff(moment(), 'minutes');
            return (
              <TimeBubble
                key={`stop-cell-${index}`}
                time={relative <= 0 ? 'Now' : relative.toString() + ' min'}
                color={
                  index === 0
                    ? color + (theme.mode === 'dark' ? '65' : '40')
                    : theme.nextStopBubble
                }
                textColor={
                  index === 0
                    ? theme.mode === 'dark'
                      ? theme.text
                      : color
                    : theme.text
                }
                live={estimate.isRealTime}
              />
            );
          }}
        />

        {/* <View style={{ flex: 1 }} /> */}
        {!disabled && (
          <TouchableOpacity
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              paddingVertical: 4, // increase touch area
              paddingLeft: 8, // increase touch area
            }}
            onPress={toTimetable}
          >
            {/* <MaterialCommunityIcons name="clock-outline" size={20} />                 */}
            <Text
              style={{
                fontSize: 16,
                textAlign: 'center',
                fontWeight: 'bold',
                marginVertical: 4,
                marginLeft: 4,
                marginRight: 2,
                color: color,
              }}
            >
              All
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={color}
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default StopCell;
