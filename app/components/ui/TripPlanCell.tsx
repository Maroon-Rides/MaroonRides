import { Ionicons } from '@expo/vector-icons';
import useAppStore from 'app/data/app_state';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { IOptionDetail } from 'utils/interfaces';

interface TripPlanCellProps {
    plan: IOptionDetail;
}

const TripPlanCell: React.FC<TripPlanCellProps> = ({ plan }) => {
    const theme = useAppStore((state) => state.theme);
    const setSelectedRoutePlan = useAppStore((state) => state.setSelectedRoutePlan);
    const presentSheet = useAppStore((state) => state.presentSheet);
    const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);

    const relativeTime = (time: number) => {
        const diffMin = Math.floor(time / 60)
        const diffHrs = Math.floor(diffMin / 60)

        if (diffHrs < 1) return `${diffMin} minutes`

        return `${diffHrs}h ${diffMin - (diffHrs * 60)}m`
    }

    const transportationFormat = () => {
        for (const instruction of plan.instructions) {
            if (instruction.className.includes("bus")) {
                return "bus"
            }
        }
        return "walking"
    }

    return (
        <TouchableOpacity 
            style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center' 
            }}
            onPress={() => {
                setSelectedRoutePlan(plan);
                setDrawnRoutes([]);
                presentSheet("tripPlanDetail")
            }}
        >
            <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: theme.secondaryBackground,
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                {
                    transportationFormat() === "bus" ? (
                        <Ionicons name="bus" size={22} color={theme.subtitle} />
                    ) : (
                        <Ionicons name="walk" size={22} color={theme.subtitle} />
                    )
                }
            </View>

            <View style={{flex: 1, marginLeft: 12 }}>
                {/* Title */}
                <Text style={{ color: theme.text, fontSize: 24, fontWeight: "bold" }}>{relativeTime(plan.endTime - plan.startTime)}</Text>

                {/* Subtitle */}
                <Text style={{ color: theme.subtitle, fontSize: 14 }}>Arrive at {plan.endTimeText}</Text>
            </View>

            {/* caret */}
            <Ionicons name="chevron-forward" size={24} color={theme.subtitle} />
        </TouchableOpacity>
    );
};

export default TripPlanCell;