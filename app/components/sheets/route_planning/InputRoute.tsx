import React, { memo, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Keyboard, ActivityIndicator, Button, Platform , Linking } from "react-native";
import { BottomSheetModal, BottomSheetFlatList } from "@gorhom/bottom-sheet";
import Ionicons from '@expo/vector-icons/Ionicons';
import useAppStore from "../../../data/app_state";
import SheetHeader from "../../ui/SheetHeader";
import { MyLocationSuggestion, SearchSuggestion } from "utils/interfaces";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import SuggestionInput from "app/components/ui/SuggestionInput";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import TimeInput from "app/components/ui/TimeInput";
import { useTripPlan } from "app/data/api_query";
import { useQueryClient } from "@tanstack/react-query";
import TripPlanCell from "app/components/ui/TripPlanCell";
import * as Location from 'expo-location';

interface SheetProps {
    sheetRef: React.RefObject<BottomSheetModal>
}

// AlertList (for all routes and current route)
const InputRoute: React.FC<SheetProps> = ({ sheetRef }) => {

    const snapPoints = ['85%'];

    const theme = useAppStore((state) => state.theme);

    // Planning Inputs
    const [startLocation, setStartLocation] = useState<SearchSuggestion | null>(MyLocationSuggestion);
    const [endLocation, setEndLocation] = useState<SearchSuggestion | null>(null);
    const [deadline, setDeadline] = useState<"leave" | "arrive">("leave");
    const [time, setTime] = useState<Date>(new Date());

    const { data: tripPlan, isError, isLoading: tripPlanLoading } = useTripPlan(startLocation, endLocation, time, deadline);

    const searchSuggestions = useAppStore((state) => state.suggestions);
    const suggestionOutput = useAppStore((state) => state.suggestionOutput);
    const setSuggestions = useAppStore((state) => state.setSuggestions);
    const setSuggesionOutput = useAppStore((state) => state.setSuggestionOutput);
    const [routeInfoError, setRouteInfoError] = useState("");
    const dismissSheet = useAppStore((state) => state.dismissSheet);
    const setSheetCloseCallback = useAppStore((state) => state.setSheetCloseCallback);

    const [searchSuggestionsLoading, setSearchSuggestionsLoading] = useState(false)

    const client = useQueryClient()

    // // Favorite Location
    // const { data: favoriteLocations, refetch: refetchFavoriteLocations } = useFavoriteLocations();
    // const addLocationFavorite = addFavoriteLocationMutation();
    // const removeLocationFavorite = removeFavoriteLocationMutation();

    const [timeInputFocused, setTimeInputFocused] = useState(false);
    const [segmentedIndex, setSegmentedIndex] = useState<number>(0)

    // function toggleFavoriteLocation(location: SearchSuggestion) {
    //     if (favoriteLocations && favoriteLocations.find((item) => suggestionEqual(item, location))) 
    //     {
    //         removeLocationFavorite.mutate(location)
    //     } else {
    //         addLocationFavorite.mutate(location)
    //     }

    //     refetchFavoriteLocations()
    // }

    function toggleTimeInputFocused(newValue: boolean) {
        setTimeInputFocused(newValue)
    }

    useEffect(() => {
        setSheetCloseCallback(() => {
            setTimeout(() => {
                setStartLocation(MyLocationSuggestion)
                setEndLocation(null)
                setSuggesionOutput(null)
            }, 500)
        }, "inputRoute")
    }, [])

    useEffect(() => {
        
        if (suggestionOutput) {
            setRouteInfoError("");
            return
        }

        if (startLocation && endLocation) {
            if (startLocation.title === endLocation.title) {
                setRouteInfoError("Start and End locations cannot be the same");
                return
            }
        }

        if (startLocation?.type === "my-location" || endLocation?.type === "my-location") {
            // Request location permissions
            Location.requestForegroundPermissionsAsync().then(async (status) => {
                // Check if permission is granted
                if (!status.granted) {
                    setRouteInfoError("Location Unavailable, enable location in Settings.") 
                    return
                }

                // Get current location
                const locationCoords = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, timeInterval: 2 });

                // Set the location coordinates
                let location = MyLocationSuggestion
                location.lat = locationCoords.coords.latitude
                location.long = locationCoords.coords.longitude

                if (startLocation?.type === "my-location") setStartLocation(location)
                if (endLocation?.type === "my-location") setEndLocation(location)
            })
        }

        setRouteInfoError("");
    }, [startLocation, endLocation, suggestionOutput])

    return (
        <BottomSheetModal 
            ref={sheetRef} 
            snapPoints={snapPoints} 
            backgroundStyle={{backgroundColor: theme.background}}
            handleIndicatorStyle={{backgroundColor: theme.divider}}
            enablePanDownToClose={false}
            enableDynamicSizing={false}
        >
            <View
                onTouchStart={() => {
                    if (!suggestionOutput && !timeInputFocused) Keyboard.dismiss()
                }}
                style={[!(routeInfoError === "") && {flex: 1}]}
            >
                {/* header */}
                <SheetHeader
                    title="Plan a Route"
                    icon={
                        <TouchableOpacity 
                            style={{ marginLeft: 10 }} 
                            onPress={() => {
                                Keyboard.dismiss()
                                dismissSheet("inputRoute")
                            }}
                        >
                            <Ionicons name="close-circle" size={28} color={theme.exitButton} />
                        </TouchableOpacity>
                    }
                />

                {/* Route Details Input */}
                <View>
                    {/* Endpoint Input */}
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingHorizontal: 16}}>
                        <View style={{paddingRight: 8, alignItems: "center", flex: 1}}>
                            {/* Start */}
                            <SuggestionInput
                                outputName={"start"}
                                location={startLocation}
                                onFocus={() => {
                                    if (startLocation?.type === "my-location") setStartLocation(null)
                                }}
                                icon={(startLocation?.type === "my-location") 
                                    ? <MaterialCommunityIcons name="crosshairs-gps" size={24} color={theme.myLocation} />
                                    : <MaterialCommunityIcons name="circle-outline" size={20} color={theme.subtitle} />
                                }
                                setSuggestionLoading={setSearchSuggestionsLoading}
                            />

                            {/* 2 dots in between rows */}
                            <View style={{height: 3, width: 3, backgroundColor: theme.subtitle, marginVertical: 1.5, alignSelf: "flex-start", marginLeft: 16, borderRadius: 999}} />
                            <View style={{height: 3, width: 3, backgroundColor: theme.subtitle, marginVertical: 1.5, alignSelf: "flex-start", marginLeft: 16, borderRadius: 999}} />
                            <View style={{height: 3, width: 3, backgroundColor: theme.subtitle, marginVertical: 1.5, alignSelf: "flex-start", marginLeft: 16, borderRadius: 999}} />

                            {/* End */}
                            <SuggestionInput
                                outputName={"end"}
                                location={endLocation}
                                onFocus={() => {
                                    if (endLocation?.type === "my-location") setEndLocation(null)
                                }}
                                icon={(endLocation?.type === "my-location") 
                                    ? <MaterialCommunityIcons name="crosshairs-gps" size={24} color={theme.myLocation} />
                                    : <MaterialCommunityIcons name="map-marker" size={24} color={theme.subtitle} />
                                }
                                setSuggestionLoading={setSearchSuggestionsLoading}
                            />
                        </View>

                        {/* Swap Endpoints */}
                        <TouchableOpacity 
                            style={{ marginLeft: 8 }}
                            onPress={() => {
                                const temp = startLocation
                                setStartLocation(endLocation)
                                setEndLocation(temp)
                                setSuggesionOutput(null)
                            }}>
                            <MaterialCommunityIcons name="swap-vertical" size={28} color={theme.subtitle} />
                        </TouchableOpacity>
                    </View>

                    {/* Leave by/Arrive By */}
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12, paddingHorizontal: 16 }}>
                        <SegmentedControl
                            values={['Leave by', 'Arrive by']}
                            selectedIndex={segmentedIndex}
                            onChange={(event) => {
                                setSegmentedIndex(event.nativeEvent.selectedSegmentIndex)
                                setDeadline(event.nativeEvent.selectedSegmentIndex === 0 ? "leave" : "arrive")
                            }}
                            style={{flex: 1, marginRight: 8}}
                            backgroundColor={Platform.OS === "android" ? theme.androidSegmentedBackground : undefined}
                        />

                        <TimeInput 
                            onTimeChange={(time) => setTime(time)}
                            onTimeInputFocused={toggleTimeInputFocused}
                        />
                    </View>


                    {/* Divider */}
                    <View style={{height: 1, backgroundColor: theme.divider, marginTop: 4}} />

                    {/* Error */}
                    { routeInfoError !== "" && (
                        <View style={{marginTop: 8, justifyContent: "center", alignItems: "center"}}>
                            
                            {/* Error Text */}
                            <Text style={{color: theme.subtitle,  textAlign:"center", marginLeft: 4, paddingHorizontal: 24 }}>{routeInfoError}</Text>
                            
                            { routeInfoError === "Location Unavailable, enable location in Settings." && (
                                <Button title="Open Settings" onPress={() => Linking.openSettings()} />
                            )}
                        </View>
                    )}
                </View>
            </View>
                    
            {/* Flat lists when no error */}
            {routeInfoError === "" && (
                suggestionOutput ? (
                    /* Search Suggestions */
                    <BottomSheetFlatList
                        data={searchSuggestions}
                        keyExtractor={(_, index) => index.toString()}
                        keyboardShouldPersistTaps={"handled"}
                        ItemSeparatorComponent={() => <View style={{height: 1, backgroundColor: theme.divider, marginLeft: 12}} />}
                        ListHeaderComponent={() => {
                            if (searchSuggestions.length === 0 && suggestionOutput && !searchSuggestionsLoading) {
                                return (
                                    <View style={{padding: 16, justifyContent: "center", alignItems: "center"}}>
                                        <Text style={{color: theme.subtitle, textAlign: "center"}}>No locations found</Text>
                                    </View>
                                ) 
                            }
                            return null
                        }}
                        onScrollBeginDrag={() => Keyboard.dismiss()}
                        renderItem={({item: suggestion}) => (
                            <TouchableOpacity 
                                style={{paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                                onPress={() => {
                                    if (suggestionOutput === "start") setStartLocation(suggestion)
                                    if (suggestionOutput === "end") setEndLocation(suggestion)
                                    setSuggestions([])
                                    setSuggesionOutput(null)
                                    Keyboard.dismiss()
                                }}
                            >
                                <View
                                    style={{
                                        backgroundColor: theme.tertiaryBackground,
                                        borderRadius: 999,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: 40,
                                        width: 40,
                                        paddingVertical: 2,
                                    }}
                                >
                                    { suggestion.type === "my-location" && <MaterialCommunityIcons name="crosshairs-gps" size={24} color={theme.myLocation} /> }
                                    { suggestion.type === "stop" && <MaterialCommunityIcons name="bus-stop" size={24} color={theme.subtitle} /> }
                                    { suggestion.type === "map" && <MaterialCommunityIcons name="map-marker" size={24} color={theme.subtitle} /> }
                                    
                                </View>
                                <View style={{flex: 1, marginLeft: 12 }}>
                                    {/* Title */}
                                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: "bold" }}>{suggestion.title}</Text>
        
                                    {/* Subtitle */}
                                    { suggestion.subtitle && <Text style={{ color: theme.subtitle, fontSize: 14 }}>{suggestion.subtitle}</Text> }
                                </View>

                                {/* Favorite Location
                                { suggestion.type !== "my-location" &&
                                    <TouchableOpacity 
                                        onPress={(e) => {
                                            e.stopPropagation()
                                            toggleFavoriteLocation(suggestion)
                                        }} 
                                        style={{ paddingLeft: 16, zIndex: 10000 }}
                                    >
                                        { favoriteLocations && favoriteLocations.find((item) => suggestionEqual(item, suggestion)) ?
                                            <FontAwesome name="star" size={24} color="#ffcc01" />
                                        :
                                            <FontAwesome name="star-o" size={24} color={theme.subtitle} />
                                        }
                                    </TouchableOpacity>
                                } */}

                            </TouchableOpacity>
                        )}
                    />
                ) : ( tripPlanLoading || isError ? (
                        // Show the Route Options
                        <View>
                            {(tripPlanLoading && !isError) && (
                                <View style={{padding: 16, justifyContent: "center", alignItems: "center"}}>
                                    <ActivityIndicator />
                                </View>
                            )}

                            {isError && (
                                <View style={{padding: 16, justifyContent: "center", alignItems: "center"}}>
                                    <Text style={{color: theme.subtitle, textAlign: "center"}}>Unable to load routes. Please try again later.</Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        <BottomSheetFlatList
                            // filter out plans that have already passed, sort by end time
                            data={
                                tripPlan?.options
                                    .filter((plan) => plan.startTime > Math.floor(Date.now() / 1000) - 300)
                                    .sort((a, b) => a.endTime - b.endTime)
                            }
                            keyExtractor={(_, index) => index.toString()}
                            onRefresh={() => {
                                client.invalidateQueries({
                                    queryKey: ["tripPlan", startLocation, endLocation, time, deadline]
                                })
                                setSuggestions([])
                            }}
                            refreshing={tripPlanLoading}
                            keyboardShouldPersistTaps={"handled"}
                            ItemSeparatorComponent={() => <View style={{height: 1, backgroundColor: theme.divider, marginLeft: 12}} />}
                            ListHeaderComponent={() => {
                                const filtered = tripPlan?.options.filter((plan) => plan.startTime > Math.floor(Date.now() / 1000) - 300) ?? []
                                if (filtered.length === 0 && !tripPlanLoading && startLocation && endLocation) {
                                    return (
                                        <View style={{padding: 16, justifyContent: "center", alignItems: "center"}}>
                                            <Text style={{color: theme.subtitle, textAlign: "center"}}>No routes found</Text>
                                        </View>
                                    ) 
                                }
                                return null
                            }}
                            onScrollBeginDrag={() => Keyboard.dismiss()}
                            renderItem={({item: plan}) => {
                                return (
                                    <TripPlanCell
                                        plan={plan}
                                    />
                                )
                            }}
                        />
                    )
                )
            )}  
        </BottomSheetModal>
    )
}

export default memo(InputRoute);
