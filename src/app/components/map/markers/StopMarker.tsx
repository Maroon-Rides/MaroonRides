import { getLighterColor } from '@data/utils/utils';
import React, { memo, useEffect } from 'react';
import { View } from 'react-native';
import { MapMarker, Marker } from 'react-native-maps';
import StopCallout from '../StopCallout';

import useAppStore from 'src/data/app_state';
import { Direction, Route, Stop } from 'src/data/datatypes';

interface Props {
  stop: Stop;
  tintColor: string;
  route: Route;
  direction: Direction;
  isCalloutShown?: boolean;
  active: boolean;
}

// Stop marker with callout
const StopMarker: React.FC<Props> = ({
  stop,
  tintColor,
  route,
  direction,
  isCalloutShown = false,
  active,
}) => {
  const markerRef = React.useRef<MapMarker>(null);
  const setSelectedDirection = useAppStore(
    (state) => state.setSelectedDirection,
  );

  // If the global poppedUpStopCallout is the same as the current stop, show the callout on screen
  useEffect(() => {
    if (isCalloutShown) {
      markerRef.current?.showCallout();
    }
  }, [isCalloutShown]);

  const defaultDirection = () => {
    if (active === false) {
      setSelectedDirection(direction);
    }
  };

  return (
    <Marker
      ref={markerRef}
      coordinate={stop.location}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 0.5 }}
      pointerEvents="auto"
      onPress={() => defaultDirection()}
    >
      <View
        style={{
          width: 16,
          height: 16,
          borderWidth: 2,
          borderRadius: 9999,
          backgroundColor: active ? tintColor : tintColor + '60',
          borderColor: active
            ? getLighterColor(tintColor)
            : getLighterColor(tintColor) + '60',
          zIndex: active ? 700 : 400,
          elevation: active ? 700 : 400,
        }}
      />
      <StopCallout
        stop={stop}
        tintColor={tintColor}
        route={route}
        direction={direction}
      />
    </Marker>
  );
};

export default memo(StopMarker);
