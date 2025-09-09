import { StopSchedule } from '@data/datatypes';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import moment from 'moment-strftime';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

import { appLogger } from '@data/utils/logger';
import useAppStore from 'src/data/app_state';
import { useRoutes, useStopSchedule } from 'src/data/queries/app';
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

  const selectedTimetableDate = useAppStore(
    (state) => state.selectedTimetableDate,
  );
  const setSelectedTimetableDate = useAppStore(
    (state) => state.setSelectedTimetableDate,
  );

  const [showNonRouteSchedules, setShowNonRouteSchedules] =
    useState<boolean>(false);
  const [nonRouteSchedules, setNonRouteSchedules] = useState<
    StopSchedule[] | null
  >(null);
  const [routeSchedules, setRouteSchedules] = useState<StopSchedule[] | null>(
    null,
  );
  const theme = useAppStore((state) => state.theme);

  const { data: routes } = useRoutes();
  const {
    data: stopSchedule,
    isError: scheduleError,
    isLoading: scheduleLoading,
  } = useStopSchedule(
    selectedStop!,
    selectedTimetableDate ?? moment().toDate(),
  );

  const dayDecrement = () => {
    // Decrease the date by one day
    const prevDate = selectedTimetableDate.subtract(1, 'days');
    setRouteSchedules(null);
    setNonRouteSchedules(null);
    setSelectedTimetableDate(prevDate);
  };

  const dayIncrement = () => {
    // Increase the date by one day
    const nextDate = selectedTimetableDate.add(1, 'days');
    setRouteSchedules(null);
    setNonRouteSchedules(null);
    setSelectedTimetableDate(nextDate);
  };

  // TODO move this to a query
  useEffect(() => {
    if (!stopSchedule) return;

    // find the schedules for the selected route
    let routeStops = stopSchedule.filter(
      (schedule) =>
        schedule.routeName === selectedRoute?.name &&
        schedule.routeNumber === selectedRoute?.routeCode,
    );

    // filter anything that is end of route
    routeStops = routeStops.filter((schedule) => !schedule.isEndOfRoute);
    setRouteSchedules(routeStops);

    // filter out non route schedules
    let nonRouteStops = stopSchedule.filter(
      (schedule) =>
        schedule.routeName !== selectedRoute?.name ||
        schedule.routeNumber !== selectedRoute?.routeCode,
    );

    // filter anything that doesnt have stop times
    nonRouteStops = nonRouteStops.filter(
      (schedule) => schedule.timetable.length > 0,
    );
    setNonRouteSchedules(nonRouteStops);
  }, [stopSchedule]);

  function getLineColor(routeCode: string) {
    const route = routes?.find((route) => route.routeCode === routeCode);
    return route?.tintColor ?? theme.text;
  }

  function onDismiss() {
    setRouteSchedules(null);
    setNonRouteSchedules(null);
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
              renderItem={({ item, index }) => {
                return (
                  <View key={index} style={{ flex: 1 }}>
                    <Timetable
                      item={item}
                      stop={selectedStop!}
                      tintColor={getLineColor(item.routeNumber)}
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
                renderItem={({ item, index }) => {
                  return (
                    <View key={index} style={{ flex: 1 }}>
                      <Timetable
                        item={item}
                        stop={selectedStop!}
                        dismissBack={() => {
                          const route = routes!.find(
                            (route) => route.routeCode === item.routeNumber,
                          );

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
                        tintColor={getLineColor(item.routeNumber)}
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
                backgroundColor: getLineColor(selectedRoute!.routeCode),
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
