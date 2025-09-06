import { createContext, useContext } from 'react';

export enum Sheets {
  ROUTE_LIST = 'routeList',
  ALERTS = 'alerts',
  ROUTE_DETAILS = 'routeDetails',
  STOP_TIMETABLE = 'stopTimetable',
  SETTINGS = 'settings',
  ALERTS_DETAIL = 'alertsDetail',
  INPUT_ROUTE = 'inputRoute',
  TRIP_PLAN_DETAIL = 'tripPlanDetail',
}

export const SheetControllerContext = createContext<{
  presentSheet: (sheet: Sheets) => void;
  dismissSheet: (sheet: Sheets) => void;
} | null>(null);

export const useSheetController = () => {
  const ctx = useContext(SheetControllerContext);
  if (!ctx) throw new Error('useParent must be used inside ParentContext');
  return ctx;
};

export default useSheetController;
