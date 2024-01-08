import React from 'react'
import { View, Text } from 'react-native'
import { Callout } from 'react-native-maps'
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IVehicle } from '../../../utils/interfaces';
import BusIcon from '../ui/BusIcon'
import AmenityRow from '../ui/AmenityRow';
interface Props {
    bus: IVehicle
    tintColor: string
    routeName: string
}

// Bus callout with amentities
const BusCallout: React.FC<Props> = ({ bus, tintColor, routeName }) => {
    // Calculate and round the percentage of the bus that's full
    const calcFullPercentage = (passengersOnboard: number, passengerCapacity: number) => {
        return Math.round(passengersOnboard / passengerCapacity)
    }

    return (
        <Callout>
            <View style={{ width: 160 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                    <BusIcon name={routeName} color={tintColor} isCallout={true} />
                    <View style={{ flex: 1 }} />
                    <AmenityRow amenities={bus.amenities} color={"gray"} size={20} />
                </View>
                <View style={{flexDirection: "row", justifyContent: "center", alignSelf: "flex-start"}}>
                    <MaterialCommunityIcons name="sign-direction" size={16} color={tintColor} />
                    <Text style={{ fontSize: 14, marginLeft: 2 }}>{bus.directionName}</Text>
                </View>
                <Text style={{ fontWeight: 'bold', color: '#6B7280', fontSize: 10, lineHeight: 16, marginTop: 4 }}>{calcFullPercentage(bus.passengersOnboard, bus.passengerCapacity)}% full</Text>
            </View>
        </Callout>
    )
}

export default BusCallout;