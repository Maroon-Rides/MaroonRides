import { useQuery } from "@tanstack/react-query";
import { findBusStops, getBaseData, getNextDepartureTimes, getPatternPaths, getStopEstimates, getStopSchedules, getTripPlan, getVehicles } from "aggie-spirit-api";
import { darkMode, lightMode } from "app/theme";
import { getColorScheme } from "app/utils";
import moment from "moment";
import { GetBaseDataResponseSchema, GetNextDepartTimesResponseSchema, GetPatternPathsResponseSchema, GetStopEstimatesResponseSchema, GetStopSchedulesResponseSchema, GetTripPlanResponseSchema, GetVehiclesResponseSchema, IFoundStop, IGetBaseDataResponse, IGetNextDepartTimesResponse, IGetPatternPathsResponse, IGetStopEstimatesResponse, IGetStopSchedulesResponse, IGetVehiclesResponse, IMapRoute, IMapServiceInterruption, IPatternPoint, ITripPlanResponse, IVehicle, SearchSuggestion } from "utils/interfaces";
import "@bacons/text-decoder/install";

export const useAuthCode = () => {
    const query = useQuery<string>({
        queryKey: ["authCode"],
        queryFn: async () => {
            const authCodeB64 = await (await fetch("https://auth.maroonrides.app")).text()
            return atob(authCodeB64)
        },
        staleTime: Infinity,
        refetchInterval: 2 * 3600 * 1000,
    });

    return query;
};

export const useAuthToken = () => {
    const authCodeQuery = useAuthCode();

    const query = useQuery<{[key: string]: string}>({
        queryKey: ["authToken"],
        queryFn: async () => {
            var data = authCodeQuery.data!
            data += "\ngetAuthentication()"
            const headers = await eval(data)
            return headers
        },
        staleTime: Infinity,
        refetchInterval: 2 * 3600 * 1000,
        enabled: authCodeQuery.isSuccess,
    });

    return query;
};


export const useRoutePlanAuthToken = (queryString: string) => {
    const authCodeQuery = useAuthCode();

    const query = useQuery<{[key: string]: string}>({
        queryKey: ["routePlanAuthToken"],
        queryFn: async () => {
            var qsAdded = authCodeQuery.data!.replace("ROUTE_PLAN_QUERY_STRING", queryString)
            qsAdded += "\ngetRoutePlanAuthentication()"
            
            const headers = await eval(qsAdded)
            return headers
        },
        refetchInterval: 2 * 3600 * 1000,
        enabled: authCodeQuery.isSuccess && queryString !== "",
    });

    return query;
};

export const useBaseData = () => {
    const authTokenQuery = useAuthToken();

    const query = useQuery<IGetBaseDataResponse>({
        queryKey: ["baseData"],
        // @ts-ignore: We are modifying the baseData object to add patternPaths
        queryFn: async () => {
            const baseData = await getBaseData(authTokenQuery.data!);

            // go through each route and add a empty array on patternPaths
            // @ts-ignore: We are modifying the baseData object to add patternPaths
            baseData.routes.forEach(route => route.patternPaths = []);

            GetBaseDataResponseSchema.parse(baseData);

            return baseData;
        },
        enabled: authTokenQuery.isSuccess,
        staleTime: Infinity
    });

    return query;
};

export const usePatternPaths = () => {
    const authTokenQuery = useAuthToken();
    const baseDataQuery = useBaseData();

    const query = useQuery<IGetPatternPathsResponse>({
        queryKey: [
            "patternPaths", 
            (baseDataQuery.data as IGetBaseDataResponse)?.routes.map((route) => [
                    route.key, 
                    route.directionList.map((d) => d.direction.key)
                ])
        ],
        queryFn: async () => {
            const baseData = baseDataQuery.data as IGetBaseDataResponse;
            
            const patternPaths = await getPatternPaths(baseData.routes.map(route => route.key), authTokenQuery.data!);
            GetPatternPathsResponseSchema.parse(patternPaths);

            return patternPaths;
        },
        enabled: baseDataQuery.isSuccess,
        staleTime: 2 * 3600 * 1000, // 2 hours
        refetchInterval: 2 * 3600 * 1000, // 2 hours
    });

    return query
};

