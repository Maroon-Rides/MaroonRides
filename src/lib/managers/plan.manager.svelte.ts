import type { TripItinerary } from '$lib/api/client';
import { useStopSearch, useTripPlan } from '$lib/data/route_planning';
import {
  Deadline,
  MyLocation,
  PlaceType,
  type Location,
  type PlaceSuggestion,
} from '$lib/data/types';
import { Geolocation } from '@capacitor/geolocation';
import type { CreateQueryResult } from '@tanstack/svelte-query';
import { sortBy } from 'lodash-es';
import { DateTime } from 'luxon';
import { Debounced, resource, type ResourceReturn } from 'runed';

type EndpointKey = 'start' | 'end';

const SEARCH_DEBOUNCE_MS = 250;

class PlanEndpoint {
  location = $state<PlaceSuggestion | null>(null);
  searchTerm = $state('');

  isMyLocation = $derived(this.location?.type === PlaceType.MY_LOCATION);

  select(place: PlaceSuggestion | null) {
    this.location = place;
    this.searchTerm = place?.name ?? '';
  }

  focus() {
    if (this.isMyLocation) this.searchTerm = '';
    this.location = null;
  }
}

// A position read for a choice the user has since changed is dropped instead of applied.
async function currentPosition(signal: AbortSignal): Promise<Location> {
  const { coords } = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
  if (signal.aborted) throw new DOMException('Position no longer needed', 'AbortError');
  return { latitude: coords.latitude, longitude: coords.longitude };
}

class PlanManager {
  start = $state(new PlanEndpoint());
  end = $state(new PlanEndpoint());

  activeInput = $state<EndpointKey | null>(null);
  planTime = $state<DateTime>(DateTime.now());
  deadline = $state<Deadline>(Deadline.LEAVE_BY);
  selectedPlan = $state<TripItinerary | null>(null);
  shownInstruction = $state(-1);

  suggestionsQuery = $state<CreateQueryResult<PlaceSuggestion[], Error> | null>(null);
  tripPlanQuery = $state<CreateQueryResult<TripItinerary[], Error> | null>(null);
  searchQuery = $state<Debounced<string> | null>(null);
  myLocation = $state<ResourceReturn<Location | undefined> | null>(null);

  activeEndpoint = $derived(this.activeInput ? this[this.activeInput] : null);
  activeSearchTerm = $derived(this.activeEndpoint?.searchTerm ?? '');
  showMyLocation = $derived(!!this.activeEndpoint && !this.activeEndpoint.searchTerm);

  wantsMyLocation = $derived(this.start.isMyLocation || this.end.isMyLocation);
  needsMyLocation = $derived(this.wantsMyLocation && !this.myLocation?.current);
  locationError = $derived(this.wantsMyLocation && !!this.myLocation?.error);
  awaitingLocation = $derived(
    !this.activeInput && !!this.start.location && !!this.end.location && this.needsMyLocation,
  );
  origin = $derived(this.#withMyLocation(this.start.location));
  destination = $derived(this.#withMyLocation(this.end.location));

  searchPending = $derived(!!this.searchQuery?.pending);

  suggestions = $derived(this.activeSearchTerm.trim() ? (this.suggestionsQuery?.data ?? []) : []);
  plans = $derived(sortBy(this.tripPlanQuery?.data ?? [], 'arriveAt'));

  error = $derived.by(() => {
    if (this.activeInput) {
      if (this.showMyLocation) return null;
      if (this.suggestionsQuery?.isError) return 'Failed to load locations';
      if (this.searchPending || this.suggestionsQuery?.isLoading || this.suggestions.length)
        return null;
      return 'No locations found';
    }

    if (!this.start.location || !this.end.location) return null;
    if (this.start.location.name === this.end.location.name)
      return 'Start and End locations cannot be the same';
    if (this.locationError) return 'Location Unavailable. Enable Location permissions in Settings.';
    if (this.tripPlanQuery?.isError) return 'Failed to load routes';
    if (this.awaitingLocation || this.tripPlanQuery?.isLoading || this.plans.length) return null;
    return 'No routes found';
  });
  loading = $derived(
    !this.error &&
      !!(
        this.awaitingLocation ||
        this.tripPlanQuery?.isLoading ||
        this.suggestionsQuery?.isLoading ||
        this.searchPending
      ),
  );

  constructor() {
    this.reset();
  }

  #withMyLocation(place: PlaceSuggestion | null): PlaceSuggestion | null {
    if (place?.type !== PlaceType.MY_LOCATION) return place;
    return { ...place, location: this.myLocation?.current };
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
  hasBus(plan: TripItinerary) {
    return (plan.legs ?? []).some((leg) => leg.type === 'ride');
  }

  reset() {
    this.searchQuery?.setImmediately('');
    this.start.select({ ...MyLocation });
    this.end.select(null);
    this.activeInput = null;
    this.planTime = DateTime.now();
    this.deadline = Deadline.LEAVE_BY;
    this.selectedPlan = null;
    this.shownInstruction = -1;
    this.suggestionsQuery = null;
    this.tripPlanQuery = null;
  }
}

export function usePlanState() {
  planManager.searchQuery = new Debounced(() => planManager.activeSearchTerm, SEARCH_DEBOUNCE_MS);
  planManager.myLocation = resource(
    () => planManager.wantsMyLocation,
    (wanted, _, { signal }) => (wanted ? currentPosition(signal) : Promise.resolve(undefined)),
  );
  planManager.suggestionsQuery = useStopSearch(() => ({
    query: planManager.searchQuery?.current ?? '',
  }));
  planManager.tripPlanQuery = useTripPlan(() => ({
    origin: planManager.origin,
    destination: planManager.destination,
    date: planManager.planTime.toJSDate(),
    deadline: planManager.deadline,
  }));
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
