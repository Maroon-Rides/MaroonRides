import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useAlerts } from '@lib/queries/app';
import useAppStore from '@lib/state/app_state';
import { useTheme } from '@lib/state/utils';
import { Alert } from '@lib/types';
import { appLogger } from '@lib/utils/logger';
import React, { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Sheets, useSheetController } from '../providers/sheet-controller';
import SheetHeader from '../ui/SheetHeader';
import BaseSheet, { SheetProps } from './BaseSheet';

// AlertList (for all routes and current route)
const AlertList: React.FC<SheetProps> = ({ sheetRef }) => {
  const theme = useTheme();
  const selectedRoute = useAppStore((state) => state.selectedRoute);
  const setSelectedRoute = useAppStore((state) => state.setSelectedRoute);
  const setSelectedDirection = useAppStore(
    (state) => state.setSelectedDirection,
  );
  const setSelectedAlert = useAppStore((state) => state.setSelectedAlert);
  const { dismissSheet, presentSheet } = useSheetController();

  const { data: alerts, isError } = useAlerts(selectedRoute);

  const displayDetailAlert = (alert: Alert) => {
    setSelectedAlert(alert);
    presentSheet(Sheets.ALERTS_DETAIL);
  };

  const handleDismiss = () => {
    dismissSheet(Sheets.ALERTS);
  };

  function selectAlert(alert: Alert) {
    appLogger.i(`Loading alert details for: ${alert.title}`);
    setSelectedRoute(null);
    setSelectedDirection(null);
    displayDetailAlert(alert);
  }

  return (
    <BaseSheet
      sheetKey={Sheets.ALERTS}
      sheetRef={sheetRef}
      snapPoints={['25%', '45%', '85%']}
      initialSnapIndex={1}
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
          alerts?.length === 0 && (
            <View style={{ alignItems: 'center', paddingTop: 16 }}>
              <Text style={{ color: theme.subtitle }}>
                There are no active alerts at this time.
              </Text>
            </View>
          )
        )}
      </View>

      <BottomSheetFlatList
        data={alerts}
        keyExtractor={(alert) => alert.id}
        style={{ height: '100%', marginLeft: 16, paddingTop: 8 }}
        contentContainerStyle={{ paddingBottom: 35, paddingRight: 16 }}
        renderItem={({ item: alert }) => {
          return (
            <TouchableOpacity
              onPress={() => selectAlert(alert)}
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
              <Text style={{ flex: 1, color: theme.text }}>{alert.title}</Text>
              <Ionicons name="chevron-forward" size={24} color="grey" />
            </TouchableOpacity>
          );
        }}
      />
    </BaseSheet>
  );
};

export default memo(AlertList);
