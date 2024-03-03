import React, { memo, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Keyboard } from "react-native";
import { BottomSheetModal, BottomSheetView, BottomSheetFlatList } from "@gorhom/bottom-sheet";
import Ionicons from '@expo/vector-icons/Ionicons';
import useAppStore from "../../../data/app_state";
import SheetHeader from "../../ui/SheetHeader";
import { MyLocationSuggestion, SearchSuggestion } from "utils/interfaces";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import SuggestionInput from "app/components/ui/SuggestionInput";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import TimeInput from "app/components/ui/TimeInput";

interface SheetProps {
    sheetRef: React.RefObject<BottomSheetModal>
}

// AlertList (for all routes and current route)
const InputRoute: React.FC<SheetProps> = ({ sheetRef }) => {

    const snapPoints = ['45%', '90%'];

    const theme = useAppStore((state) => state.theme);

    const [startLocation, setStartLocation] = useState<SearchSuggestion | null>(null);
    const [endLocation, setEndLocation] = useState<SearchSuggestion | null>(null);

    const searchSuggestions = useAppStore((state) => state.suggestions);
    const suggestionOutput = useAppStore((state) => state.suggestionOutput);
    const setSuggestions = useAppStore((state) => state.setSuggestions);
    const setSuggesionOutput = useAppStore((state) => state.setSuggestionOutput);
    const [rotueInfoError, setRouteInfoError] = useState("");

    const [snapIndex, setSnapIndex] = useState(1);

    const [searchSuggestionsLoading, setSearchSuggestionsLoading] = useState(false)

    const [routeLeaveArriveBy, setRouteLeaveArriveBy] = useState<"leave" | "arrive">("arrive");

    useEffect(() => {
        
        if (startLocation && endLocation) {
            if (startLocation.title == endLocation.title) {
                setRouteInfoError("Start and End locations cannot be the same");
                return
            }
        }

        setRouteInfoError("");
    }, [startLocation, endLocation])

    return (
        <BottomSheetModal 
            ref={sheetRef} 
            snapPoints={snapPoints} 
            index={snapIndex}
            backgroundStyle={{backgroundColor: theme.background}}
            handleIndicatorStyle={{backgroundColor: theme.divider}}
            onAnimate={(from, _) => {
                if (from == -1) {
                    setStartLocation(MyLocationSuggestion)
                    setEndLocation(null)
                    setSuggesionOutput(null)
                    sheetRef.current?.snapToIndex(0)
                }
            }}
        >
            <BottomSheetView>
                {/* header */}
                <SheetHeader
                    title="Plan a Route"
                    icon={
                        <TouchableOpacity style={{ marginLeft: 10 }} onPress={() => sheetRef.current?.dismiss()}>
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
                                    if (startLocation?.type == "my-location") setStartLocation(null)
                                    sheetRef.current?.snapToIndex(1)
                                    setSnapIndex(1)
                                }}
                                icon={(startLocation?.type == "my-location") 
                                    ? <MaterialCommunityIcons name="crosshairs-gps" size={24} color={theme.myLocation} />
                                    : <MaterialCommunityIcons name="map-marker" size={24} color={theme.subtitle} />
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
                                    if (endLocation?.type == "my-location") setEndLocation(null)
                                    sheetRef.current?.snapToIndex(1)
                                    setSnapIndex(1)
                                }}
                                icon={(endLocation?.type == "my-location") 
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
                            }}>
                            <MaterialCommunityIcons name="swap-vertical" size={28} color={theme.subtitle} />
                        </TouchableOpacity>
                    </View>

                    {/* Leave by/Arrive By */}
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12, paddingHorizontal: 16 }}>
                        <SegmentedControl
                            values={['Arrive by', 'Leave by']}
                            selectedIndex={0}
                            onChange={(event) => {
                                setRouteLeaveArriveBy(event.nativeEvent.selectedSegmentIndex == 0 ? "arrive" : "leave")
                            }}
                            style={{flex: 1, marginRight: 8}}
                        />

                        <TimeInput 
                            onTimeChange={(time) => console.log(time)}
                        />
                    </View>


                    {/* Divider */}
                    <View style={{height: 1, backgroundColor: theme.divider, marginTop: 4}} />

                    {/* Error */}
                    { rotueInfoError != "" && (
                        <View style={{marginTop: 8, justifyContent: "center", alignItems: "center"}}>
                            {/* Warning Icon */}
                            <Ionicons name="warning" size={24} color={theme.subtitle} />
                                
                            {/* Error Text */}
                            <Text style={{color: theme.subtitle,  textAlign:"center", marginLeft: 4 }}>{rotueInfoError}</Text>
                        </View>
                    )}

                    {/* Search Button */}
                </View>

            </BottomSheetView>
            
            {/* Flat lists when no error */}
            {rotueInfoError == "" && (
                suggestionOutput ? (
                    /* Search Suggestions */
                    <BottomSheetFlatList
                        data={searchSuggestions}
                        keyExtractor={(_, index) => index.toString()}
                        keyboardShouldPersistTaps={"handled"}
                        ItemSeparatorComponent={() => <View style={{height: 1, backgroundColor: theme.divider, marginLeft: 12}} />}
                        ListHeaderComponent={() => {
                            if (searchSuggestions.length == 0 && suggestionOutput && !searchSuggestionsLoading) {
                                return (
                                    <View style={{padding: 16, justifyContent: "center", alignItems: "center"}}>
                                        <Text style={{color: theme.subtitle, textAlign: "center"}}>No results found</Text>
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
                                    if (suggestionOutput == "start") setStartLocation(suggestion)
                                    if (suggestionOutput == "end") setEndLocation(suggestion)
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
                                    { suggestion.type == "my-location" && <MaterialCommunityIcons name="crosshairs-gps" size={24} color={theme.myLocation} /> }
                                    { suggestion.type == "stop" && <MaterialCommunityIcons name="bus-stop" size={24} color={theme.subtitle} /> }
                                    { suggestion.type == "map" && <MaterialCommunityIcons name="map-marker" size={24} color={theme.subtitle} /> }
                                    
                                </View>
                                <View style={{flex: 1, marginLeft: 12 }}>
                                    {/* Title */}
                                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: "bold" }}>{suggestion.title}</Text>
        
                                    {/* Subtitle */}
                                    { suggestion.subtitle && <Text style={{ color: theme.subtitle, fontSize: 14 }}>{suggestion.subtitle}</Text> }
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                ) : (
                    // Show the Route Options
                    <BottomSheetView>
                        <View style={{padding: 16, justifyContent: "center", alignItems: "center"}}>
                            <Text style={{color: theme.subtitle, textAlign: "center"}}>show me the options</Text>
                        </View>
                    </BottomSheetView>
                )
            )}
        </BottomSheetModal>

    )
}

export default memo(InputRoute);