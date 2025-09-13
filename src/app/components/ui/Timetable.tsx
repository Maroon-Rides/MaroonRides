import { useTimetableEstimate } from '@data/queries/app';
import useAppStore from '@data/state/app_state';
import { useTheme } from '@data/state/utils';
import { Stop, StopSchedule } from '@data/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import BusIcon from './BusIcon';

interface Props {
  item: StopSchedule;
  stop: Stop;
  tintColor: string;
  dismissBack?: () => void;
}

interface TableItem {
  time: string;
  color: string;
  shouldHighlight: boolean;
  live: boolean;
  cancelled: boolean;
}

interface TableItemRow {
  items: TableItem[];
  shouldHighlight: boolean;
}

const Timetable: React.FC<Props> = ({ item, stop, tintColor, dismissBack }) => {
  const selectedTimetableDate = useAppStore(
    (state) => state.selectedTimetableDate,
  );
  const theme = useTheme();

  const [tableRows, setTableRows] = useState<TableItemRow[]>([]);
  const { data: estimate, isLoading } = useTimetableEstimate(
    stop,
    selectedTimetableDate || moment().toDate(),
  );

  // TODO move this to query
  useEffect(() => {
    if (!estimate) return;

    const now = moment();

    let foundNextStop = false;

    const sliceLength = 5;

    let processed = item.timetable.map((time) => {
      const foundEstimate = estimate?.find(
        (schedule) =>
          schedule.directionName === item.directionName &&
          schedule.routeName === item.routeName,
      );
      const timeEstimateIndex = foundEstimate?.timetable.findIndex(
        (stopTime) => stopTime.tripPointId === time.tripPointId,
      );
      const timeEstimate = foundEstimate?.timetable[timeEstimateIndex!];

      // have to check if it isnt undefined because if it is undefined, moment will default to current time
      const estimatedTime =
        timeEstimate && moment(timeEstimate?.estimatedTime).isValid()
          ? moment(timeEstimate?.estimatedTime)
          : null;
      const scheduledTime = moment(time.scheduledTime);

      // switch to scheduled time if estimated time is invalid
      let departTime = estimatedTime ?? scheduledTime;

      let shouldHighlight = false;
      let color = theme.subtitle;

      // if the time is in the future or realtime, highlight it
      // and the next stop isnt cancelled
      // and the time is in the same day

      if (
        (departTime.isSame(now, 'day') &&
          departTime.diff(now, 'minutes') >= 0) ||
        (timeEstimate?.isRealTime && !timeEstimate?.isCancelled)
      ) {
        color = theme.text;
        shouldHighlight = true;

        if (!foundNextStop) {
          color = tintColor;
          foundNextStop = true;
        }
      }

      return {
        time: departTime.format('h:mm'),
        color: color,
        shouldHighlight: shouldHighlight,
        live: (timeEstimate && timeEstimate.isRealTime) ?? false,
        cancelled: timeEstimate?.isCancelled ?? false,
      };
    });

    const stopRows: TableItemRow[] = [];
    let foundHighlight = false;

    // chunk into rows of 5
    for (let i = 0; i < processed.length; i += sliceLength) {
      // check if any of the items in the row should be highlighted
      let shouldHighlight = processed
        .slice(i, i + sliceLength)
        .some((item) => item.shouldHighlight);

      let row = processed.slice(i, i + sliceLength);

      if (shouldHighlight && !foundHighlight) {
        // set all of the expired items to tint color and 50% opacity
        for (let j = 0; j < row.length; j++) {
          if (row[j]!.color === 'grey') {
            row[j]!.color = tintColor + '80';
          }
        }
      }

      // add row
      stopRows.push({
        items: row,
        shouldHighlight: shouldHighlight && !foundHighlight,
      });

      shouldHighlight && (foundHighlight = true); // if we found a highlight, don't highlight any more rows
    }

    setTableRows(stopRows);
  }, [estimate, selectedTimetableDate]);

  return (
    <View style={{ marginLeft: 16, paddingTop: 8 }}>
      <TouchableOpacity
        onPress={dismissBack}
        disabled={dismissBack === null}
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
      >
        <BusIcon
          name={item.routeNumber}
          color={tintColor}
          style={{ marginRight: 8 }}
        />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{
                fontWeight: 'bold',
                fontSize: 24,
                color: theme.text,
                flexShrink: 1,
              }}
              numberOfLines={1}
            >
              {item.routeName}
            </Text>
            {isLoading && <ActivityIndicator style={{ marginLeft: 8 }} />}
          </View>
          <Text style={{ color: theme.subtitle }}>{item.directionName}</Text>
        </View>
      </TouchableOpacity>

      <View
        style={{
          marginBottom: 8,
        }}
      >
        {tableRows.map((row, rowIndex) => {
          return (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 8,
                borderRadius: 8,
                backgroundColor: row.shouldHighlight
                  ? tintColor + '40'
                  : rowIndex % 2 === 0
                    ? theme.timetableRowB
                    : theme.timetableRowA,
              }}
              key={rowIndex}
            >
              {row.items.map((item, colIndex) => {
                return (
                  <View
                    style={{
                      flexBasis: '20%',
                      justifyContent: 'center',
                      flexDirection: 'row',
                    }}
                    key={colIndex}
                  >
                    <Text
                      style={{
                        color: item.color,
                        fontWeight:
                          item.color === tintColor ? 'bold' : 'normal',
                        fontSize: 16,
                        textDecorationLine: item.cancelled
                          ? 'line-through'
                          : 'none',
                      }}
                    >
                      {item.time}
                    </Text>

                    {item.live && (
                      <MaterialCommunityIcons
                        name="rss"
                        size={12}
                        color={item.color}
                        style={{
                          marginRight: -2,
                          paddingLeft: 1,
                          alignSelf: 'flex-start',
                        }}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
        {item.timetable.length === 0 && !item.isEndOfRoute && (
          <Text style={{ color: 'grey', textAlign: 'center' }}>
            No Timetable for Today
          </Text>
        )}
      </View>
    </View>
  );
};

export default Timetable;
