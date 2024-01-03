import { StopEstimatesResponse } from "aggie-spirit-api";

export interface CachedStopEstimate {
    stopCode: string,
    stopEstimate: StopEstimatesResponse
}