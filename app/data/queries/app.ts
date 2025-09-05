import { useQuery } from '@tanstack/react-query';
import { Route } from '../datatypes';
import { useASRouteList } from './structure/aggie_spirit';

export enum QueryKey {
  ROUTE_LIST = 'MRRouteList',
}

export const useRouteList = () => {
  const asRouteList = useASRouteList();

  const query = useQuery<Route[]>({
    queryKey: [QueryKey.ROUTE_LIST],
    queryFn: async () => {
      return asRouteList.data!;
    },
    staleTime: Infinity,
    refetchInterval: 2 * 3600 * 1000,
    enabled: asRouteList.isSuccess,
  });

  return query;
};
