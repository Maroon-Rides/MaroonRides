import React from 'react'
import { View, Text } from 'react-native'

interface Props {
    text?: string
    color: string,
    borderColor?: string,
    textColor?: string,
    icon: any,
    style?: any
}

const IconPill: React.FC<Props> = ({text, color, textColor, borderColor, icon, style}) => {
  return (
    <View style={[{ 
            backgroundColor: color, 
            borderColor: borderColor,
            borderWidth: borderColor ? 1 : 0,
            borderRadius: 1000, 
            alignItems: 'center', 
            justifyContent: "center", 
            flexDirection: 'row',
            paddingHorizontal: 8,
            paddingVertical: 2,
            padding: 4,
        }, style]}>

        {icon}

        { text ?
            <Text 
                adjustsFontSizeToFit={true} 
                numberOfLines={1} 
                style={{
                    fontSize: 16,
                    textAlign: 'center',
                    fontWeight: '600',
                    color: textColor ?? 'white',
                    padding: 4,
                    paddingLeft: 6
                }}>
                {text}
            </Text> : null
        }
    </View>
  )
}

export default IconPill;