export const useRoutes = () => {
    const baseDataQuery = useBaseData();
    const patternPathsQuery = usePatternPaths();

    const query = useQuery<IMapRoute[]>({
        queryKey: ["routes"],
        queryFn: async () => {
            const baseData = baseDataQuery.data as IGetBaseDataResponse;
            const patternPaths = patternPathsQuery.data as IGetPatternPathsResponse;
            
            // Merge Pattern Paths with Base Data
            function mergeBaseAndPaths(baseDataRoutes: IMapRoute[], patternPathsResponse: IGetPatternPathsResponse) {
                for (let elm of patternPathsResponse) {
                    const foundObject = baseDataRoutes.find(route => route.key === elm.routeKey) as IMapRoute;
                    if (foundObject) {
                        foundObject.patternPaths = elm.patternPaths;
                    }
                }
                return baseDataRoutes as IMapRoute[];
            }

            let mergedRoutes = JSON.parse(JSON.stringify(mergeBaseAndPaths([...baseData.routes], patternPaths))) as IMapRoute[];
            
            // convert colors of routes based on theme
            const colorTheme = (await getColorScheme()) == "dark" ? darkMode : lightMode

            mergedRoutes = mergedRoutes.map((route) => {
                const originalColor = baseData.routes.find((bRoute) => bRoute.key == route.key)!.directionList[0]?.lineColor!
                route.directionList.forEach(direction => {
                    direction.lineColor = colorTheme.busTints[route.shortName] ?? originalColor;
                })
               

                return route
            });

            return mergedRoutes;
        },
        enabled: patternPathsQuery.isSuccess && baseDataQuery.isSuccess,
        staleTime: 2 * 3600 * 1000, // 2 hours
        refetchInterval: 2 * 3600 * 1000, // 2 hours
    });

    return query;
};

export const useServiceInterruptions = () => {
    const baseDataQuery = useBaseData()

    return useQuery<IMapServiceInterruption[]>({
        queryKey: ["serviceInterruptions"],
        queryFn: async () => {
            const baseData = baseDataQuery.data as IGetBaseDataResponse;
            return baseData.serviceInterruptions;
        },
        enabled: baseDataQuery.isSuccess,
        staleTime: Infinity
    });
};

export const useStopEstimate = (routeKey: string, directionKey: string, stopCode: string) => {
    const authTokenQuery = useAuthToken();

    return useQuery<IGetNextDepartTimesResponse>({
        queryKey: ["stopEstimate", routeKey, directionKey, stopCode],
        queryFn: async () => {    
            const response = await getNextDepartureTimes(routeKey, [directionKey], stopCode, authTokenQuery.data!);
            GetNextDepartTimesResponseSchema.parse(response);

            return response as IGetNextDepartTimesResponse;
        },
        select: (response) => {
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

            return response
        },
        enabled: authTokenQuery.isSuccess && routeKey !== "" && directionKey !== "" && stopCode !== "",
        staleTime: 30000,
        refetchInterval: 30000  
    })
}

export const useTimetableEstimate = (stopCode: string, date: Date) => {
    const authTokenQuery = useAuthToken();

    return useQuery<IGetStopEstimatesResponse>({
        queryKey: ["timetableEstimate", stopCode, moment(date).format("YYYY-MM-DD")],
        queryFn: async () => {    
            const response = await getStopEstimates(stopCode, date, authTokenQuery.data!);
            GetStopEstimatesResponseSchema.parse(response);

            return response
        },
        enabled: authTokenQuery.isSuccess && stopCode !== "" && date !== null,
        staleTime: 30000,
        refetchInterval: 30000  
    })
}

export const useSchedule = (stopCode: string, date: Date) => {
    const authTokenQuery = useAuthToken();

    return useQuery<IGetStopSchedulesResponse>({
        queryKey: ["schedule", stopCode, date],
        queryFn: async () => {
            const stopSchedulesResponse = await getStopSchedules(stopCode, date, authTokenQuery.data!);
            GetStopSchedulesResponseSchema.parse(stopSchedulesResponse);

            return stopSchedulesResponse
        },
        enabled:
            authTokenQuery.isSuccess && 
            stopCode !== "" && 
            date !== null,
        staleTime: Infinity
    })
}

export const useVehicles = (routeKey: string) => {
    const authTokenQuery = useAuthToken();

    return useQuery<IGetVehiclesResponse, Error, IVehicle[]>({
        queryKey: ["vehicles", routeKey],
        queryFn: async () => {
            let busesResponse = await getVehicles([routeKey], authTokenQuery.data!) as IGetVehiclesResponse;
            GetVehiclesResponseSchema.parse(busesResponse);

            return busesResponse
        },
        select: (data: IGetVehiclesResponse): IVehicle[] => {
            if (data.length == 0 || !data[0]?.vehiclesByDirections) {
                return []
            }

            let extracted: IVehicle[] = []
            for (let direction of data[0]?.vehiclesByDirections) {
                for (let bus of direction.vehicles) {
                    extracted.push(bus)
                }
            }

            return extracted;
        },
        enabled: 
            authTokenQuery.isSuccess && 
            routeKey !== "",
        staleTime: 10000,
        refetchInterval: 10000  
    })
}

