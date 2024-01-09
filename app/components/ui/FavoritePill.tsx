

import React, { memo, useEffect, useState } from 'react'
import { Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {FontAwesome} from '@expo/vector-icons';

import IconPill from './IconPill'

interface Props {
    routeId: string
}

const FavoritePill: React.FC<Props> = ({ routeId }) => {
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        try {
            AsyncStorage.getItem('favorites').then((favorites: string | null) => {
                if (!favorites) return;
    
                const favoritesArray = JSON.parse(favorites);
    
                setIsFavorite(favoritesArray.includes(routeId));
            })
        } catch(error) {
            console.error(error);

            Alert.alert("Error while retrieving favorited route")
        }
    }, [])

    async function toggleFavorite() {
        const newState = !isFavorite;

        const savedFavorites = await AsyncStorage.getItem('favorites');
        
        // If no favorites exist and we are removing favorite, do nothing
        if (!savedFavorites && !newState) return;

        try {
            // If no favorites exist and we are adding favorite, create a new array with the routeId
            if (!savedFavorites && newState) {
                return AsyncStorage.setItem('favorites', JSON.stringify([routeId]));
            }

            // If favorites exist and we are adding favorite, add routeId to array
            if (newState) {
                const favoritesArray = JSON.parse(savedFavorites!);
                favoritesArray.push(routeId);

                AsyncStorage.setItem('favorites', JSON.stringify(favoritesArray));
            } else { 
                // If favorites exist and we are removing favorite, remove routeId from array
                const favoritesArray = JSON.parse(savedFavorites!);
                const newFavoritesArray = favoritesArray.filter((id: string) => id !== routeId);

                AsyncStorage.setItem('favorites', JSON.stringify(newFavoritesArray));
            }

            setIsFavorite(newState);
        } catch (error) {
            console.error(error);

            Alert.alert("Error while marking route as favorite");
        }
    }

    return (
        <TouchableOpacity onPress={toggleFavorite}>
            {isFavorite ?
                <IconPill 
                icon={<FontAwesome name="star" size={16} color="#ffcc01" />}
                text="Favorited" 
                color="white"
                borderColor="#cccccd"
                textColor="black"
            />
            :
                <IconPill 
                    icon={<FontAwesome name="star-o" size={16} color="black" />}
                    text="Favorite" 
                    color="white"
                    borderColor="#cccccd"
                    textColor="black"
                />
                
            }
        </TouchableOpacity>
    )
}

export default memo(FavoritePill);