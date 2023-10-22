import { SafeAreaView, Text } from 'react-native';

import BottomSheet from "./components/BottomSheet";

const Home = () => {

    return (
        <SafeAreaView className='flex flex-1 justify-center items-center'>
            <Text>Revellie Rides</Text>

            <BottomSheet />
        </SafeAreaView>
    )
}

export default Home;