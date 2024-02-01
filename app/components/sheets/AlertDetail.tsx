import { BottomSheetModal, BottomSheetView} from "@gorhom/bottom-sheet";
import { View, Text, TouchableOpacity, useWindowDimensions} from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';
import useAppStore from "../../stores/useAppStore";
import SheetHeader from "../ui/SheetHeader";
import RenderHtml from 'react-native-render-html';


const AlertDetails: React.FC<{ sheetRef: React.RefObject<BottomSheetModal> }> = ({ sheetRef }) => {
  const snapPoints = ['25%', '45%', '85%'];
  const alert = useAppStore((state) => state.alertDetail);
  

  return (
    <BottomSheetModal ref={sheetRef} snapPoints={snapPoints} index={1}>
        <BottomSheetView>
            <SheetHeader
                title="Alert Details"
                icon={
                    <TouchableOpacity style={{ marginLeft: 10 }} onPress={() => sheetRef.current?.dismiss()}>
                        <Ionicons name="close-circle" size={28} color="grey" />
                    </TouchableOpacity>
                }
            />
            <View style={{ height: 1, backgroundColor: "#eaeaea", marginTop: 8 }} />

            <RenderHtml
                contentWidth={useWindowDimensions().width}
                baseStyle={{ fontSize: 16, paddingHorizontal: 16, paddingTop: 8}}
                source={{ html: alert?.description || '' }}
            />
        </BottomSheetView>
    </BottomSheetModal>
  );
};

export default AlertDetails;