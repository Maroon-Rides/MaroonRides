import { NextDepartureTimesResponse } from "aggie-spirit-api";

export interface CachedStopEstimate {
    stopCode: string,
    departureTimes: NextDepartureTimesResponse
}