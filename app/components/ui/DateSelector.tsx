import { Ionicons } from '@expo/vector-icons';
import useAppStore from '../../data/app_state';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';



// Define the types for the props
interface DateSelectorComponentProps {
  text: string;
  leftArrowShown: boolean;
  onLeftClick: () => void;
  onRightClick: () => void;
}

const DateSelector: React.FC<DateSelectorComponentProps> = ({ text, leftArrowShown, onLeftClick, onRightClick }) => {
  const theme = useAppStore((state) => state.theme);

  return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.secondaryBackground,
        marginTop: 8,
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 8,
      }}>
          {leftArrowShown ? (
              <TouchableOpacity onPress={onLeftClick}>
                <Ionicons name="chevron-back" size={24} color={theme.text} />
              </TouchableOpacity>
          ) : (
              <View style={{width: 26}} />
          )}

          <Text style={{paddingHorizontal: 16, color: theme.text}}>{text}</Text>
          
          <TouchableOpacity onPress={onRightClick}>
            <Ionicons name="chevron-forward" size={24} color={theme.text} />
          </TouchableOpacity>
      </View>
  );
};


export default DateSelector;
