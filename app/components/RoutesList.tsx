import React, { useState, useEffect } from "react";
import { ActivityIndicator, View, TouchableOpacity, FlatList, Text } from "react-native";
import SegmentedControl from '@react-native-segmented-control/segmented-control';

import BusIcon from "./BusIcon";

import { IRouteCategory, IBusRoute } from "utils/interfaces";
import useAppStore from "../stores/useAppStore";
import { IMapRoute } from "utils/updatedInterfaces";

const RoutesList: React.FC = () => {
    const routes = useAppStore((state) => state.routes);
    
    const setBusRoutes = useAppStore((state) => state.setBusRoutes);

    const selectedRouteCategory = useAppStore((state) => state.selectedRouteCategory);
    const setSelectedRouteCategory = useAppStore((state) => state.setSelectedRouteCategory);

    const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);

    const setSelectedGroup = useAppStore((state) => state.setSelectedGroup);

    const [selectedIndex, setSelectedIndex] = useState(0);

    const setIsGameday = useAppStore((state) => state.setIsGameday);

    const handleSelectedRouteCategorySwitch = (newRouteCategory: string) => {
        setSelectedRouteCategory(newRouteCategory as unknown as "On Campus" | "Off Campus");

        if(newRouteCategory === "On Campus") {
            setDrawnRoutes(routes.filter(route => route.category === "On Campus"));
        } else if(newRouteCategory === "Off Campus") {
            setDrawnRoutes(routes.filter(route => route.category === "Off Campus"));
        }
    }

    const handleRouteSelected = (selectedRoute: IMapRoute) => {
        setDrawnRoutes([selectedRoute]);
    }

    return (
        <>
            <View style={{ height: "100%" }}>
                    <SegmentedControl values={["On Campus", "Off Campus"]} selectedIndex={selectedIndex} onValueChange={handleSelectedRouteCategorySwitch} />
                    { !routes[0] ? <ActivityIndicator style={{ marginTop: 5 }} /> : (
                        <FlatList
                        contentContainerStyle={{ paddingBottom: 30 }}
                        data={routes.filter(route => route.category === selectedRouteCategory)}
                        keyExtractor={route => route.key}
                        renderItem={({ item: route }) => {
                            return (
                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }} onPress={() => handleRouteSelected(route)}>
                                    <BusIcon name={route.shortName} color={route.directionList[0]?.lineColor ?? "#000"} />
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
                    ) }
                </View>
        </>
    )
}

export default RoutesList