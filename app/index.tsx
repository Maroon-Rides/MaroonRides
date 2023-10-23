import { SafeAreaView } from 'react-native';

import BottomSheet from "./components/BottomSheet";
import MapView from './components/MapView';

const Home = () => {
    return (
        <SafeAreaView className='flex flex-1 justify-center items-center'>
            <MapView />

            <BottomSheet />
        </SafeAreaView>
    )
}
  

export default Home;