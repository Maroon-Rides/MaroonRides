import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAlerts } from '@lib/queries/app';
import { useTheme } from '@lib/state/utils';
import { Route } from '@lib/types';
import React, { memo } from 'react';
import { TouchableOpacity } from 'react-native';
import { Sheets, useSheetController } from '../providers/sheet-controller';
import IconPill from './IconPill';

interface Props {
  route: Route;
}

const AlertPill: React.FC<Props> = ({ route }) => {
  const { presentSheet } = useSheetController();
  const theme = useTheme();
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
