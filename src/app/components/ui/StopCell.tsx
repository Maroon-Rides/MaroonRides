import { MaterialCommunityIcons } from '@expo/vector-icons';
import moment from 'moment';
import React, { useMemo } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { useStopAmenities, useStopEstimate } from '@lib/queries/app';
import useAppStore from '@lib/state/app_state';
import { useTheme } from '@lib/state/utils';
import { Direction, Route, Stop } from '@lib/types';
import { Sheets, useSheetController } from '../providers/sheet-controller';
import AmenityRow from './AmenityRow';
import TimeBubble from './TimeBubble';

interface Props {
  stop: Stop;
  route: Route;
  direction: Direction;
  color: string;
  hasTimetable: boolean;
  setSheetPos: (pos: number) => void;
}

const StopCell: React.FC<Props> = ({
  stop,
  route,
  direction,
  color,
  hasTimetable,
  setSheetPos,
}) => {
  const setSelectedStop = useAppStore((state) => state.setSelectedStop);
  const zoomToStopLatLng = useAppStore((state) => state.zoomToStopLatLng);
  const setPoppedUpStopCallout = useAppStore(
    (state) => state.setPoppedUpStopCallout,
  );
  const theme = useTheme();
  const { presentSheet } = useSheetController();

  const {
    data: stopEstimates,
    isLoading,
    isError,
  } = useStopEstimate(route, direction, stop);

  const { data: stopAmenities } = useStopAmenities(route, direction, stop);

  const status = useMemo(() => {
    if (!stopEstimates || stopEstimates.length === 0) {
      return 'No upcoming departures';
    }

    const firstEstimate = stopEstimates.find(
      (estimate) => estimate.estimatedTime,
    );
    if (!firstEstimate?.estimatedTime) {
      return 'On time';
    }

    const deviationMinutes = Math.round(
      firstEstimate.estimatedTime.diff(firstEstimate.scheduledTime, 'minutes'),
    );

    if (deviationMinutes === 0) {
      return 'On time';
    }

    const isLate = deviationMinutes > 0;
    const absDeviation = Math.abs(deviationMinutes);
    const minuteText = absDeviation === 1 ? 'minute' : 'minutes';
    const statusText = isLate ? 'late' : 'early';

    return `${absDeviation} ${minuteText} ${statusText}`;
  }, [stopEstimates, isLoading]);

  // when cell is tapped, open the stop timetable
  function openTimetable() {
    setSelectedStop(stop);
    presentSheet(Sheets.STOP_TIMETABLE);
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
        {hasTimetable && (
          <TouchableOpacity
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              paddingVertical: 4, // increase touch area
              paddingLeft: 8, // increase touch area
            }}
            onPress={openTimetable}
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
