import useAppStore from '@data/state/app_state';
import { appLogger } from '@data/utils/logger';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { TouchableOpacity, useWindowDimensions, View } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { Sheets, useSheetController } from '../providers/sheet-controller';
import SheetHeader from '../ui/SheetHeader';
import BaseSheet, { SheetProps } from './BaseSheet';

const AlertDetails: React.FC<SheetProps> = ({ sheetRef }) => {
  const alert = useAppStore((state) => state.selectedAlert);
  const setSelectedAlert = useAppStore((state) => state.setSelectedAlert);
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

  // for whatever reason, alerts gets set to null if we use onDismiss
  // thus we have to do cleanup before calling dismiss
  function handleDismiss() {
    if (!alert) return;

    appLogger.i(`Loading previous selected route: ${alert.originalRoute.name}`);
    setSelectedRoute(alert.originalRoute);
    setDrawnRoutes([alert.originalRoute]);
    setSelectedAlert(null);
    dismissSheet(Sheets.ALERTS_DETAIL);
  }

  return (
    <BaseSheet
      sheetRef={sheetRef}
      sheetKey={Sheets.ALERTS_DETAIL}
      snapPoints={['25%', '45%', '85%']}
      initialSnapIndex={1}
    >
      <View>
        <SheetHeader
          title="Alert Details"
          icon={
            <TouchableOpacity
              style={{ marginLeft: 10 }}
              onPress={handleDismiss}
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
    </BaseSheet>
  );
};

export default AlertDetails;
