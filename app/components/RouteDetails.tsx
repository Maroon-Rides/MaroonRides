import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';
import useAppStore from "../stores/useAppStore";

// TODO: Fill in route details with new UI
const RouteDetails: React.FC = () => {
    const clearSelectedRoute = useAppStore((state) => state.clearSelectedRoute);

    const handleClearSelectedRoute = () => {
        clearSelectedRoute();
    }

    return (
        <View>
            <Text>Active Routes</Text>

            <TouchableOpacity style={{ alignContent: 'center', justifyContent: 'flex-end' }} onPress={handleClearSelectedRoute}>
                    <Ionicons name="close-circle" size={32} color="grey" />
                </TouchableOpacity>
        </View>
    )
}

export default RouteDetails;