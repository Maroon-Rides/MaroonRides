import { Sheets } from 'src/app/components/providers/sheet-controller';
import { Theme, lightMode } from 'src/app/theme';
import { create } from 'zustand';
import { Alert, Direction, Route, Stop } from './datatypes';
import { IOptionDetail, SearchSuggestion } from './utils/interfaces';

interface AppState {
  theme: Theme;
  setTheme: (theme: Theme) => void;

  drawnRoutes: Route[];
  setDrawnRoutes: (routes: Route[]) => void;

  selectedRoute: Route | null;
  setSelectedRoute: (selectedRoute: Route | null) => void;
  clearSelectedRoute: () => void;

  selectedDirection: Direction | null;
  setSelectedDirection: (selectedDirection: Direction | null) => void;

  selectedRouteCategory: 'Favorites' | 'All Routes' | 'Gameday';
  setSelectedRouteCategory: (
    selectedRouteCategory: 'Favorites' | 'All Routes' | 'Gameday',
  ) => void;

  selectedStop: Stop | null;
  setSelectedStop: (selectedStop: Stop | null) => void;

  sheetCloseCallback: {
    [key in Sheets]: () => void;
  };
  setSheetCloseCallback: (fn: () => void, key: Sheets) => void;
  callSheetCloseCallback: (key: Sheets) => void;

  selectedAlert: Alert | null;
  setSelectedAlert: (selectedAlert: Alert | null) => void;

  selectedTimetableDate: Date | null;
  setSelectedTimetableDate: (selectedTimetableDate: Date | null) => void;

  zoomToStopLatLng: (lat: number, lng: number) => void;
  setZoomToStopLatLng: (
    zoomToStopLatLng: (lat: number, lng: number) => void,
  ) => void;

  poppedUpStopCallout: Stop | null;
  setPoppedUpStopCallout: (poppedUpStopCallout: Stop | null) => void;

  scrollToStop: (stop: Stop) => void;
  setScrollToStop: (scrollToStop: (stop: Stop) => void) => void;

  // route planning
  suggestions: SearchSuggestion[];
  setSuggestions: (suggestions: SearchSuggestion[]) => void;

  suggestionOutput: 'start' | 'end' | null;
  setSuggestionOutput: (suggestionOutput: 'start' | 'end' | null) => void;

  selectedRoutePlan: IOptionDetail | null;
  setSelectedRoutePlan: (selectedRoutePlan: IOptionDetail | null) => void;

  selectedRoutePlanPathPart: number;
  setSelectedRoutePlanPathPart: (selectedRoutePlanPathPart: number) => void;
}

const useAppStore = create<AppState>()((set, get) => ({
  theme: lightMode,
  setTheme: (theme) => set(() => ({ theme })),

  drawnRoutes: [],
  setDrawnRoutes: (routes) => set(() => ({ drawnRoutes: routes })),

  selectedRoute: null,
  setSelectedRoute: (selectedRoute) => set(() => ({ selectedRoute })),
  clearSelectedRoute: () => set(() => ({ selectedRoute: null })),

  selectedDirection: null,
  setSelectedDirection: (selectedDirection) =>
    set(() => ({ selectedDirection })),

  selectedRouteCategory: 'All Routes',
  setSelectedRouteCategory: (selectedRouteCategory) =>
    set(() => ({ selectedRouteCategory })),

  selectedStop: null,
  setSelectedStop: (selectedStop) => set(() => ({ selectedStop })),

  selectedTimetableDate: null,
  setSelectedTimetableDate: (selectedTimetableDate) =>
    set(() => ({ selectedTimetableDate })),

  sheetCloseCallback: {
    routeDetails: function (): void {
      // console.log("not implemented")
    },
    alerts: function (): void {
      // console.log("not implemented")
    },
    stopTimetable: function (): void {
      // console.log("not implemented")
    },
    settings: function (): void {
      // console.log("not implemented")
    },
    alertsDetail: function (): void {
      // console.log("not implemented")
    },
    inputRoute: function (): void {
      // console.log("not implemented")
    },
    tripPlanDetail: function (): void {
      // console.log("not implemented")
    },
    routeList: function (): void {
      // console.log("not implemented")
    },
  },
  setSheetCloseCallback: (fn, key) =>
    set((state) => ({
      sheetCloseCallback: {
        ...state.sheetCloseCallback,
        [key]: fn,
      },
    })),
  callSheetCloseCallback: (key) => {
    const callback = get().sheetCloseCallback[key];
    if (callback) {
      callback();
    } else {
      console.warn(`No callback found for key: ${key}`);
    }
  },

  selectedAlert: null,
  setSelectedAlert: (selectedAlert) => set(() => ({ selectedAlert })),

  zoomToStopLatLng: (lat, lng) => {
    console.log(lat + ' ' + lng);
  },
  setZoomToStopLatLng: (zoomToStopLatLng) => set(() => ({ zoomToStopLatLng })),

  poppedUpStopCallout: null,
  setPoppedUpStopCallout: (poppedUpStopCallout) =>
    set(() => ({ poppedUpStopCallout })),

  scrollToStop: (stop) => {
    console.log(stop);
  },
  setScrollToStop: (scrollToStop) =>
    set(() => ({ scrollToStop: scrollToStop })),

  // route planning
  suggestions: [],
  setSuggestions: (suggestions) => set(() => ({ suggestions })),

  suggestionOutput: null,
  setSuggestionOutput: (suggestionOutput) => set(() => ({ suggestionOutput })),

  selectedRoutePlan: null,
  setSelectedRoutePlan: (selectedRoutePlan) =>
    set(() => ({ selectedRoutePlan })),

  // the index of what part of polyline to show
  // -1 means show all parts
  selectedRoutePlanPathPart: -1,
  setSelectedRoutePlanPathPart: (selectedRoutePlanPathPart) =>
    set(() => ({ selectedRoutePlanPathPart })),
}));

export default useAppStore;
