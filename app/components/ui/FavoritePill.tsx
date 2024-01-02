

import React, { useEffect } from 'react'
import IconPill from './IconPill'
import {FontAwesome} from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
    routeId: string
    style?: any
}

const FavoritePill: React.FC<Props> = ({ routeId, style }) => {

    const [isFavorite, setIsFavorite] = React.useState(false);


    useEffect(() => {
        AsyncStorage.getItem('favorites').then((favorites: string | null) => {
            if (!favorites) return;

            const favoritesArray = JSON.parse(favorites);

            setIsFavorite(favoritesArray.includes(routeId));
        })
    }, [])

    async function handleFavorite() {
        const newState = !isFavorite;
        setIsFavorite(newState)

        const savedFavorites = await AsyncStorage.getItem('favorites');
        
        // If no favorites exist and we are adding favoirte, create a new array with the routeId
        if (!savedFavorites && newState) {
            return AsyncStorage.setItem('favorites', JSON.stringify([routeId]));
        }

        // If no favorites exist and we are removing favorite, do nothing
        if (!savedFavorites && !newState) return;

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

    }

    return (
        <TouchableOpacity onPress={handleFavorite}>
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

export default FavoritePill;