import { BottomSheetModal, BottomSheetScrollView, BottomSheetView} from "@gorhom/bottom-sheet";
import { View, TouchableOpacity, useWindowDimensions} from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';
import useAppStore from "../../stores/useAppStore";
import SheetHeader from "../ui/SheetHeader";
import RenderHtml from 'react-native-render-html';


const AlertDetails: React.FC<{ sheetRef: React.RefObject<BottomSheetModal> }> = ({ sheetRef }) => {
  const snapPoints = ['25%', '45%', '85%'];
  const alert = useAppStore((state) => state.alertDetail);

  const theme = useAppStore((state) => state.theme);
  
  const tagStyles = { 
    h3: { fontSize: 32, fontWeight: "bold", marginTop: 24, marginBottom: 8, color: theme.text },
    h6: { fontSize: 20, fontWeight: "bold", marginTop: 24, marginBottom: 8, color: theme.text }, 
    span: {fontWeight: "bold"},
    ul: {marginLeft: 16, marginTop: 8, padding: 8, paddingLeft: 24, backgroundColor: theme.secondaryBackground, borderRadius: 8},
    div: {paddingBottom: 0, marginBottom: 0, color: theme.text}
  };

  console.log(alert?.description)

  return (
    <BottomSheetModal 
      ref={sheetRef} 
      snapPoints={snapPoints} 
      index={1} 
      backgroundStyle={{backgroundColor: theme.background}}
      handleIndicatorStyle={{backgroundColor: theme.divider}}
    >
        <BottomSheetView>
            <SheetHeader
                title="Alert Details"
                icon={
                    <TouchableOpacity style={{ marginLeft: 10 }} onPress={() => sheetRef.current?.dismiss()}>
                        <Ionicons name="close-circle" size={28} color={theme.exitButton} />
                    </TouchableOpacity>
                }
            />
            <View style={{ height: 1, backgroundColor: theme.divider, marginTop: 8 }} />

        </BottomSheetView>
        <BottomSheetScrollView>


            <RenderHtml
                contentWidth={useWindowDimensions().width}
                baseStyle={{ fontSize: 16, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 48}}
                source={{ html: alert?.description || 'No details to show.' }}

                // @ts-ignore: Werid errors with tagStyles typings, but it works
                tagsStyles={tagStyles}
            />
        </BottomSheetScrollView>
    </BottomSheetModal>
  );
};

export default AlertDetails;