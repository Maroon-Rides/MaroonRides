import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthentication, getBaseData, getNextDepartureTimes, getPatternPaths, getStopEstimates, getStopSchedules } from "aggie-spirit-api";
import { darkMode, lightMode } from "app/theme";
import { getColorScheme } from "app/utils";
import { GetBaseDataResponseSchema, GetNextDepartTimesResponseSchema, GetPatternPathsResponseSchema, GetStopEstimatesResponseSchema, GetStopSchedulesResponseSchema, IGetBaseDataResponse, IGetPatternPathsResponse, IGetStopEstimatesResponse, IGetStopSchedulesResponse, IMapRoute, IMapServiceInterruption, IRouteDirectionTime } from "utils/interfaces";


export const useAuthToken = () => {
    return useQuery({
        queryKey: ["authToken"],
        queryFn: async () => {
            console.log("fetching auth token")
            return await getAuthentication();
        },
        staleTime: Infinity
    });
};

export const useBaseData = () => {
    const client = useQueryClient();

    return useQuery<IGetBaseDataResponse>({
        queryKey: ["baseData"],
        queryFn: async () => {
            console.log("fetching base data")
            const authToken: string = client.getQueryData(["authToken"])!;
            const baseData = await getBaseData(authToken);

            // go through each route and add a empty arrain on patternPaths
            baseData.routes.forEach(route => route.patternPaths = []);

            GetBaseDataResponseSchema.parse(baseData);

            return baseData;
        },
        enabled: useAuthToken().isSuccess,
        staleTime: Infinity
    });
};

export const usePatternPaths = () => {
    const client = useQueryClient();

    return useQuery<IGetPatternPathsResponse>({
        queryKey: ["patternPaths"],
        queryFn: async () => {
            console.log("fetching pattern paths")
            const authToken: string = client.getQueryData(["authToken"])!;
            const baseData = client.getQueryData(["baseData"]) as IGetBaseDataResponse;

            const patternPaths = await getPatternPaths(baseData.routes.map(route => route.key), authToken);

            GetPatternPathsResponseSchema.parse(patternPaths);

            return patternPaths;
        },
        enabled: useBaseData().isSuccess,
        staleTime: Infinity
    });
};

export const useRoutes = () => {
    const client = useQueryClient();

    return useQuery<IMapRoute[]>({
        queryKey: ["routes"],
        queryFn: async () => {
            console.log("fetching routes")
            const baseData = client.getQueryData(["baseData"]) as IGetBaseDataResponse;
            const patternPaths = client.getQueryData(["patternPaths"]) as IGetPatternPathsResponse;

            function addPatternPathsToRoutes(baseDataRoutes: IMapRoute[], patternPathsResponse: IGetPatternPathsResponse) {
                for (let elm of patternPathsResponse) {
                    const foundObject = baseDataRoutes.find(route => route.key === elm.routeKey) as IMapRoute;
                    if (foundObject) {
                        foundObject.patternPaths = elm.patternPaths;
                    }
                }
                return baseDataRoutes as IMapRoute[];
            }

            const routes = addPatternPathsToRoutes([...baseData.routes], patternPaths);
            
            // convert colors based on theme
            const colorTheme = (await getColorScheme()) == "dark" ? darkMode : lightMode
            routes.forEach(route => {
                if (colorTheme.busTints[route.shortName]) {
                    route.directionList.forEach(direction => {
                        direction.lineColor = colorTheme.busTints[route.shortName]!;
                    })
                }
            });

            return routes;
        },
        enabled: usePatternPaths().isSuccess,
        staleTime: Infinity
    });
};

export const useServiceInterruptions = () => {
    const client = useQueryClient();

    return useQuery<IMapServiceInterruption[]>({
        queryKey: ["serviceInterruptions"],
        queryFn: async () => {
            const baseData = client.getQueryData(["baseData"]) as IGetBaseDataResponse;
            return baseData.serviceInterruptions;
        },
        enabled: useBaseData().isSuccess,
        staleTime: Infinity
    });
};

export const useStopEstimate = (routeKey: string, directionKey: string, stopCode: string) => {
    const client = useQueryClient();

    return useQuery<IRouteDirectionTime | undefined>({
        queryKey: ["stopEstimate", routeKey, directionKey, stopCode],
        queryFn: async () => {
            const authToken: string = client.getQueryData(["authToken"])!;
    
            const response = await getNextDepartureTimes(routeKey, [directionKey], stopCode, authToken);
            GetNextDepartTimesResponseSchema.parse(response);

            return response.routeDirectionTimes[0];
        },
        enabled: useAuthToken().isSuccess,
        staleTime: 30000,
        refetchInterval: 30000  
    })
}

export const useTimetableEstimate = (stopCode: string, date: Date) => {
    const client = useQueryClient();

    return useQuery<IGetStopEstimatesResponse>({
        queryKey: ["timetableEstimate", stopCode, date],
        queryFn: async () => {
            const authToken: string = client.getQueryData(["authToken"])!;
    
            const response = await getStopEstimates(stopCode, date, authToken);
            GetStopEstimatesResponseSchema.parse(response);

            return response
        },
        enabled: useAuthToken().isSuccess,
        staleTime: 30000,
        refetchInterval: 30000  
    })
}

export const useSchedule = (stopCode: string, date: Date) => {
    const client = useQueryClient();

    return useQuery<IGetStopSchedulesResponse>({
        queryKey: ["schedule", stopCode, date],
        queryFn: async () => {
            console.log("fetching schedule")
            const authToken: string = client.getQueryData(["authToken"])!;
    
            const stopSchedulesResponse = await getStopSchedules(stopCode, date, authToken);
            GetStopSchedulesResponseSchema.parse(stopSchedulesResponse);

            return stopSchedulesResponse
        },
        enabled: useAuthToken().isSuccess,
        staleTime: 30000,
        refetchInterval: 30000  
    })
}