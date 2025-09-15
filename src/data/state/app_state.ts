import {
  Alert,
  Direction,
  PlaceSuggestion,
  PlanItem,
  Route,
  Stop,
} from '@data/types';
import { Theme, lightMode } from 'src/app/theme';
import { create } from 'zustand';

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

  selectedAlert: Alert | null;
  setSelectedAlert: (selectedAlert: Alert | null) => void;

  zoomToStopLatLng: (lat: number, lng: number) => void;
  setZoomToStopLatLng: (
    zoomToStopLatLng: (lat: number, lng: number) => void,
  ) => void;

  poppedUpStopCallout: Stop | null;
  setPoppedUpStopCallout: (poppedUpStopCallout: Stop | null) => void;

  scrollToStop: (stop: Stop) => void;
  setScrollToStop: (scrollToStop: (stop: Stop) => void) => void;

  // route planning
  suggestions: PlaceSuggestion[];
  setSuggestions: (suggestions: PlaceSuggestion[]) => void;

  suggestionOutput: 'start' | 'end' | null;
  setSuggestionOutput: (suggestionOutput: 'start' | 'end' | null) => void;

  selectedRoutePlan: PlanItem | null;
  setSelectedRoutePlan: (selectedRoutePlan: PlanItem | null) => void;

  selectedRoutePlanPathPart: number;
  setSelectedRoutePlanPathPart: (selectedRoutePlanPathPart: number) => void;
}

const useAppStore = create<AppState>()((set) => ({
  theme: lightMode,
  setTheme: (theme) => set(() => ({ theme })),

  drawnRoutes: [],
  setDrawnRoutes: (routes) => set(() => ({ drawnRoutes: routes })),

  selectedRoute: null,
  setSelectedRoute: (selectedRoute) =>
    set(() => ({
      selectedRoute,
      selectedDirection: selectedRoute?.directions[0] ?? null,
    })),
  clearSelectedRoute: () =>
    set(() => ({ selectedRoute: null, selectedDirection: null })),

  selectedDirection: null,
  setSelectedDirection: (selectedDirection) =>
    set(() => ({ selectedDirection })),

  selectedRouteCategory: 'All Routes',
  setSelectedRouteCategory: (selectedRouteCategory) =>
    set(() => ({ selectedRouteCategory })),

  selectedStop: null,
  setSelectedStop: (selectedStop) => set(() => ({ selectedStop })),

  selectedAlert: null,
  setSelectedAlert: (selectedAlert) => set(() => ({ selectedAlert })),

  zoomToStopLatLng: () => {},
  setZoomToStopLatLng: (zoomToStopLatLng) => set(() => ({ zoomToStopLatLng })),

  poppedUpStopCallout: null,
  setPoppedUpStopCallout: (poppedUpStopCallout) =>
    set(() => ({ poppedUpStopCallout })),

  scrollToStop: () => {},
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
