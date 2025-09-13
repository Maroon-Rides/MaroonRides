import useAppStore from '@data/state/app_state';
import { Route } from '@data/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { TouchableOpacity } from 'react-native';
import { useAlerts } from 'src/data/queries/app';
import { Sheets, useSheetController } from '../providers/sheet-controller';
import IconPill from './IconPill';

interface Props {
  route: Route;
}

const AlertPill: React.FC<Props> = ({ route }) => {
  const { presentSheet } = useSheetController();
  const theme = useAppStore((state) => state.theme);
  const { data: alerts } = useAlerts(route);

  return (
    <TouchableOpacity onPress={() => presentSheet(Sheets.ALERTS)}>
      <IconPill
        icon={
          <MaterialCommunityIcons
            name={(alerts?.length ?? 0 > 0) ? 'bell-badge' : 'bell-outline'}
            size={16}
            color={theme.text}
          />
        }
        text="Alerts"
      />
    </TouchableOpacity>
  );
};

export default memo(AlertPill);
