import React, { memo, useEffect, useState } from "react";
import { ActivityIndicator, View, TouchableOpacity, Text, NativeSyntheticEvent } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SegmentedControl, { NativeSegmentedControlIOSChangeEvent } from "@react-native-segmented-control/segmented-control";
import { BottomSheetModal, BottomSheetView, BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';

import { IDirectionList, IMapRoute } from "../../../utils/interfaces";
import useAppStore from "../../stores/useAppStore";
import BusIcon from "../ui/BusIcon";
import SheetHeader from "../ui/SheetHeader";
import AlertPill from "../ui/AlertPill";
import IconPill from "../ui/IconPill";
import { useAuthToken, useBaseData, usePatternPaths, useRoutes } from "app/stores/query";

interface SheetProps {
    sheetRef: React.RefObject<BottomSheetModal>
}

// Display routes list for all routes and favorite routes
const RoutesList: React.FC<SheetProps> = ({ sheetRef }) => {
    const setSelectedRoute = useAppStore((state) => state.setSelectedRoute);
    
    const selectedRouteCategory = useAppStore(state => state.selectedRouteCategory);
    const setSelectedRouteCategory = useAppStore(state => state.setSelectedRouteCategory);
    const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);
    const presentSheet = useAppStore((state) => state.presentSheet);
    const theme = useAppStore((state) => state.theme);

    const [favoriteRoutes, setFavoriteRoutes] = useState<IMapRoute[]>([]);
    
    useAuthToken()
    useBaseData()
    usePatternPaths()
    
    const { data: routes, isLoading } = useRoutes();

    
    const handleRouteSelected = (selectedRoute: IMapRoute) => {        
        setSelectedRoute(selectedRoute);
        setDrawnRoutes([selectedRoute]);
        presentSheet("routeDetails");
    }

    // load favorite routes from async storage
    function loadFavorites() {
        if (!routes) return;

        AsyncStorage.getItem('favorites').then((favorites: string | null) => {
            if (!favorites) return;

            var favoritesArray = JSON.parse(favorites);

            // uuid regex
            const uuidRegex = new RegExp("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");

            if (favoritesArray.some((fav: string) => uuidRegex.test(fav))) {
                console.log("Found a uuid in favorited, running migration steps...")

                // convert any uuids (based on regex) to the new route shortName
                favoritesArray = favoritesArray.map((fav: string) => {
                    // check if the favorite is a uuid
                    if (uuidRegex.test(fav)) {
                        const match = routes.find(route => route.key === fav);
                        
                        return match ? match.shortName : null; // return null if the route is not found
                    } else { 
                        // otherwise return the favorite
                        return fav;
                    }
                })

                // remove any undefined values
                favoritesArray = favoritesArray.filter((el: string | undefined) => el !== null);

                // deduplicate the array
                favoritesArray = [...new Set(favoritesArray)];

                // save the converted favorites to AsyncStorage
                AsyncStorage.setItem('favorites', JSON.stringify(favoritesArray));
            }

            // set the favorite routes
            setFavoriteRoutes(routes.filter(route => favoritesArray.includes(route.shortName)));
        })
    }

    function loadSettings() {
        AsyncStorage.getItem('default-group').then((defaultGroup: string | null) => {
            if (!defaultGroup) return;
            setSelectedRouteCategory(Number(defaultGroup) === 0 ? "all" : "favorites");
        })
    }

    // Load preferences on first render
    useEffect(() => {
        loadFavorites()
        loadSettings()
    }, [routes]);

    // Update the shown routes when the selectedRouteCategory changes
    useEffect(() => {
        if (!routes) return;

        if (selectedRouteCategory === "all") {
            setDrawnRoutes(routes);
        } else {
            setDrawnRoutes(favoriteRoutes);
        }
    }, [selectedRouteCategory, routes, favoriteRoutes]);



    // Update the favorites when the view is focused
    function onAnimate(from: number, _: number) {
        if (from === -1) {
            loadFavorites();

            // match the selectedRouteCategory on the map
            if (selectedRouteCategory === "all") {
                setDrawnRoutes(routes ?? []);
            } else {
                setDrawnRoutes(favoriteRoutes);
            }
        }
    }

    const handleSetSelectedRouteCategory = (evt: NativeSyntheticEvent<NativeSegmentedControlIOSChangeEvent>) => {
        setSelectedRouteCategory(evt.nativeEvent.selectedSegmentIndex === 0 ? "all" : "favorites");
    }

    const snapPoints = ['25%', '45%', '85%'];

    return (
        <BottomSheetModal 
            ref={sheetRef} 
            snapPoints={snapPoints} 
            index={1} 
            enableDismissOnClose={false}
            enablePanDownToClose={false}
            onAnimate={onAnimate}
            backgroundStyle={{ backgroundColor: theme.background }}
            handleIndicatorStyle={{ backgroundColor: theme.divider }}
        >
            <BottomSheetView>
                <SheetHeader 
                    title="Routes" 
                    icon={
                    <View style={{flexDirection: "row", alignContent: "center"}}>
                        <AlertPill />
                        <TouchableOpacity style={{ marginLeft: 10 }} onPress={() => presentSheet("settings")}>
                            <IconPill 
                                icon={<MaterialIcons name="settings" size={16} color={theme.text} />}
                            />
                        </TouchableOpacity>
                    </View>}
                />

                <SegmentedControl
                    values={['All Routes', 'Favorites']}
                    selectedIndex={selectedRouteCategory === 'all' ? 0 : 1}
                    style={{ marginHorizontal: 16 }}
                    onChange={handleSetSelectedRouteCategory}
                />
                <View style={{height: 1, backgroundColor: theme.divider, marginTop: 8}} />

                { selectedRouteCategory === "favorites" && favoriteRoutes.length === 0 && routes?.length != 0 && (
                    <View style={{ alignItems: 'center', marginTop: 16 }}>
                        <Text style={{color: theme.text}}>You have no favorited routes.</Text>
                    </View>
                )}

                {/* Loading indicatior */}
                { isLoading && <ActivityIndicator style={{ marginTop: 12 }} /> }
            </BottomSheetView>

            <BottomSheetFlatList
                contentContainerStyle={{ paddingBottom: 35 }}
                data={routes?.filter(route => selectedRouteCategory === "all" || favoriteRoutes.includes(route)) ?? []}
                keyExtractor={(route: IMapRoute) => route.key}
                style={{ marginLeft: 16 }}
                renderItem={({item: route}) => {
                    return (
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }} onPress={() => handleRouteSelected(route)}>
                            <BusIcon name={route.shortName} color={route.directionList[0]?.lineColor ?? "#000"} style={{ marginRight: 12 }} />
                            <View>                                
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <Text style={{ fontWeight: 'bold', fontSize: 20, lineHeight: 28, color: theme.text }}>{route.name}</Text>
                                    {favoriteRoutes.includes(route) && 
                                        <FontAwesome name="star" size={16} color={theme.starColor} style={{marginLeft: 4}} />
                                    }
                                </View>
                                { route.directionList.length > 1 ?
                                    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                        {route.directionList.map((elm: IDirectionList, index: number) => (
                                            <React.Fragment key={index}>
                                                <Text style={{ color: theme.text }}>{elm.destination}</Text>
                                                {index !== route.directionList.length - 1 && <Text style={{ marginHorizontal: 2, color: theme.text }}>|</Text>}
                                            </React.Fragment>
                                        ))}
                                    </View>
                                    :
                                    <Text style={{ color: theme.text }}>Campus Circulator</Text>
                                } 
                            </View>
                        </TouchableOpacity>
                    )
                }}
            />
            
        </BottomSheetModal>
    )
}

export default memo(RoutesList)