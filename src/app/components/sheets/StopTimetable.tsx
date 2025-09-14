import useAppStore from '@data/state/app_state';
import { useTheme } from '@data/state/utils';
import { appLogger } from '@data/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import moment from 'moment-strftime';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { useStopSchedule } from 'src/data/queries/app';
import { Sheets, useSheetController } from '../providers/sheet-controller';
import DateSelector from '../ui/DateSelector';
import SheetHeader from '../ui/SheetHeader';
import Timetable from '../ui/Timetable';
import BaseSheet, { SheetProps } from './BaseSheet';

// Timtable with upcoming routes
const StopTimetable: React.FC<SheetProps> = ({ sheetRef }) => {
  const selectedStop = useAppStore((state) => state.selectedStop);
  const setSelectedStop = useAppStore((state) => state.setSelectedStop);

  const selectedRoute = useAppStore((state) => state.selectedRoute);
  const setSelectedRoute = useAppStore((state) => state.setSelectedRoute);
  const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);
  const { presentSheet, dismissSheet } = useSheetController();
  const [selectedTimetableDate, setSelectedTimetableDate] = useState(moment());
  const [showNonRouteSchedules, setShowNonRouteSchedules] = useState(false);
  const theme = useTheme();

  const {
    data: stopSchedule,
    isError: scheduleError,
    isLoading: scheduleLoading,
  } = useStopSchedule(selectedStop!, selectedTimetableDate);

  const dayDecrement = () => {
    // Decrease the date by one day
    const prevDate = selectedTimetableDate.subtract(1, 'days');
    setSelectedTimetableDate(prevDate);
  };

  const dayIncrement = () => {
    // Increase the date by one day
    const nextDate = selectedTimetableDate.add(1, 'days');
    setSelectedTimetableDate(nextDate);
  };

  const routeSchedules = useMemo(() => {
    if (!stopSchedule) return null;

    // find the schedules for the selected route
    let routeStops = stopSchedule.filter(
      (schedule) => schedule.route.id === selectedRoute?.id,
    );

    // filter anything that is end of route
    return routeStops.filter((schedule) => !schedule.isEndOfRoute);
  }, [stopSchedule]);

  const nonRouteSchedules = useMemo(() => {
    if (!stopSchedule) return null;

    // filter out non route schedules
    let nonRouteStops = stopSchedule.filter(
      (schedule) => schedule.route.id !== selectedRoute?.id,
    );

    // filter anything that doesnt have stop times
    nonRouteStops = nonRouteStops.filter(
      (schedule) => schedule.timetable.length > 0,
    );

    return nonRouteStops;
  }, [stopSchedule]);

  function onDismiss() {
    setSelectedStop(null);
    setShowNonRouteSchedules(false);
    setSelectedTimetableDate(moment());
  }

  return (
    <BaseSheet
      sheetKey={Sheets.STOP_TIMETABLE}
      sheetRef={sheetRef}
      snapPoints={['25%', '45%', '85%']}
      initialSnapIndex={2}
      onDismiss={onDismiss}
    >
      <View>
        <SheetHeader
          title={selectedStop?.name ?? 'Something went wrong'}
          icon={
            <TouchableOpacity
              style={{ marginLeft: 10 }}
              onPress={() => dismissSheet(Sheets.STOP_TIMETABLE)}
            >
              <Ionicons
                name="close-circle"
                size={28}
                color={theme.exitButton}
              />
            </TouchableOpacity>
          }
        />
        <View
          style={{ height: 1, backgroundColor: theme.divider, marginTop: 8 }}
        />
      </View>

      {scheduleError && (
        <Text
          style={{ textAlign: 'center', marginTop: 10, color: theme.subtitle }}
        >
          Unable to load schedules. Please try again later
        </Text>
      )}

      {!scheduleError && (
        <BottomSheetScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 35, paddingTop: 4 }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
            }}
          >
            <View style={{ flex: 1 }} />
            <DateSelector
              text={selectedTimetableDate.format('dddd, MMM D')}
              leftArrowShown={moment().isBefore(selectedTimetableDate, 'day')}
              onLeftClick={dayDecrement}
              onRightClick={dayIncrement}
            />
            <View style={{ flex: 1 }} />
          </View>

          {scheduleLoading && <ActivityIndicator style={{ marginBottom: 8 }} />}

          {routeSchedules && routeSchedules.length === 0 && (
            <Text
              style={{
                textAlign: 'center',
                marginTop: 10,
                color: theme.subtitle,
              }}
            >
              No scheduled routes for this date
            </Text>
          )}

          {routeSchedules && (
            <FlatList
              data={routeSchedules}
              scrollEnabled={false}
              keyExtractor={(_, index) => index.toString()}
              ItemSeparatorComponent={() => (
                <View
                  style={{
                    height: 1,
                    backgroundColor: theme.divider,
                    marginVertical: 8,
                  }}
                />
              )}
              style={{ marginRight: 16 }}
              renderItem={({ item: schedule }) => {
                return (
                  <View style={{ flex: 1 }}>
                    <Timetable
                      date={selectedTimetableDate}
                      route={schedule.route}
                      fullSchedule={schedule}
                      stop={selectedStop!}
                    />
                  </View>
                );
              }}
            />
          )}

          {showNonRouteSchedules && (
            <View>
              <View
                style={{
                  height: 1,
                  backgroundColor: theme.divider,
                  marginVertical: 8,
                }}
              />
              <FlatList
                data={nonRouteSchedules}
                keyExtractor={(_, index) => index.toString()}
                scrollEnabled={false}
                style={{ marginRight: 16 }}
                ItemSeparatorComponent={() => (
                  <View
                    style={{
                      height: 1,
                      backgroundColor: theme.divider,
                      marginVertical: 8,
                    }}
                  />
                )}
                renderItem={({ item: schedule }) => {
                  return (
                    <View style={{ flex: 1 }}>
                      <Timetable
                        fullSchedule={schedule}
                        route={schedule.route}
                        stop={selectedStop!}
                        date={selectedTimetableDate}
                        dismissBack={() => {
                          const route = schedule.route;
                          if (route) {
                            appLogger.i(
                              `Route selected from timetable: ${route.routeCode} - ${route.name}`,
                            );

                            dismissSheet(Sheets.STOP_TIMETABLE);
                            setSelectedRoute(route);
                            setDrawnRoutes([route]);
                            presentSheet(Sheets.ROUTE_DETAILS);
                          }
                        }}
                      />
                    </View>
                  );
                }}
              />
            </View>
          )}

          {nonRouteSchedules && nonRouteSchedules.length > 0 && (
            // show other routes button
            <TouchableOpacity
              style={{
                padding: 8,
                paddingHorizontal: 16,
                marginHorizontal: 16,
                borderRadius: 8,
                marginTop: 16,
                alignSelf: 'center',
                backgroundColor: selectedRoute!.tintColor,
              }}
              onPress={() => setShowNonRouteSchedules(!showNonRouteSchedules)}
            >
              <Text style={{ color: 'white' }}>
                {showNonRouteSchedules ? 'Hide' : 'Show'} Other Routes
              </Text>
            </TouchableOpacity>
          )}
        </BottomSheetScrollView>
      )}
    </BaseSheet>
  );
};

export default StopTimetable;
