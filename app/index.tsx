import { View } from 'react-native';

import BottomSheet from "./components/BottomSheet";
import MapView from './components/MapView';
import { MapConnection, TimetableConnection } from 'aggie-spirit-api'
import { useEffect } from 'react';

const Home = () => {

    var mapConnection = new MapConnection();
    
    var timetableConnection = new TimetableConnection();

    useEffect(() => {
        mapConnection.connect()
        timetableConnection.connect()
    })

    return (
        <View className='flex flex-1 justify-center items-center'>
            <MapView mapConnection={mapConnection}/>

            <BottomSheet mapConnection={mapConnection} timetableConnection={timetableConnection}/>
        </View>
    )
}
  

export default Home;