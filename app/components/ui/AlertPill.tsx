import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useServiceInterruptionsAPI } from 'app/data/queries/api/aggie_spirit';
import { useRouteList } from 'app/data/queries/app';
import React, { memo, useEffect, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import useAppStore from '../../data/app_state';
import IconPill from './IconPill';

interface Props {
  routeId?: string;
  showText?: boolean;
}

const AlertPill: React.FC<Props> = ({ routeId, showText }) => {
  const presentSheet = useAppStore((state) => state.presentSheet);
  const theme = useAppStore((state) => state.theme);
  const [alertIcon, setAlertIcon] = useState<'bell-badge' | 'bell-outline'>(
    'bell-outline',
  );

  const { data: alerts } = useServiceInterruptionsAPI();
  const { data: routes } = useRouteList();

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
    <TouchableOpacity onPress={() => presentSheet('alerts')}>
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
