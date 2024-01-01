import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, TouchableOpacity, FlatList, Text } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BusIcon from "./BusIcon";
import useAppStore from "../stores/useAppStore";
import { IMapRoute } from "utils/updatedInterfaces";
import SegmentedControl from "@react-native-segmented-control/segmented-control";



const RoutesList: React.FC = () => {
    const routes = useAppStore((state) => state.routes);
    const alerts = useAppStore((state) => state.mapServiceInterruption);

    const setSheetView = useAppStore((state) => state.setSheetView);

    const [selectedRouteCategory, setSelectedRouteCategory] = useState<"favorites" | "all">("all");
    const [alertIcon, setAlertIcon] = useState<"bell-outline" | "bell-badge">("bell-outline");

    const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);
    const setSelectedRoute = useAppStore((state) => state.setSelectedRoute);

    const handleRouteSelected = (selectedRoute: IMapRoute) => {
        setSelectedRoute(selectedRoute);
        setDrawnRoutes([selectedRoute]);
        setSheetView("routeDetails");
    }

    useEffect(() => {
        if (alerts.length > 0) {
            setAlertIcon("bell-badge");
        }
    }, [alerts]);

    return (
        <View style={{ height: "100%" }}>
            <View style={{ flexDirection: "row", alignItems: 'center', marginBottom: 8}}>
                <Text style={{ fontWeight: 'bold', fontSize: 32}}>Routes</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity style={{ marginLeft: 10 }} onPress={() => setSheetView("alerts")}>
                    <MaterialCommunityIcons name={alertIcon} size={28} color="black" />
                </TouchableOpacity>
            </View>

            <SegmentedControl
                values={['All Routes', 'Favorites']}
                selectedIndex={0}
                onChange={(event) => {
                    setSelectedRouteCategory(event.nativeEvent.selectedSegmentIndex === 0 ? "all" : "favorites");
                }}
            />
            
            {!routes[0] ? <ActivityIndicator style={{ marginTop: 8 }} /> : (
                <FlatList
                    contentContainerStyle={{ paddingBottom: 30 }}
                    data={routes}
                    keyExtractor={route => route.key}
                    renderItem={({ item: route }) => {
                        return (
                            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }} onPress={() => handleRouteSelected(route)}>
                                <BusIcon name={route.shortName} color={route.directionList[0]?.lineColor ?? "#000"} style={{ marginRight: 12 }} />
                                <View>
                                    <Text style={{ fontWeight: 'bold', fontSize: 20, lineHeight: 28 }}>{route.name}</Text>
                                    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                        {route.directionList.map((elm, index) => (
                                            <React.Fragment key={index}>
                                                <Text>{elm.destination}</Text>
                                                {index !== route.directionList.length - 1 && <Text style={{ marginHorizontal: 2 }}>|</Text>}
                                            </React.Fragment>
                                        ))}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )
                    }}
                />
            )}
        </View>
    )
}

export default RoutesList