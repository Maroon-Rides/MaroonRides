import { SearchSuggestion } from '@data/utils/interfaces';
import { suggestionEqual } from '@data/utils/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Route } from 'src/data/datatypes';
import { useRoutes } from '../app';
import { useDependencyQuery, useLoggingQuery } from '../utils';

export const useFavorites = () => {
  const routesQuery = useRoutes();

  const query = useDependencyQuery<Route[]>({
    queryKey: ['favorites'],
    queryFn: async () => {
      const routes = routesQuery.data!;

      const favorites = await AsyncStorage.getItem('favorites');
      if (!favorites) return [];

      let favoritesArray = JSON.parse(favorites);

      // set the favorite routes
      return routes.filter((route) => favoritesArray.includes(route.routeCode));
    },

    staleTime: Infinity,
    dependents: [routesQuery],
  });

  return query;
};

export const useFavorite = (routeShortName: string) => {
  const query = useLoggingQuery({
    queryKey: ['favorite', routeShortName],
    queryFn: async () => {
      const favorites = await AsyncStorage.getItem('favorites');
      if (!favorites) return false;

      let favoritesArray = JSON.parse(favorites);

      return favoritesArray.includes(routeShortName);
    },
    staleTime: Infinity,
  });

  return query;
};

export const addFavoriteMutation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ['addFavorite'],
    mutationFn: async (routeShortName: string) => {
      const favorites = await AsyncStorage.getItem('favorites');

      let favoritesArray = JSON.parse(favorites ?? '[]');

      favoritesArray.push(routeShortName);

      await AsyncStorage.setItem('favorites', JSON.stringify(favoritesArray));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorite'] });
    },
  });

  return mutation;
};

export const removeFavoriteMutation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ['removeFavorite'],
    mutationFn: async (routeShortName: string) => {
      const favorites = await AsyncStorage.getItem('favorites');

      let favoritesArray = JSON.parse(favorites ?? '[]');

      const newFavorites = favoritesArray.filter(
        (fav: string) => fav !== routeShortName,
      );

      await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorite'] });
    },
  });

  return mutation;
};

export const useDefaultRouteGroup = () => {
  const query = useLoggingQuery({
    queryKey: ['defaultRouteGroup'],
    queryFn: async () => {
      const defaultGroup = await AsyncStorage.getItem('default-group');
      if (!defaultGroup) return 0;

      return Number(defaultGroup);
    },
    staleTime: Infinity,
  });

  return query;
};

export const defaultGroupMutation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ['defaultGroup'],
    mutationFn: async (group: number) => {
      await AsyncStorage.setItem('default-group', group.toString());
      queryClient.invalidateQueries({ queryKey: ['defaultRouteGroup'] });
    },
  });

  return mutation;
};

export const useFavoriteLocations = () => {
  const query = useLoggingQuery<SearchSuggestion[]>({
    queryKey: ['favoriteLocations'],
    queryFn: async () => {
      const favorites = await AsyncStorage.getItem('favoriteLocations');
      if (!favorites) return [];

      return JSON.parse(favorites);
    },
    staleTime: Infinity,
  });

  return query;
};

export const addFavoriteLocationMutation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ['addFavoriteLocation'],
    mutationFn: async (location: SearchSuggestion) => {
      const favorites = await AsyncStorage.getItem('favoriteLocations');

      let favoritesArray: SearchSuggestion[] = JSON.parse(favorites ?? '[]');

      // dont add if its already there
      if (
        favoritesArray.findIndex((fav: SearchSuggestion) =>
          suggestionEqual(fav, location),
        ) !== -1
      )
        return;

      favoritesArray.push(location);

      await AsyncStorage.setItem(
        'favoriteLocations',
        JSON.stringify(favoritesArray),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoriteLocations'] });
    },
  });

  return mutation;
};

export const removeFavoriteLocationMutation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ['removeFavoriteLocations'],
    mutationFn: async (location: SearchSuggestion) => {
      const favorites = await AsyncStorage.getItem('favoriteLocations');

      let favoritesArray = JSON.parse(favorites ?? '[]');
      const newFavorites = favoritesArray.filter(
        (fav: SearchSuggestion) => !suggestionEqual(fav, location),
      );
      await AsyncStorage.setItem(
        'favoriteLocations',
        JSON.stringify(newFavorites),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoriteLocations'] });
    },
  });

  return mutation;
};

export default useFavorites;
