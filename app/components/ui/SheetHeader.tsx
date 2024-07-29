import useAppStore from '../../data/app_state';
import React, { memo } from 'react'
import { View, Text } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler';

interface Props {
    title: string,
    subtitle?: string,
    icon: any,
    onTitlePress?: () => void
}

const SheetHeader: React.FC<Props> = ({ title, subtitle, icon, onTitlePress }) => {

    const theme = useAppStore((state) => state.theme);

    return (
        <View style={{ marginBottom: 8, marginHorizontal: 16 }}>
            <View style={{ flexDirection: "row", alignItems: 'center'}}>

            <TouchableOpacity onPress={onTitlePress} disabled={!onTitlePress}>
                <Text style={{ fontWeight: 'bold', fontSize: 32, color: theme.text}}>{title}</Text>
            </TouchableOpacity>


            <View style={{ flex: 1 }} />
                {icon}
            </View>
            { subtitle && <Text style={{ fontSize: 16, color: theme.subtitle }}>{subtitle}</Text>}
        </View>
    )
}

export default memo(SheetHeader);