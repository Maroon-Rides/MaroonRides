import { appLogger } from '@data/utils/logger';
import { SheetProps } from '@data/utils/utils';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useState } from 'react';
import { TouchableOpacity, useWindowDimensions, View } from 'react-native';
import RenderHtml from 'react-native-render-html';
import useAppStore from 'src/data/app_state';
import { Sheets, useSheetController } from '../providers/sheet-controller';
import SheetHeader from '../ui/SheetHeader';

const AlertDetails: React.FC<SheetProps> = ({ sheetRef }) => {
  const snapPoints = ['25%', '45%', '85%'];
  const alert = useAppStore((state) => state.selectedAlert);
  const theme = useAppStore((state) => state.theme);
  const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);
  const setSelectedRoute = useAppStore((state) => state.setSelectedRoute);
  const { dismissSheet } = useSheetController();

  const tagStyles = {
    h3: {
      fontSize: 32,
      fontWeight: 'bold',
      marginTop: 24,
      marginBottom: 8,
      color: theme.text,
    },
    h6: {
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: 24,
      marginBottom: 8,
      color: theme.text,
    },
    span: { fontWeight: 'bold' },
    ul: {
      marginLeft: 16,
      marginTop: 8,
      padding: 8,
      paddingLeft: 24,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 8,
    },
    div: { paddingBottom: 0, marginBottom: 0, color: theme.text },
  };

  const [snap, _] = useState(1);

  const handleDismiss = () => {
    if (!alert) return;

    appLogger.i(`Loading previous selected route: ${alert.originalRoute.name}`);
    setSelectedRoute(alert.originalRoute);
    setDrawnRoutes([alert.originalRoute]);
    dismissSheet(Sheets.ALERTS_DETAIL);
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      index={snap}
      backgroundStyle={{ backgroundColor: theme.background }}
      handleIndicatorStyle={{ backgroundColor: theme.divider }}
      onAnimate={(_, to) => {
        if (to === 1) {
          setDrawnRoutes(alert?.affectedRoutes ?? []);
        }
      }}
      enablePanDownToClose={false}
      enableDynamicSizing={false}
    >
      <View>
        <SheetHeader
          title="Alert Details"
          icon={
            <TouchableOpacity
              style={{ marginLeft: 10 }}
              onPress={() => handleDismiss()}
            >
              <Ionicons
                name="close-circle"
                size={28}
                color={theme.exitButton}
              />
            </TouchableOpacity>
          }
        />
        <View
          style={{ height: 1, backgroundColor: theme.divider, marginTop: 8 }}
        />
      </View>
      <BottomSheetScrollView>
        <RenderHtml
          contentWidth={useWindowDimensions().width}
          baseStyle={{
            fontSize: 16,
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 48,
          }}
          source={{ html: alert?.description || 'No details to show.' }}
          // @ts-ignore: Werid errors with tagStyles typings, but it works
          tagsStyles={tagStyles}
        />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};

export default AlertDetails;
