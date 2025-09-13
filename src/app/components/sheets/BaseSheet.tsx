import { BottomSheetModal } from '@gorhom/bottom-sheet';
import React, { ReactNode, useEffect, useState } from 'react';

import useAppStore from '@data/state/app_state';
import { Sheets, useSheetController } from '../providers/sheet-controller';

export interface SheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
}

interface Props extends SheetProps {
  snapPoints?: string[];
  initialSnapIndex?: number;
  enableGestureClose?: boolean;
  enableDismissOnClose?: boolean;
  sheetKey: Sheets;
  children: ReactNode;

  onPresent?: () => void;
  onDismiss?: () => void;
  onSnap?: (index: number) => void;
}

// Settings (for all routes and current route)
const BaseSheet: React.FC<Props> = (props) => {
  const [snap, _] = useState(props.initialSnapIndex ?? 1);
  const theme = useAppStore((state) => state.theme);
  const { setPresentCallback, setDismissCallback } = useSheetController();

  useEffect(() => {
    if (props.onPresent) setPresentCallback(props.onPresent, props.sheetKey);
    if (props.onDismiss) setDismissCallback(props.onDismiss, props.sheetKey);
  }, []);

  return (
    <BottomSheetModal
      ref={props.sheetRef}
      snapPoints={props.snapPoints ?? ['25%', '45%', '85%']}
      index={snap}
      backgroundStyle={{ backgroundColor: theme.background }}
      handleIndicatorStyle={{ backgroundColor: theme.divider }}
      enablePanDownToClose={props.enableGestureClose ?? false}
      enableDynamicSizing={false}
      onAnimate={(_, toIndex) => props.onSnap?.(toIndex)}
    >
      {props.children}
    </BottomSheetModal>
  );
};

export default BaseSheet;
