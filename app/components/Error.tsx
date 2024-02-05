import useAppStore from "../stores/useAppStore";
import React from "react";
import { SafeAreaView, Text } from 'react-native';

const Error: React.FC = () => {
    const theme = useAppStore((state) => state.theme);

    return (
        <SafeAreaView style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background}}>
            <Text style={{color: theme.text}}>Something went wrong!</Text>
        </SafeAreaView>
    )
}

export default Error;
