import { SearchSuggestion } from '@data/typecheck/aggie_spirit';
import { Route } from '@data/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoutes } from '../app';
import { useDependencyQuery, useLoggingQuery } from '../utils';

export enum StorageQueryKey {
  FAVORITES = 'favorites',
  FAVORITE = 'favorite',
  DEFAULT_ROUTE_GROUP = 'defaultRouteGroup',
  FAVORITE_LOCATIONS = 'favoriteLocations',
}

export enum StorageMutationKey {
  ADD_FAVORITE = 'addFavorite',
  REMOVE_FAVORITE = 'removeFavorite',
  DEFAULT_ROUTE_GROUP = 'defaultRouteGroup',
}

export enum StorageKey {
  FAVORITES = 'favorites',
  DEFAULT_ROUTE_GROUP = 'default-group',
  FAVORITE_LOCATIONS = 'favoriteLocations',
  SYSTEM_THEME = 'system-theme',
  APP_THEME = 'app-theme',
}

export const useFavorites = () => {
  const routesQuery = useRoutes();

  const query = useDependencyQuery<Route[]>({
    queryKey: [StorageQueryKey.FAVORITES],
    queryFn: async () => {
      const routes = routesQuery.data!;

      const favorites = await AsyncStorage.getItem(StorageKey.FAVORITES);
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
    queryKey: [StorageQueryKey.FAVORITE, routeShortName],
    queryFn: async () => {
      const favorites = await AsyncStorage.getItem(StorageKey.FAVORITES);
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
    mutationKey: [StorageMutationKey.ADD_FAVORITE],
    mutationFn: async (routeShortName: string) => {
      const favorites = await AsyncStorage.getItem(StorageKey.FAVORITES);

      let favoritesArray = JSON.parse(favorites ?? '[]');

      favoritesArray.push(routeShortName);

      await AsyncStorage.setItem(
        StorageKey.FAVORITES,
        JSON.stringify(favoritesArray),
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [StorageQueryKey.FAVORITES],
      });
      await queryClient.invalidateQueries({
        queryKey: [StorageQueryKey.FAVORITE],
      });
    },
  });

  return mutation;
};

export const removeFavoriteMutation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: [StorageMutationKey.REMOVE_FAVORITE],
    mutationFn: async (routeShortName: string) => {
      const favorites = await AsyncStorage.getItem(StorageKey.FAVORITES);

      let favoritesArray = JSON.parse(favorites ?? '[]');

      const newFavorites = favoritesArray.filter(
        (fav: string) => fav !== routeShortName,
      );

      await AsyncStorage.setItem(
        StorageKey.FAVORITES,
        JSON.stringify(newFavorites),
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [StorageQueryKey.FAVORITES],
      });
      await queryClient.invalidateQueries({
        queryKey: [StorageQueryKey.FAVORITE],
      });
    },
  });

  return mutation;
};

export const useDefaultRouteGroup = () => {
  const query = useLoggingQuery<number>({
    queryKey: [StorageQueryKey.DEFAULT_ROUTE_GROUP],
    queryFn: async () => {
      const defaultGroup = await AsyncStorage.getItem(
        StorageKey.DEFAULT_ROUTE_GROUP,
      );
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
    mutationKey: [StorageMutationKey.DEFAULT_ROUTE_GROUP],
    mutationFn: async (group: number) => {
      await AsyncStorage.setItem(
        StorageKey.DEFAULT_ROUTE_GROUP,
        group.toString(),
      );
      await queryClient.invalidateQueries({
        queryKey: [StorageQueryKey.DEFAULT_ROUTE_GROUP],
      });
    },
  });

  return mutation;
};

export const useFavoriteLocations = () => {
  const query = useLoggingQuery<SearchSuggestion[]>({
    queryKey: [StorageQueryKey.FAVORITE_LOCATIONS],
    queryFn: async () => {
      const favorites = await AsyncStorage.getItem(
        StorageKey.FAVORITE_LOCATIONS,
      );
      if (!favorites) return [];

      return JSON.parse(favorites);
    },
    staleTime: Infinity,
  });

  return query;
};

export default useFavorites;
