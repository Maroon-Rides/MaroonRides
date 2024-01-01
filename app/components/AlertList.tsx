import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';
import useAppStore from "../stores/useAppStore";
import { FlatList } from "react-native-gesture-handler";

// TODO: Fill in route details with new UI
const AlertList: React.FC = () => {
    const setSheetView = useAppStore((state) => state.setSheetView);
    const alerts = useAppStore((state) => state.mapServiceInterruption);

    return (
        <View>
            <View style={{ flexDirection: "row", alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 32 }}>Alerts</Text>

                <View style={{ flex: 1 }} />

                <TouchableOpacity style={{ alignContent: 'center', justifyContent: 'flex-end' }} onPress={() => setSheetView("routeList")}>
                    <Ionicons name="close-circle" size={32} color="grey" />
                </TouchableOpacity>
            </View>

            {alerts.length === 0 ?
                <View style={{alignItems: 'center'}}>
                    <Text>There are no active alerts at this time.</Text>
                </View>
            : 
                <FlatList
                    data={alerts}
                    keyExtractor={alert => alert.name}
                    style={{height: "100%"}}
                    renderItem={({ item: alert }) => {
                        return (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
                                <Ionicons name="alert-circle" size={32} color="red" style={{ marginRight: 8 }} />
                                <Text style={{flex: 1}}>{alert.name}</Text>
                            </View>
                        )
                    }}
                />

            }

        </View>
    )
}

export default AlertList;