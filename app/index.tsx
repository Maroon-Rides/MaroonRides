import { View } from 'react-native';
import BottomSheet from "./components/BottomSheet";
import MapView from './components/MapView';
import {  useState } from 'react';

import { IBusRoute } from 'utils/interfaces';

const Home = () => {
    const [drawnRoutes, setDrawnRoutes] = useState<IBusRoute[]>([]);

    return (
        <View style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <MapView drawnRoutes={drawnRoutes} />

            <BottomSheet setDrawnRoutes={setDrawnRoutes} />
        </View>
    )
}
  

export default Home;