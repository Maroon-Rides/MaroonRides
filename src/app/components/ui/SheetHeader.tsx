import useAppStore from '@data/state/app_state';
import React, { memo } from 'react';
import { Dimensions, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

interface Props {
  title: string;
  subtitle?: string;
  icon: any;
  onTitlePress?: () => void;
}

const SheetHeader: React.FC<Props> = ({
  title,
  subtitle,
  icon,
  onTitlePress,
}) => {
  const theme = useAppStore((state) => state.theme);

  const screenWidth = Dimensions.get('window').width;
  return (
    <View
      style={{
        marginBottom: 8,
        marginHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center', // To align icon and text vertically
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <TouchableOpacity
          onPress={onTitlePress}
          disabled={!onTitlePress}
          style={{ flexShrink: 1, flexGrow: 1, marginRight: 10 }}
        >
          <Text
            style={{
              fontWeight: 'bold',
              fontSize: 32,
              color: theme.text,
              maxWidth: screenWidth * 0.75, // Adjust the maxWidth as necessary
            }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          {subtitle && (
            <Text style={{ fontSize: 16, color: theme.subtitle }}>
              {subtitle}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 6 }}>{icon}</View>
    </View>
  );
};

export default memo(SheetHeader);
