import React, { memo, useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { BottomSheetModal, BottomSheetView, BottomSheetFlatList } from "@gorhom/bottom-sheet";
import Ionicons from '@expo/vector-icons/Ionicons';
import useAppStore from "../../../data/app_state";
import SheetHeader from "../../ui/SheetHeader";
import { MyLocationSuggestion, SearchSuggestion } from "utils/interfaces";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import SuggestionInput from "app/components/ui/SuggestionInput";
import SegmentedControl from "@react-native-segmented-control/segmented-control";

interface SheetProps {
    sheetRef: React.RefObject<BottomSheetModal>
}

// AlertList (for all routes and current route)
const InputRoute: React.FC<SheetProps> = ({ sheetRef }) => {

    const snapPoints = ['25%', '45%', '85%'];

    const theme = useAppStore((state) => state.theme);

    const [startLocation, setStartLocation] = useState<SearchSuggestion | null>(null);
    const [endLocation, setEndLocation] = useState<SearchSuggestion | null>(null);

    const searchSuggestions = useAppStore((state) => state.suggestions);
    const suggestionOutput = useAppStore((state) => state.suggestionOutput);
    const setSuggestions = useAppStore((state) => state.setSuggestions);
    const [rotueInfoError, setRouteInfoError] = useState("");

    const [routeLeaveArriveBy, setRouteLeaveArriveBy] = useState<"leave" | "arrive">("arrive");

    useEffect(() => {
        
        if (startLocation && endLocation) {
            if (startLocation.id == endLocation.id) {
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
            index={1} 
            backgroundStyle={{backgroundColor: theme.background}}
            handleIndicatorStyle={{backgroundColor: theme.divider}}
            onAnimate={(from, _) => {
                if (from == -1) {
                    setStartLocation(MyLocationSuggestion)
                    setEndLocation(null)
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
                                    sheetRef.current?.snapToIndex(2)
                                    setStartLocation(null)
                                }}
                                icon={(startLocation == MyLocationSuggestion) 
                                    ? <MaterialCommunityIcons name="crosshairs-gps" size={24} color={theme.myLocation} />
                                    : <MaterialCommunityIcons name="map-marker" size={24} color={theme.subtitle} />
                                }
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
                                    sheetRef.current?.snapToIndex(2)
                                    setEndLocation(null)
                                }}
                                icon={(endLocation == MyLocationSuggestion) 
                                    ? <MaterialCommunityIcons name="crosshairs-gps" size={24} color={theme.myLocation} />
                                    : <MaterialCommunityIcons name="map-marker" size={24} color={theme.subtitle} />
                                }
                            />
                        </View>

                        {/* Swap Endpoints */}
                        <TouchableOpacity 
                            style={{ marginLeft: 8 }}
                            onPress={() => {
                                setStartLocation(endLocation)
                                setEndLocation(startLocation)
                            }}>
                            <MaterialCommunityIcons name="swap-vertical" size={28} color={theme.subtitle} />
                        </TouchableOpacity>
                    </View>

                    {/* Leave by/Arrive By */}
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingHorizontal: 16}}>
                        <SegmentedControl
                            values={['Arrive by', 'Leave by']}
                            selectedIndex={0}
                            onChange={(event) => {
                                setRouteLeaveArriveBy(event.nativeEvent.selectedSegmentIndex == 0 ? "arrive" : "leave")
                            }}
                            style={{width: "70%"}}
                        />
                    </View>

                    {/* Divider */}
                    <View style={{height: 1, backgroundColor: theme.divider, marginTop: 16}} />

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

            {/* Search Suggestions */}
            <BottomSheetFlatList
                data={searchSuggestions}
                keyExtractor={(item) => item.id}
                ItemSeparatorComponent={() => <View style={{height: 1, backgroundColor: theme.divider, marginLeft: 12}} />}
                renderItem={({item: suggestion}) => (
                    <TouchableOpacity 
                        style={{paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                        onPress={() => {
                            if (suggestionOutput == "start") setStartLocation(suggestion)
                            if (suggestionOutput == "end") setEndLocation(suggestion)
                            setSuggestions([])
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
                            { suggestion.type == "my-location" 
                                ? <MaterialCommunityIcons name="crosshairs-gps" size={24} color={theme.myLocation} />
                                : <MaterialCommunityIcons name="map-marker" size={24} color={theme.subtitle} />
                            }
                            
                        </View>

                        {/* Title */}
                        <Text style={{ color: theme.text, fontSize: 16, flex: 1, marginLeft: 12, fontWeight: "bold" }}>{suggestion.title}</Text>

                        {/* Subtitle */}
                        <Text style={{ color: theme.subtitle, fontSize: 14 }}>{suggestion.subtitle}</Text>
                    </TouchableOpacity>
                )}
            />
        </BottomSheetModal>

    )
}

export default memo(InputRoute);