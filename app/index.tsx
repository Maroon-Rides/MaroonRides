import { View } from 'react-native';
import BottomSheet from "./components/BottomSheet";
import MapView from './components/MapView';

const Home = () => {
    return (
        <View style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <MapView />

            <BottomSheet  />
        </View>
    )
}

export default Home;