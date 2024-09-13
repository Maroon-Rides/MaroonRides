import useAppStore from '../../data/app_state'
import React, { memo } from 'react'
import { View, Text, ViewProps } from 'react-native'

interface Props extends ViewProps {
    text?: string
    icon: React.ReactNode
}

const IconPill: React.FC<Props> = ({text, icon, style}) => {
    const theme = useAppStore((state) => state.theme);

    return (
        <View         
            style={[{ 
                // backgroundColor: color, 
                borderColor: theme.pillBorder,
                borderWidth: 1,
                borderRadius: 1000, 
                alignItems: 'center', 
                justifyContent: "center", 
                alignContent: "center",
                flexDirection: 'row',
                paddingHorizontal: 8,
                paddingVertical: 2,
                padding: 4,
                height: 34
            }, style]}>

            {icon}

            { text ?
                <Text 
                    adjustsFontSizeToFit={true} 
                    numberOfLines={1} 
                    minimumFontScale={1}
                    style={{
                        fontSize: 16,
                        textAlign: 'center',
                        fontWeight: '600',
                        color: theme.text,
                        paddingRight: 4,
                        paddingLeft: 6,
                    }}>
                    {text}
                </Text>
            : <View style={{height: 18, marginVertical: 5}} />
            }
        </View>
    )
}

export default memo(IconPill);