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
        <View style={{ marginBottom: 8, marginHorizontal: 16, flexDirection: "row", justifyContent: "space-between", alignContent: "center"}}>
            <TouchableOpacity onPress={onTitlePress} disabled={!onTitlePress} >
                <Text style={{ fontWeight: 'bold', fontSize: 32, color: theme.text}}>{title}</Text>
                { subtitle && <Text style={{ fontSize: 16, color: theme.subtitle }}>{subtitle}</Text>}
            </TouchableOpacity>

            <View style={{marginTop: 6}}>
                {icon}
            </View>
        </View>
    )
}

export default memo(SheetHeader);