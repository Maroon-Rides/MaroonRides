import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { memo, useEffect, useState } from 'react';
import { TouchableOpacity } from 'react-native';

import useAppStore from 'src/data/app_state';
import { useServiceInterruptionsAPI } from 'src/data/queries/api/aggie_spirit';
import { useRoutes } from 'src/data/queries/app';
import { Sheets, useSheetController } from '../providers/sheet-controller';
import IconPill from './IconPill';

interface Props {
  routeId?: string;
  showText?: boolean;
}

const AlertPill: React.FC<Props> = ({ routeId, showText }) => {
  const { presentSheet } = useSheetController();
  const theme = useAppStore((state) => state.theme);
  const [alertIcon, setAlertIcon] = useState<'bell-badge' | 'bell-outline'>(
    'bell-outline',
  );

  const { data: alerts } = useServiceInterruptionsAPI();
  const { data: routes } = useRoutes();

  // Update the alert icon when the alerts change
  useEffect(() => {
    if (!alerts) {
      setAlertIcon('bell-outline');
      return;
    }

    // find the route that matches the routeId
    const route = routes?.find((route) => route.id === routeId);
    let activeAlerts = false;

    if (route) {
      // for (const direction of route.directions) {
      //   if (direction.serviceInterruptionKeys.length > 0) {
      //     activeAlerts = true;
      //     break;
      //   }
      // }
    }

    if (activeAlerts && route) {
      setAlertIcon('bell-badge');
    } else {
      setAlertIcon('bell-outline');
    }
  }, [alerts, routeId]);

  return (
    <TouchableOpacity onPress={() => presentSheet(Sheets.ALERTS)}>
      <IconPill
        icon={
          <MaterialCommunityIcons
            name={alertIcon}
            size={16}
            color={theme.text}
          />
        }
        text={showText ? 'Alerts' : ''}
      />
    </TouchableOpacity>
  );
};

export default memo(AlertPill);
