import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthentication, getBaseData, getNextDepartureTimes, getPatternPaths, getStopEstimates, getStopSchedules, getVehicles } from "aggie-spirit-api";
import { darkMode, lightMode } from "app/theme";
import { getColorScheme } from "app/utils";
import moment from "moment";
import { useEffect } from "react";
import { Alert } from "react-native";
import { GetBaseDataResponseSchema, GetNextDepartTimesResponseSchema, GetPatternPathsResponseSchema, GetStopEstimatesResponseSchema, GetStopSchedulesResponseSchema, GetVehiclesResponseSchema, IGetBaseDataResponse, IGetPatternPathsResponse, IGetStopEstimatesResponse, IGetStopSchedulesResponse, IGetVehiclesResponse, IMapRoute, IMapServiceInterruption, IRouteDirectionTime, IVehicle } from "utils/interfaces";


export const useAuthToken = () => {
    const query = useQuery({
        queryKey: ["authToken"],
        queryFn: async () => {
            console.log("fetching auth token")
            return await getAuthentication();
        },
        staleTime: Infinity
    });

    useEffect(() => {
        if (query.error) {
          Alert.alert("Error", "Something went wrong. Please try again later.");
        }
      }, [query.error])

    return query;
};

export const useBaseData = () => {
    const client = useQueryClient();

    const query = useQuery<IGetBaseDataResponse>({
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

    useEffect(() => {
        if (query.error) {
            Alert.alert("Error", "Something went wrong. Please try again later.");
        }
    }, [query.error])

    return query;
};

export const usePatternPaths = () => {
    const client = useQueryClient();

    const query = useQuery<IGetPatternPathsResponse>({
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

    useEffect(() => {
        if (query.error) {
            Alert.alert("Error", "Something went wrong. Please try again later.");
        }
    }, [query.error])

    return query
};

export const useRoutes = () => {
    const client = useQueryClient();

    const query = useQuery<IMapRoute[]>({
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

    useEffect(() => {
        if (query.error) {
            Alert.alert("Error", "Something went wrong. Please try again later.");
        }
    }, [query.error])

    return query;
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

            // dedup the stopTimes[].nextDeparts based on relative time
            if (response.routeDirectionTimes[0]) {
                const relatives = response.routeDirectionTimes[0].nextDeparts.map((item) => {
                    const date = moment(item.estimatedDepartTimeUtc ?? item.scheduledDepartTimeUtc ?? "");
                    const relative = date.diff(moment(), "minutes");

                    return relative
                })

                const deduped = response.routeDirectionTimes[0].nextDeparts.filter((_, index) => {
                    return relatives.indexOf(relatives[index] ?? 0) === index
                })

                response.routeDirectionTimes[0].nextDeparts = deduped;
            }

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
        enabled: useAuthToken().isSuccess && stopCode !== "" && date !== null,
        staleTime: 30000,
        refetchInterval: 30000  
    })
}

export const useVehicles = (routeKey: string) => {
    const client = useQueryClient();

    return useQuery<IVehicle[]>({
        queryKey: ["vehicles", routeKey],
        queryFn: async () => {
            console.log("fetching vehicles")
            const authToken: string = client.getQueryData(["authToken"])!;
    
            
            let busesResponse = await getVehicles([routeKey], authToken) as IGetVehiclesResponse;

            GetVehiclesResponseSchema.parse(busesResponse);
            

            if (busesResponse.length == 0 || !busesResponse[0]?.vehiclesByDirections) {
                return []
            }

            let extracted: IVehicle[] = []
            for (let direction of busesResponse[0]?.vehiclesByDirections) {
                for (let bus of direction.vehicles) {
                    extracted.push(bus)
                }
            }

            return extracted;
        },
        enabled: useAuthToken().isSuccess && routeKey !== "",
        staleTime: 10000,
        refetchInterval: 10000  
    })
}