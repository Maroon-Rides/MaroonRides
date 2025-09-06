import { IOptionDetail } from '@data/utils/interfaces';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Keyboard, Text, TouchableOpacity, View } from 'react-native';
import useAppStore from 'src/data/app_state';

interface TripPlanCellProps {
  plan: IOptionDetail;
}

const TripPlanCell: React.FC<TripPlanCellProps> = ({ plan }) => {
  const theme = useAppStore((state) => state.theme);
  const setSelectedRoutePlan = useAppStore(
    (state) => state.setSelectedRoutePlan,
  );
  const presentSheet = useAppStore((state) => state.presentSheet);
  const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);

  const relativeTime = (time: number) => {
    const diffMin = Math.floor(time / 60);
    const diffHrs = Math.floor(diffMin / 60);

    if (diffHrs < 1) return `${diffMin} minute${diffMin > 1 ? 's' : ''}`;

    return `${diffHrs}h ${diffMin - diffHrs * 60}m`;
  };

  const isOnOtherDay = () => {
    const now = new Date();
    const nowDay = now.getDate();
    const nowMonth = now.getMonth();
    const nowYear = now.getFullYear();

    const endTime = new Date(plan.endTime * 1000);
    const endTimeDay = endTime.getDate();
    const endTimeMonth = endTime.getMonth();
    const endTimeYear = endTime.getFullYear();

    return (
      nowDay !== endTimeDay ||
      nowMonth !== endTimeMonth ||
      nowYear !== endTimeYear
    );
  };

  const transportationFormat = () => {
    for (const instruction of plan.instructions) {
      if (instruction.className.includes('bus')) {
        return 'bus';
      }
    }
    return 'walking';
  };

  const arrivalDate = () => {
    // get arrival date in format MM/DD/YYYY
    const date = new Date(plan.endTime * 1000);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  return (
    <TouchableOpacity
      style={{
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
      onPress={() => {
        Keyboard.dismiss();
        setSelectedRoutePlan(plan);
        setDrawnRoutes([]);
        presentSheet('tripPlanDetail');
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: theme.secondaryBackground,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {transportationFormat() === 'bus' ? (
          <Ionicons name="bus" size={22} color={theme.subtitle} />
        ) : (
          <Ionicons name="walk" size={22} color={theme.subtitle} />
        )}
      </View>

      <View style={{ flex: 1, marginLeft: 12 }}>
        {/* Title */}
        <Text style={{ color: theme.text, fontSize: 24, fontWeight: 'bold' }}>
          {relativeTime(plan.endTime - plan.startTime)}
        </Text>

        {/* Subtitle */}
        <Text style={{ color: theme.subtitle, fontSize: 14 }}>
          Arrive at {plan.endTimeText}
          {isOnOtherDay() ? ` on ${arrivalDate()}` : ''}
        </Text>
      </View>

      {/* caret */}
      <Ionicons name="chevron-forward" size={24} color={theme.subtitle} />
    </TouchableOpacity>
  );
};

export default TripPlanCell;
