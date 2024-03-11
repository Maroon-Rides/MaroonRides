import React, { memo, useState, useCallback } from 'react'
import { View, Text, LayoutChangeEvent, FlatList } from 'react-native'
import { Callout } from 'react-native-maps'
import BusIcon from '../ui/BusIcon'
import { IDirection, IMapRoute, IStop } from '../../../utils/interfaces'
import { useStopEstimate } from 'app/data/api_query'
import TimeBubble from '../ui/TimeBubble'
import moment from 'moment'

interface Props {
  stop: IStop
  tintColor: string
  route: IMapRoute
  direction: IDirection
}

// Stop callout with time bubbles
const StopCallout: React.FC<Props> = ({ stop, tintColor, route, direction }) => {

  // Calculate size of callout based on the contentSize
  const [contentSize, setContentSize] = useState([100, 15]);

  const { data: estimate } = useStopEstimate(route.key, direction.key, stop.stopCode);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    setContentSize([width, height]);
  }, [setContentSize]);

  return (
    <Callout
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        width: contentSize[0],
        height: contentSize[1],
        zIndex: 1000,
        elevation: 1000
      }}
    >
      <View onLayout={handleLayout}>
      <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", alignSelf: "flex-start" }}  >
          <BusIcon name={route.shortName} color={tintColor} isCallout={true} style={{ marginRight: 8 }} />
          <Text style={{ maxWidth: 200, fontWeight: 'bold' }} numberOfLines={1}>{stop.name}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8, marginBottom: 8, marginTop: -4 }}>
        <FlatList
              horizontal
              scrollEnabled={false}
              data={estimate?.routeDirectionTimes[0]?.nextDeparts}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item: departureTime, index }) => {
                  const date = moment(departureTime.estimatedDepartTimeUtc ?? departureTime.scheduledDepartTimeUtc ?? "");
                  const relative = date.diff(moment(), "minutes");
                  return (
                      <TimeBubble
                          key={index}
                          time={relative <= 0 ? "Now" : relative.toString() + " min"}
                          color={index == 0 ? color + (theme.mode == "dark" ? "65" : "40") : theme.nextStopBubble}
                          textColor={index == 0 ? (theme.mode == "dark" ? theme.text : color) : theme.text}
                          live={departureTime.estimatedDepartTimeUtc == null ? false : true}
                      />
                  )
              }}
        </View>
      </View>
    </Callout>
  )
}

export default memo(StopCallout);