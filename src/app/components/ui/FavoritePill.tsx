import useAppStore from '@data/state/app_state';
import { FontAwesome } from '@expo/vector-icons';
import React, { memo } from 'react';
import { TouchableOpacity } from 'react-native';
import {
  addFavoriteMutation,
  removeFavoriteMutation,
  useFavorite,
} from 'src/data/queries/structure/storage';
import IconPill from './IconPill';

interface Props {
  routeShortName: string;
}

const FavoritePill: React.FC<Props> = ({ routeShortName }) => {
  const theme = useAppStore((state) => state.theme);

  const { data: isFavorite } = useFavorite(routeShortName);
  const addFavorite = addFavoriteMutation();
  const removeFavorite = removeFavoriteMutation();

  async function toggleFavorite() {
    const newState = !isFavorite;

    if (newState) {
      addFavorite.mutate(routeShortName);
    } else {
      removeFavorite.mutate(routeShortName);
    }
  }

  return (
    <TouchableOpacity onPress={toggleFavorite}>
      {isFavorite ? (
        <IconPill
          icon={<FontAwesome name="star" size={16} color="#ffcc01" />}
          text="Favorited"
        />
      ) : (
        <IconPill
          icon={<FontAwesome name="star-o" size={16} color={theme.text} />}
          text="Favorite"
        />
      )}
    </TouchableOpacity>
  );
};

export default memo(FavoritePill);
