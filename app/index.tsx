import { View } from 'react-native';
import BottomSheet from "./components/BottomSheet";
import MapView from './components/MapView';

const Home = () => {

    return (
        <View className='flex flex-1 justify-center items-center'>
            <MapView />
            <BottomSheet />
        </View>
    )
}
  

export default Home;