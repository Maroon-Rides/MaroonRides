import React, { memo, useEffect, useState } from "react";
import { View, TouchableOpacity, Text, useWindowDimensions, Platform, BackHandler } from "react-native";
import { BottomSheetModal, BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import Ionicons from '@expo/vector-icons/Ionicons';
import useAppStore from "../../../data/app_state";
import SheetHeader from "../../ui/SheetHeader";
import Timeline from "react-native-timeline-flatlist";
import { IOptionDetail, IWalkingInstruction } from "utils/interfaces";
import RenderHTML from "react-native-render-html";
import { MaterialCommunityIcons } from "@expo/vector-icons";


interface SheetProps {
    sheetRef: React.RefObject<BottomSheetModal>
}


// TripPlanDetail (for all routes and current route)
const TripPlanDetail: React.FC<SheetProps> = ({ sheetRef }) => {

    const snapPoints = ['25%', '45%', '85%'];
    const [snap, _] = useState(1)

    const theme = useAppStore((state) => state.theme);
    const selectedRoutePlan = useAppStore((state) => state.selectedRoutePlan);
    const setSelectedRoutePlan = useAppStore((state) => state.setSelectedRoutePlan);
    const setSelectedRoutePlanPathPart = useAppStore((state) => state.setSelectedRoutePlanPathPart);
    const selectedRoutePlanPathPart = useAppStore((state) => state.selectedRoutePlanPathPart);

    const dimensions = useWindowDimensions()
    
    const htmlStyles = {
        titleBase: {
            color: theme.text,
            fontSize: 16,
            paddingLeft: 6,
            paddingTop: 2
        },
        titleClassStyle: {
            "location_label": { fontSize: 16, fontWeight: "bold" },
            "stop-code": { fontSize: 16, color: theme.subtitle },
        },
        titleTagStyles: {
            div: {fontSize: 16}
        },
        descriptionBase: {
            color: theme.text,
            fontSize: 14,
        },
        descriptionTagStyles: {
            p: { marginTop: 0}
        }

    }

    useEffect(() => {
        setSelectedRoutePlanPathPart(-1)
    }, [])

    function processRoutePlan(plan: IOptionDetail) {
        if (!plan) return []

        return plan.instructions?.map((instruction, index) => {
            var icon;
            switch (instruction.className) {
                case "bus":
                    icon = <Ionicons name="bus" size={16} color={theme.text} />
                    break;
                case "walking":
                    icon = <Ionicons name="walk" size={18} color={theme.text} />
                    break;
                case "end":
                    icon = <MaterialCommunityIcons name="map-marker" size={16} color={theme.text} />
                    break;
                case "waiting":
                    icon = <Ionicons name="time-outline" size={18} color={theme.text} />
                    break;
                default:
                    icon = <Ionicons name="walk" size={18} color={theme.text} />
            }

            return {
                time: instruction.startTime,
                title: instruction.instruction?.replace("(ID:", " (ID:"),
                description: instruction.walkingInstructions.map((step: IWalkingInstruction) => {
                    return `<p>${step.index}. ${step.instruction}</p>`
                }).join(''),
                icon: icon,
                index: index
            }
        })
    }

    useEffect(() => {
        if (selectedRoutePlanPathPart === -1) return;
        sheetRef.current?.snapToIndex(1)
    }, [selectedRoutePlanPathPart])

    BackHandler.addEventListener('hardwareBackPress', () => {
        sheetRef.current?.dismiss()
        return false
    })

    return (
        <BottomSheetModal 
            ref={sheetRef} 
            snapPoints={snapPoints} 
            index={snap} 
            backgroundStyle={{backgroundColor: theme.background}}
            handleIndicatorStyle={{backgroundColor: theme.divider}}
            enablePanDownToClose={false}
        >
            <BottomSheetView>
                {/* header */}
                <SheetHeader
                    title="Trip Plan"
                    subtitle={"Arrive at " + selectedRoutePlan?.endTimeText}
                    onTitlePress={() => setSelectedRoutePlanPathPart(-1)}
                    icon={
                        <TouchableOpacity style={{ marginLeft: 10 }} onPress={() => {
                            setSelectedRoutePlanPathPart(-1)
                            setSelectedRoutePlan(null)


                            sheetRef.current?.dismiss()
                        }}>
                            <Ionicons name="close-circle" size={28} color={theme.exitButton} />
                        </TouchableOpacity>
                    }
                />

                <View style={{ height: 1, backgroundColor: theme.divider, marginTop: 8 }} />
            </BottomSheetView>
            <BottomSheetScrollView
                style={{
                    flex: 1,
                    paddingLeft: 16,
                }}
            >
                <Timeline
                    isUsingFlatlist={false}
                    style={{ paddingTop: 16 }}
                    timeContainerStyle={{minWidth: 85, marginTop: -2, marginRight: 5}}
                    timeStyle={{
                        textAlign: 'center', 
                        backgroundColor: theme.tertiaryBackground, 
                        color: theme.text, 
                        padding: 6, 
                        marginTop: 3,
                        paddingHorizontal: 8, 
                        borderRadius: 16,
                        fontWeight: 'bold'
                    }}
                    onEventPress={(e) => {
                        // @ts-ignore: e is not actually an Event, 
                        if (e.index === selectedRoutePlanPathPart) {
                            setSelectedRoutePlanPathPart(-1)
                        } else {
                            // @ts-ignore: e is not actually an Event, 
                            setSelectedRoutePlanPathPart(e.index)
                        }
                    }}
                    renderDetail={(data) => (<StepDetail step={data} styles={htmlStyles}/>)}
                    renderCircle={(rowData, _sectionID, _rowID) => {
                        return (
                            <View 
                                style={{
                                    backgroundColor: theme.tertiaryBackground, 
                                    borderRadius: 999, 
                                    borderWidth: 2,
                                    borderColor: theme.pillBorder, 
                                    width: 32, 
                                    height: 32, 
                                    justifyContent: 'center', 
                                    alignItems: 'center',
                                    right: Platform.OS == "android" ? (dimensions.width/2)+49 : (dimensions.width/2)+54,
                                }}
                            >
                                {rowData.icon}
                            </View>
                        )
                    }}
                    data={processRoutePlan(selectedRoutePlan!)}
                />
                <Text
                    style={{
                        color: theme.subtitle,
                        fontSize: 12,
                        textAlign: 'center',
                        marginVertical: 12,
                        paddingBottom: 16,
                        marginRight: 16 // to center the text
                    }}
                >Route Directions Provided by Google</Text>
            </BottomSheetScrollView>
        </BottomSheetModal>
    )
}

interface StepDetailProps {
    step: {
        title: string,
        description: string
        time: string
        index: number
    }
    styles: any
}

const StepDetail: React.FC<StepDetailProps> = ({ step, styles: htmlStyles }) => {
    const theme = useAppStore((state) => state.theme);
    const [showInstructions, setShowInstructions] = useState(false)

    return (
        <View style={{flex: 1, marginTop: -8, marginBottom: 16}}>
            <RenderHTML 
                baseStyle={htmlStyles.titleBase}
                classesStyles={htmlStyles.titleClassStyle}
                tagsStyles={htmlStyles.titleTagStyles}
                source={{html: step.title}}
                contentWidth={500}
            />
            { step.description && (
                <>
                    <TouchableOpacity
                        onPress={() => setShowInstructions(!showInstructions)}
                    >
                        <Text 
                            style={{
                                color: theme.myLocation,
                                textAlign: 'center',
                                marginVertical: 8,
                            }}
                        >{showInstructions ? "Hide" : "View"} Instructions</Text>
                    </TouchableOpacity>
                    { showInstructions &&
                        <View 
                            style={{
                            backgroundColor: theme.tertiaryBackground,
                            borderRadius: 8, 
                            paddingTop: 16, 
                            marginLeft: 16,
                            paddingHorizontal: 16
                        }}>
                            <RenderHTML 
                                baseStyle={htmlStyles.descriptionBase}
                                source={{html: step.description}}
                                tagsStyles={htmlStyles.descriptionTagStyles}
                                contentWidth={500}
                            />
                        </View>
                    }
                </>
            )}
        </View>
    )
}



export default memo(TripPlanDetail);