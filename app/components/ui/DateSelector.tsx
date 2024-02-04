import { Ionicons } from '@expo/vector-icons';
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
  return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#efefef',
        marginTop: 8,
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 8,
      }}>
          {leftArrowShown ? (
              <TouchableOpacity onPress={onLeftClick}>
                <Ionicons name="chevron-back" size={24} color="black" />
              </TouchableOpacity>
          ) : (
              <View style={{width: 26}} />
          )}

          <Text style={{paddingHorizontal: 16}}>{text}</Text>
          
          <TouchableOpacity onPress={onRightClick}>
            <Ionicons name="chevron-forward" size={24} color="black" />
          </TouchableOpacity>
      </View>
  );
};


export default DateSelector;
