import React, { memo, useState } from "react";
import { View, TouchableOpacity, Text, Dimensions, useWindowDimensions, Button } from "react-native";
import { BottomSheetFlatList, BottomSheetModal, BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import Ionicons from '@expo/vector-icons/Ionicons';
import { LogBox } from 'react-native';
import useAppStore from "../../../data/app_state";
import SheetHeader from "../../ui/SheetHeader";
import Timeline from "react-native-timeline-flatlist";
import { IInstructionStep, IOptionDetail, IWalkingInstruction } from "utils/interfaces";
import RenderHTML from "react-native-render-html";


interface SheetProps {
    sheetRef: React.RefObject<BottomSheetModal>
}


// TripPlanDetail (for all routes and current route)
const TripPlanDetail: React.FC<SheetProps> = ({ sheetRef }) => {

    const snapPoints = ['25%', '45%', '85%'];

    const theme = useAppStore((state) => state.theme);
    const selectedRoutePlan = useAppStore((state) => state.selectedRoutePlan);

    const htmlStyles = {
        titleBase: {
            color: theme.text,
            fontSize: 16,
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

    function processRoutePlan(plan: IOptionDetail) {
        if (!plan) return []

        return plan.instructions?.map((instruction) => {
            return {
                time: instruction.startTime,
                title: instruction.instruction?.replace("(ID:", " (ID:"),
                description: instruction.walkingInstructions.map((step: IWalkingInstruction) => {
                    return `<p>${step.index}. ${step.instruction}</p>`
                }).join('')
            }
        })
    }

    return (
        <BottomSheetModal 
            ref={sheetRef} 
            snapPoints={snapPoints} 
            index={1} 
            backgroundStyle={{backgroundColor: theme.background}}
            handleIndicatorStyle={{backgroundColor: theme.divider}}
        >
            <BottomSheetView>
                {/* header */}
                <SheetHeader
                    title="Trip Plan"
                    subtitle={"Arrive at " + selectedRoutePlan?.endTimeText}
                    icon={
                        <TouchableOpacity style={{ marginLeft: 10 }} onPress={() => sheetRef.current?.dismiss()}>
                            <Ionicons name="close-circle" size={28} color={theme.exitButton} />
                        </TouchableOpacity>
                    }
                />

                <View style={{ height: 1, backgroundColor: theme.divider, marginTop: 8 }} />
            </BottomSheetView>
            <BottomSheetScrollView
                style={{
                    flex: 1,
                    padding: 20,
                    paddingTop:24,
                }}
            >
                <Timeline
                    isUsingFlatlist={false}
                    style={{paddingBottom: 45}}
                    timeContainerStyle={{minWidth:52, marginTop: -5, marginRight: 5}}
                    timeStyle={{
                        textAlign: 'center', 
                        backgroundColor: theme.tertiaryBackground, 
                        color:'white', 
                        padding:5, 
                        paddingHorizontal: 8, 
                        borderRadius:13,
                        fontWeight: 'bold'
                    }}
                    innerCircle={'dot'}
                    renderDetail={(data) => (<StepDetail step={data} styles={htmlStyles} />)}
                    data={processRoutePlan(selectedRoutePlan!)}
                />
            </BottomSheetScrollView>
        </BottomSheetModal>
    )
}

interface StepDetailProps {
    step: {
        title: string,
        description: string
        time: string
    }

    styles: any
}



const StepDetail: React.FC<StepDetailProps> = ({ step, styles:htmlStyles }) => {
    const theme = useAppStore((state) => state.theme);
    const [showInstructions, setShowInstructions] = useState(false)
    console.log(step.description)

    return (
        <View style={{flex: 1, marginTop: -13, marginBottom: 16}}>
            <RenderHTML 
                baseStyle={htmlStyles.titleBase}
                // @ts-ignore: Werid errors with style typings, but it works
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
                                color: theme.subtitle,
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
                                // classesStyles={{}}
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