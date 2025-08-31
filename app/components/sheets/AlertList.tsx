import React, { memo, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomSheetModal, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import Ionicons from '@expo/vector-icons/Ionicons';

import useAppStore from '../../data/app_state';
import SheetHeader from '../ui/SheetHeader';
import { IMapRoute, IMapServiceInterruption } from 'utils/interfaces';
import { useServiceInterruptions } from 'app/data/api_query';
import { SheetProps } from 'app/utils';

// AlertList (for all routes and current route)
const AlertList: React.FC<SheetProps> = ({ sheetRef }) => {
  const snapPoints = ['25%', '45%', '85%'];
  const [snap, _] = useState(1);

  const theme = useAppStore((state) => state.theme);
  const selectedRoute = useAppStore((state) => state.selectedRoute);
  const setSelectedRoute = useAppStore((state) => state.setSelectedRoute);
  const setSelectedRouteDirection = useAppStore(
    (state) => state.setSelectedRouteDirection,
  );
  const setOldSelectedRoute = useAppStore((state) => state.setOldSelectedRoute);
  const presentSheet = useAppStore((state) => state.presentSheet);
  const setSelectedAlert = useAppStore((state) => state.setSelectedAlert);
  const dismissSheet = useAppStore((state) => state.dismissSheet);

  const [shownAlerts, setShownAlerts] = useState<IMapServiceInterruption[]>([]);

  const { data: alerts, isError } = useServiceInterruptions();

  // If no route is selected, we're looking at all routes, therefore show all alerts
  // If a route is selected, only show the alerts for that route
  useEffect(() => {
    if (!alerts) {
      setShownAlerts([]);
      return;
    }

    if (!selectedRoute) {
      setShownAlerts(alerts);
      return;
    }

    const alertKeys = selectedRoute.directionList.flatMap(
      (direction) => direction.serviceInterruptionKeys,
    );
    const filteredAlerts = alerts.filter((alert) =>
      alertKeys.includes(Number(alert.key)),
    );

    setShownAlerts(filteredAlerts);
  }, [selectedRoute, alerts]);

  const displayDetailAlert = (alert: IMapServiceInterruption) => {
    setSelectedAlert(alert);
    presentSheet('alertsDetail');
  };

  const handleDismiss = () => {
    dismissSheet('alerts');
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      index={snap}
      backgroundStyle={{ backgroundColor: theme.background }}
      handleIndicatorStyle={{ backgroundColor: theme.divider }}
      enablePanDownToClose={false}
      enableDynamicSizing={false}
    >
      <View>
        {/* header */}
        <SheetHeader
          title="Alerts"
          subtitle={selectedRoute ? selectedRoute.name : 'All Routes'}
          icon={
            <TouchableOpacity
              style={{ marginLeft: 10 }}
              onPress={() => handleDismiss()}
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

        {isError ? (
          <View style={{ alignItems: 'center', paddingTop: 16 }}>
            <Text style={{ color: theme.subtitle }}>
              Error loading alerts. Please try again later.
            </Text>
          </View>
        ) : (
          shownAlerts.length === 0 && (
            <View style={{ alignItems: 'center', paddingTop: 16 }}>
              <Text style={{ color: theme.subtitle }}>
                There are no active alerts at this time.
              </Text>
            </View>
          )
        )}
      </View>

      <BottomSheetFlatList
        data={shownAlerts.filter(
          (obj, index, self) =>
            self.findIndex((o) => o.name === obj.name) === index,
        )}
        keyExtractor={(alert) => alert.key}
        style={{ height: '100%', marginLeft: 16, paddingTop: 8 }}
        contentContainerStyle={{ paddingBottom: 35, paddingRight: 16 }}
        renderItem={({ item: alert }) => {
          return (
            <TouchableOpacity
              onPress={() => {
                const selectedRouteCopy = selectedRoute as IMapRoute;
                setOldSelectedRoute(selectedRouteCopy); // Will be referenced again when dismissing AlertDetail sheet
                setSelectedRoute(null);
                setSelectedRouteDirection(null);
                displayDetailAlert(alert);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 4,
                backgroundColor: theme.secondaryBackground,
                padding: 8,
                borderRadius: 8,
              }}
            >
              <Ionicons
                name="warning"
                size={32}
                color={theme.alertSymbol}
                style={{ marginRight: 8 }}
              />
              <Text style={{ flex: 1, color: theme.text }}>{alert.name}</Text>
              <Ionicons name="chevron-forward" size={24} color="grey" />
            </TouchableOpacity>
          );
        }}
      />
    </BottomSheetModal>
  );
};

export default memo(AlertList);
