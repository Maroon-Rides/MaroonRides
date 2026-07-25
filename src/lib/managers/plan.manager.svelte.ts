import { useSearchSuggestions, useTripPlan } from '$lib/data/route_planning';
import {
  MovementType,
  MyLocation,
  PlaceType,
  type PlaceSuggestion,
  type PlanItem,
} from '$lib/data/types';
import { Geolocation } from '@capacitor/geolocation';
import type { CreateQueryResult } from '@tanstack/svelte-query';
import { DateTime } from 'luxon';

type EndpointKey = 'start' | 'end';

class PlanEndpoint {
  location = $state<PlaceSuggestion | null>(null);
  searchTerm = $state('');

  isMyLocation = $derived(this.location?.type === PlaceType.MY_LOCATION);
  needsMyLocation = $derived(this.isMyLocation && !this.location?.location);

  select(place: PlaceSuggestion | null) {
    this.location = place;
    this.searchTerm = place?.name ?? '';
  }

  focus() {
    if (this.isMyLocation) this.searchTerm = '';
    this.location = null;
  }
}

class PlanManager {
  start = $state(new PlanEndpoint());
  end = $state(new PlanEndpoint());

  activeInput = $state<EndpointKey | null>(null);
  planTime = $state<DateTime>(DateTime.now());
  deadline = $state<'leave' | 'arrive'>('leave');
  selectedPlan = $state<PlanItem | null>(null);
  shownInstruction = $state(-1);
  locationDenied = $state(false);

  suggestionsQuery = $state<CreateQueryResult<PlaceSuggestion[], Error> | null>(null);
  tripPlanQuery = $state<CreateQueryResult<PlanItem[], Error> | null>(null);

  #locationSeq = 0;

  activeEndpoint = $derived(this.activeInput ? this[this.activeInput] : null);
  activeSearchTerm = $derived(this.activeEndpoint?.searchTerm ?? '');
  showMyLocation = $derived(!!this.activeEndpoint && !this.activeEndpoint.searchTerm);
  needsMyLocation = $derived(this.start.needsMyLocation || this.end.needsMyLocation);
  locationError = $derived(
    (this.start.isMyLocation || this.end.isMyLocation) && this.locationDenied,
  );

  suggestions = $derived(this.activeSearchTerm.trim() ? (this.suggestionsQuery?.data ?? []) : []);
  plans = $derived([...(this.tripPlanQuery?.data ?? [])].sort((a, b) => a.endTime - b.endTime));

  error = $derived.by(() => {
    if (this.activeInput) {
      if (this.showMyLocation) return null;
      if (this.suggestionsQuery?.isError) return 'Failed to load locations';
      if (this.suggestionsQuery?.isLoading || this.suggestions.length) return null;
      return 'No locations found';
    }

    if (!this.start.location || !this.end.location) return null;
    if (this.start.location.name === this.end.location.name)
      return 'Start and End locations cannot be the same';
    if (this.locationError) return 'Location Unavailable. Enable Location permissions in Settings.';
    if (this.tripPlanQuery?.isError) return 'Failed to load routes';
    if (this.tripPlanQuery?.isLoading || this.plans.length) return null;
    return 'No routes found';
  });
  loading = $derived(
    !this.error && !!(this.tripPlanQuery?.isLoading || this.suggestionsQuery?.isLoading),
  );

  constructor() {
    this.reset();
  }

  focus(which: EndpointKey) {
    this[which].focus();
    this.activeInput = which;
  }
  selectSuggestion(place: PlaceSuggestion) {
    this.activeEndpoint?.select(place);
    this.activeInput = null;
  }
  swapLocations() {
    [this.start, this.end] = [this.end, this.start];
    this.activeInput = null;
  }
  hasBus(plan: PlanItem) {
    return plan.instructions.some((i) => i.movementType === MovementType.BUS);
  }

  async resolveMyLocation() {
    if (!this.needsMyLocation) return;
    const seq = ++this.#locationSeq;
    this.locationDenied = false;
    try {
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      if (seq !== this.#locationSeq) return;

      const resolved: PlaceSuggestion = {
        ...MyLocation,
        location: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
      };
      for (const endpoint of [this.start, this.end])
        if (endpoint.needsMyLocation) endpoint.location = resolved;
    } catch {
      if (seq !== this.#locationSeq) return;
      this.locationDenied = true;
    }
  }

  reset() {
    this.start.select({ ...MyLocation });
    this.end.select(null);
    this.activeInput = null;
    this.planTime = DateTime.now();
    this.deadline = 'leave';
    this.selectedPlan = null;
    this.shownInstruction = -1;
    this.locationDenied = false;
    this.suggestionsQuery = null;
    this.tripPlanQuery = null;
  }
}

export function usePlanState() {
  planManager.suggestionsQuery = useSearchSuggestions(() => ({
    query: planManager.activeSearchTerm,
  }));
  planManager.tripPlanQuery = useTripPlan(() => ({
    origin: planManager.start.location,
    destination: planManager.end.location,
    date: planManager.planTime.toJSDate(),
    deadline: planManager.deadline,
  }));

  $effect(() => {
    if (planManager.needsMyLocation) planManager.resolveMyLocation();
  });
}

let planManager: PlanManager;

if (import.meta.hot && import.meta.hot.data) {
  if (!import.meta.hot.data.planManager) {
    import.meta.hot.data.planManager = new PlanManager();
  }
  planManager = import.meta.hot.data.planManager;
} else {
  planManager = new PlanManager();
}

export { planManager };
