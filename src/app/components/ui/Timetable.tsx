import { useTimetableEstimate } from '@data/queries/app';
import useAppStore from '@data/state/app_state';
import { useTheme } from '@data/state/utils';
import { Route, Stop, StopSchedule } from '@data/types';
import buildTimetable from '@data/utils/timetable';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import moment from 'moment';
import React, { useMemo } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import BusIcon from './BusIcon';

interface Props {
  fullSchedule: StopSchedule;
  stop: Stop;
  route: Route;
  dismissBack?: () => void;
}

const Timetable: React.FC<Props> = ({
  fullSchedule,
  stop,
  route,
  dismissBack,
}) => {
  const selectedTimetableDate = useAppStore(
    (state) => state.selectedTimetableDate,
  );
  const theme = useTheme();

  const { data: estimates, isLoading } = useTimetableEstimate(
    stop,
    selectedTimetableDate || moment().toDate(),
  );

  const timetable = useMemo(() => {
    return buildTimetable(fullSchedule, estimates, theme);
  }, [fullSchedule, estimates, theme]);

  return (
    <View style={{ marginLeft: 16, paddingTop: 8 }}>
      <TouchableOpacity
        onPress={dismissBack}
        disabled={dismissBack === null}
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
      >
        <BusIcon
          name={fullSchedule.route.routeCode}
          color={route.tintColor}
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
              {fullSchedule.route.name}
            </Text>
            {isLoading && <ActivityIndicator style={{ marginLeft: 8 }} />}
          </View>
          <Text style={{ color: theme.subtitle }}>
            {fullSchedule.direction.name}
          </Text>
        </View>
      </TouchableOpacity>

      <View
        style={{
          marginBottom: 8,
        }}
      >
        {timetable.map((row, rowIndex) => {
          return (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 8,
                borderRadius: 8,
                backgroundColor: row.shouldHighlight
                  ? route.tintColor + '40'
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
                          item.color === route.tintColor ? 'bold' : 'normal',
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
        {fullSchedule.timetable.length === 0 &&
          !fullSchedule.stop && (
            <Text style={{ color: 'grey', textAlign: 'center' }}>
              No Timetable for Today
            </Text>
          )}
      </View>
    </View>
  );
};

export default Timetable;
