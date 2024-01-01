import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';
import useAppStore from "../../stores/useAppStore";
import { FlatList } from "react-native-gesture-handler";
import SheetHeader from "../ui/SheetHeader";

// TODO: Fill in route details with new UI
const AlertList: React.FC = () => {
    const setSheetView = useAppStore((state) => state.setSheetView);
    const alerts = useAppStore((state) => state.mapServiceInterruption);

    return (
        <View>
            {/* header */}
            <SheetHeader
                title="Alerts"
                icon={
                    <TouchableOpacity style={{ marginLeft: 10 }} onPress={() => setSheetView("routeList")}>
                        <Ionicons name="close-circle" size={28} color="grey" />
                    </TouchableOpacity>
                }
            />

            {/* list */}
            {alerts.length === 0 ?
                <View style={{alignItems: 'center'}}>
                    <Text>There are no active alerts at this time.</Text>
                </View>
            : 
                <FlatList
                    data={alerts}
                    keyExtractor={alert => alert.name}
                    style={{ height: "100%", marginLeft: 16 }}
                    contentContainerStyle={{ paddingBottom: 30, paddingRight: 16 }}
                    renderItem={({ item: alert }) => {
                        return (
                            <View style={{ 
                                flexDirection: 'row', 
                                alignItems: 'center', 
                                marginVertical: 4,
                                backgroundColor: "#eaeaea",
                                padding: 8,
                                borderRadius: 8,
                            }}>
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