import React, { memo } from 'react'
import { View, Text } from 'react-native'
import { Callout } from 'react-native-maps'
import { IAmenity } from '../../../utils/interfaces';
import BusIcon from '../ui/BusIcon'
import AmenityRow from '../ui/AmenityRow';
interface Props {
    directionName: string
    fullPercentage: number
    amenities: IAmenity[]
    tintColor: string
    routeName: string
    busId: string
    speed: number
}

// Bus callout with amentities
const BusCallout: React.FC<Props> = ({ directionName, fullPercentage, amenities, tintColor, routeName, busId, speed }) => {    

    return (
        <Callout
            style={{ zIndex: 1000, elevation: 1000 }}
        >
            <View style={{ width: 165 }}>
                <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    marginBottom: 4 
                }}>
                    <View style={{
                        flexDirection: "row",
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        backgroundColor: "#efefef", 
                        marginRight: 8,
                        borderRadius: 4, 
                    }}>
                        <BusIcon name={routeName} color={tintColor} isCallout={true} />
                        <Text style={{fontSize: 12, marginLeft: 6, marginRight: 4, color: "grey"}}>
                            <Text style={{fontWeight: "bold" }}>ID: </Text>
                            <Text>{busId}</Text>
                        </Text>
                    </View>
                    <View style={{ flex: 1 }} />
                    <AmenityRow amenities={amenities} color="gray" size={20} />
                </View>
                
                { directionName != "" &&
                    <Text style={{ flexDirection: "row", justifyContent: "center", alignSelf: "flex-start" }}>
                        <Text style={{ fontWeight: '700', color: tintColor }}>To: </Text>
                        <Text style={{ fontSize: 14, marginLeft: 2 }}>{directionName}</Text>
                    </Text>
                }
                <View style={{flexDirection: "row", justifyContent: "space-between"}}>
                    <Text style={{ 
                        fontWeight: 'bold',
                        color: '#6B7280',
                        fontSize: 11,
                        lineHeight: 16,
                        marginTop: 4 }}
                    >
                        {fullPercentage}% full
                    </Text>

                    <View style={{
                        backgroundColor: "grey",
                        padding: 2, 
                        paddingHorizontal: 5,
                        borderRadius: 4, 
                    }}>
                        <Text style={{ 
                            fontWeight: 'bold', 
                            color: "white", 
                            fontSize: 10, 
                            lineHeight: 16, 
                        }}>{speed.toFixed(0)} MPH</Text>
                    </View>
                </View>
            </View>
        </Callout>
    )
}

export default memo(BusCallout);