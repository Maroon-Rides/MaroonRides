import { View } from 'react-native';
import BottomSheet from "./components/BottomSheet";
import MapView from './components/MapView';
import {  useState } from 'react';

import { IBusRoute } from 'utils/interfaces';

const Home = () => {
    const [drawnRoutes, setDrawnRoutes] = useState<IBusRoute[]>([]);

    return (
        <View className='flex flex-1 justify-center items-center'>
            <MapView drawnRoutes={drawnRoutes} />

            <BottomSheet setDrawnRoutes={setDrawnRoutes} />
        </View>
    )
}
  

export default Home;