import React from 'react'
import { View, Text } from 'react-native'

interface Props {
    title: string,
    icon: any
}

const SheetHeader: React.FC<Props> = ({ title, icon }) => {

    return (
        <View style={{ flexDirection: "row", alignItems: 'center', marginBottom: 8, marginHorizontal: 16}}>
            <Text style={{ fontWeight: 'bold', fontSize: 32}}>{title}</Text>
            <View style={{ flex: 1 }} />
            {icon}
        </View>
    )
}

export default SheetHeader;