// Route Planning
export const useSearchSuggestion = (query: string) => {
    const authTokenQuery = useAuthToken();
    const routesQuery = useRoutes();

    return useQuery<any, Error, SearchSuggestion[]>({
        queryKey: ["searchSuggestion", query],
        queryFn: async () => {

            // we need data from pattern paths to get the stop GPS locations
            // This is limitation of the API where we can't get the GPS location of a stop directly
            // we can just ignore the bus stops if we don't have the pattern paths 
            // since Google already has most buildings in their search
            var queryData = authTokenQuery.data!
            queryData = {
                "Cookie": queryData["Cookie"]!,
                "X-Requested-With": queryData["X-Requested-With"]!,
            }

            const stops = await findBusStops(query, queryData)
            
            // handle bus stops
            let busStops: SearchSuggestion[] = []

            busStops = stops.map((stop: IFoundStop) => {
                // find the stop location (lat/long) in baseData patternPaths
                // TODO: convert this processing to be on the BaseData loading
                let foundLocation: IPatternPoint | undefined = undefined;
                for (let route of routesQuery.data!) {
                    for (let path of route.patternPaths) {
                    
                        const stops = path.patternPoints.filter(point => point.stop != null)
                        for (let point of stops) {
                            if (point.stop?.stopCode === stop.stopCode) {
                                foundLocation = point;
                                break;
                            }
                        }
                        if (foundLocation) break;
                    }

                    if (foundLocation) break;
                }

                return {
                    type: "stop",
                    title: foundLocation?.stop?.name ?? "",
                    subtitle: "ID: " + foundLocation?.stop?.stopCode,
                    stopCode: foundLocation?.stop?.stopCode,
                    lat: foundLocation?.latitude,
                    long: foundLocation?.longitude
                }
            });

            return busStops;
        },
        enabled: 
            authTokenQuery.isSuccess && 
            routesQuery.isSuccess &&
            query !== "" ,
        throwOnError: true,
        staleTime: Infinity
    });
}

export const useTripPlan = (origin: SearchSuggestion | null, destination: SearchSuggestion | null, date: Date, deadline: "leave" | "arrive") => {
    // build the query string
    // ?o1=Commons&osc=0100&d1=HEEP&dsc=0108&dt=1736392200&ro=0
    let queryString = ""
    if (origin && destination) {
        if (origin.title == "My Location") {
            queryString = `Results?o1=${origin.title}&ola=${origin.lat}&olo=${origin.long}&og=1&d1=${destination.title}&dsc=${destination.stopCode}&dt=${(date.getTime() / 1000).toFixed(0)}&ro=0`
        }
        else if (destination.title == "My Location") {
            queryString = `Results?o1=${origin.title}&osc=${origin.stopCode}&d1=${destination.title}&dla=${origin.lat}&dlo=${origin.long}&dg=true&dt=${(date.getTime() / 1000).toFixed(0)}&ro=0`
        } else {
            queryString = `Results?o1=${origin.title}&osc=${origin.stopCode}&d1=${destination.title}&dsc=${destination.stopCode}&dt=${(date.getTime() / 1000).toFixed(0)}&ro=0`
        }
    }
    
    const routePlanAuthToken = useRoutePlanAuthToken(queryString);

    return useQuery<ITripPlanResponse>({
        queryKey: ["tripPlan", origin, destination, date, deadline],
        queryFn: async () => {
            let response = await getTripPlan(
                                routePlanAuthToken.data!,
                                origin!, 
                                destination!, 
                                0,
                                deadline == "arrive" ? date : undefined,
                                deadline == "leave" ? date : undefined,
                            );

            GetTripPlanResponseSchema.parse(response);

            // @ts-expect-error: Types are wrong in lib
            return response as ITripPlanResponse;        
        },
        enabled: 
            routePlanAuthToken.isSuccess &&
            origin !== null &&
            destination !== null &&
            date !== null &&
            deadline !== null,
        staleTime: 60000, // 2 minutes
        throwOnError: true
    });
}

export default useAuthToken;