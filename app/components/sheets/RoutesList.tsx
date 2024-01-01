import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, TouchableOpacity, FlatList, Text } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BusIcon from "../ui/BusIcon";
import useAppStore from "../../stores/useAppStore";
import { IMapRoute } from "utils/updatedInterfaces";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import SheetHeader from "../ui/SheetHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";



const RoutesList: React.FC = () => {
    const routes = useAppStore((state) => state.routes);
    const alerts = useAppStore((state) => state.mapServiceInterruption);

    const setSheetView = useAppStore((state) => state.setSheetView);

    const [selectedRouteCategory, setSelectedRouteCategory] = useState<"favorites" | "all">("all");
    const [shownRoutes, setShownRoutes] = useState<IMapRoute[]>([]);
    const [alertIcon, setAlertIcon] = useState<"bell-outline" | "bell-badge">("bell-outline");

    const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);
    const setSelectedRoute = useAppStore((state) => state.setSelectedRoute);

    const handleRouteSelected = (selectedRoute: IMapRoute) => {
        setSelectedRoute(selectedRoute);
        setDrawnRoutes([selectedRoute]);
        setSheetView("routeDetails");
    }

    async function getFavorites(): Promise<string[]> {
        const favorites = await AsyncStorage.getItem('favorites');
        if (!favorites) return [];
        return JSON.parse(favorites);
    }

    useEffect(() => {
        if (selectedRouteCategory === "all") {
            setShownRoutes(routes);
            setDrawnRoutes(routes);
        } else {
            getFavorites().then(favorites => {
                const filtered = routes.filter(route => favorites.includes(route.key));
                setShownRoutes(filtered);
                setDrawnRoutes(filtered);
            })
        }
    }, [selectedRouteCategory, routes]);

    useEffect(() => {
        if (alerts.length > 0) {
            setAlertIcon("bell-badge");
        } else {
            setAlertIcon("bell-outline");
        }
    }, [alerts]);

    return (
        <View style={{ height: "100%" }}>

            <SheetHeader 
                title="Routes" 
                icon={
                    <TouchableOpacity style={{ marginLeft: 10 }} onPress={() => setSheetView("alerts")}>
                        <MaterialCommunityIcons name={alertIcon} size={28} color="black" />
                    </TouchableOpacity>
                }
            />

            <SegmentedControl
                values={['All Routes', 'Favorites']}
                selectedIndex={0}
                style={{ marginHorizontal: 16 }}
                onChange={(event) => {
                    setSelectedRouteCategory(event.nativeEvent.selectedSegmentIndex === 0 ? "all" : "favorites");
                }}
            />

            {selectedRouteCategory === "favorites" && shownRoutes.length === 0 && (
                <View style={{ alignItems: 'center', marginTop: 16 }}>
                    <Text>You have no favorited routes.</Text>
                </View>
            )}
            
            {!routes[0] ? <ActivityIndicator style={{ marginTop: 8 }} /> : (
                <FlatList
                    contentContainerStyle={{ paddingBottom: 30 }}
                    data={shownRoutes}
                    keyExtractor={route => route.key}
                    style={{ marginLeft: 16 }}
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