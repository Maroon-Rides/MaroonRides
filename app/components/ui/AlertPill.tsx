

import React, { memo, useEffect, useState } from 'react'
import { TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons} from '@expo/vector-icons';
import IconPill from './IconPill'
import useAppStore from '../../data/app_state';
import { useRoutes, useServiceInterruptions } from 'app/data/api_query';

interface Props {
    routeId?: string
}

const AlertPill: React.FC<Props> = ({ routeId }) => {
    const presentSheet = useAppStore((state) => state.presentSheet);
    const theme = useAppStore((state) => state.theme);
    const [alertIcon, setAlertIcon] = useState<"bell-badge" | "bell-outline">("bell-outline");

    const { data: alerts } = useServiceInterruptions();
    const { data: routes } = useRoutes();

    // Update the alert icon when the alerts change
    useEffect(() => {
        if (!alerts) return

        if (!routeId) {
            if (alerts.length > 0) {
                setAlertIcon("bell-badge");
            } else {
                setAlertIcon("bell-outline");
            }
            return;
        }

        // find the route that matches the routeId
        const route = routes?.find((route) => route.key === routeId);
        let activeAlerts = false;

        if (route) {
            for (const direction of route.directionList) {
                if (direction.serviceInterruptionKeys.length > 0) {
                    activeAlerts = true;
                    break;
                }
            }
        }
        
        if ((activeAlerts && route) || (!route && alerts.length > 0)) {
            setAlertIcon("bell-badge");
        } else {
            setAlertIcon("bell-outline");
        }
    }, [alerts, routeId]);

    return (
        <TouchableOpacity onPress={() => presentSheet("alerts")}>

                <IconPill 
                    icon={<MaterialCommunityIcons name={alertIcon} size={16} color={theme.text} />}
                    text="Alerts" 
                />
        </TouchableOpacity>
    )
}

export default memo(AlertPill);