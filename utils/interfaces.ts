export interface IBusRoute {
    id: string,
    name: string,
    color: string,
    onCampus: boolean,
    shortName: string // text to show in colored icons
}

export interface IBusRoute {
    key: string
    name: string
    shortName: string
    description?: string
    category: "On Campus" | "Off Campus" | "Gameday"
    endpointName: string
    routeInfo: {
        routeKey: string
        color: string
        patternPaths: {
            patternKey: string
            patternPoints: [
                {
                    key: string
                    name: string
                    description?: string
                    rank: number
                    longitude: number
                    latitude: number
                    isStop: boolean
                    isTimePoint: boolean
                    routeHeaderRank: number
                    distanceToPreviousPoint: number
                    stop: {
                        key: string
                        name: string
                        stopCode: number
                        isTemporary: boolean
                        attributes: any[]
                    }
                }
            ]
        }[]
    }
    routePatterns: [
        {
            key: string
            name: string
            shortName: number
            description?: string
            direction: {
                key: string
                name: string
            }
            destination: string
            lineDisplayInfo: {
                color: string
                type: number
                symbol: number
                size: number
            }
            timePointDisplayInfo: {
                color: string
                type: number
                symbol: number
                size: number
            }
            busStopDisplayInfo: {
                color: string
                type: number
                symbol: number
                size: number
                isDisplay: boolean
            }
        }
    ]
}

export interface ITimeTableData {
    [location: string]: Date[];
  }
  
export interface ITimeTable {
    [date: string]: ITimeTableData;
}