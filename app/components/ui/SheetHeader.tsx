import useAppStore from '../../stores/useAppStore';
import React, { memo } from 'react'
import { View, Text } from 'react-native'

interface Props {
    title: string,
    subtitle?: string,
    icon: any
}

const SheetHeader: React.FC<Props> = ({ title, subtitle, icon }) => {

    const theme = useAppStore((state) => state.theme);

    return (
        <View style={{ marginBottom: 8, marginHorizontal: 16 }}>
            <View style={{ flexDirection: "row", alignItems: 'center'}}>
            <Text style={{ fontWeight: 'bold', fontSize: 32, color: theme.text }}>{title}</Text>
                <View style={{ flex: 1 }} />
                {icon}
            </View>
            { subtitle && <Text style={{ fontSize: 16, color: theme.subtitle }}>{subtitle}</Text>}
        </View>
    )
}

export default memo(SheetHeader);