import React from "react";
import { SafeAreaView, Text } from 'react-native';

const Error: React.FC = () => {
    return (
        <SafeAreaView style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center'}}>
            <Text>Something went wrong!</Text>
        </SafeAreaView>
    )
}

export default Error;
