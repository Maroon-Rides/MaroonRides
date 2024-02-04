import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';



// Define the types for the props
interface ArrowTextComponentProps {
  text: string;
  showLeftArrow: boolean;
  onLeftClick: () => void;
  onRightClick: () => void;
}

const ArrowTextComponent: React.FC<ArrowTextComponentProps> = ({
  text,
  showLeftArrow,
  onLeftClick,
  onRightClick,
}) => {
    


return (
    <View style={styles.container}>
        {showLeftArrow && (
            <TouchableOpacity onPress={onLeftClick}>
                <Text style={styles.arrow}>{'<'}</Text>
            </TouchableOpacity>
        )}
        <Text style={styles.text}>{text}</Text>
        <TouchableOpacity onPress={onRightClick}>
            <Text style={styles.arrow}>{'>'}</Text>
        </TouchableOpacity>
    </View>
);
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontWeight: 'bold',
    fontSize: 30,
    color: 'gray', 
  },
  text: {
    marginHorizontal: 10,
  },
});

export default ArrowTextComponent;
