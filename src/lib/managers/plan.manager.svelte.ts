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
import { sortBy } from 'lodash-es';
import { DateTime } from 'luxon';
import { Debounced, resource } from 'runed';

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

  clear() {
    this.location = null;
  }
}

// A position read for a choice the user has since changed is dropped instead of applied.
async function currentPosition(signal: AbortSignal): Promise<Location> {
  const { coords } = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
  if (signal.aborted) throw new DOMException('Position no longer needed', 'AbortError');
  return { latitude: coords.latitude, longitude: coords.longitude };
}

/** The searches and lookups behind the plan page. They live as long as the page that made them. */
class PlanQueries {
  readonly debouncedSearchTerm: Debounced<string>;
  readonly myLocation;
  readonly suggestions;
  readonly tripPlan;

  constructor(plan: PlanManager) {
    this.debouncedSearchTerm = new Debounced(() => plan.activeSearchTerm, SEARCH_DEBOUNCE_MS);
    this.myLocation = resource(
      () => plan.wantsMyLocation,
      (wanted, _, { signal }) => (wanted ? currentPosition(signal) : Promise.resolve(undefined)),
    );
    this.suggestions = useStopSearch(() => ({ query: this.debouncedSearchTerm.current }));
    this.tripPlan = useTripPlan(() => ({
      origin: plan.origin,
      destination: plan.destination,
      date: plan.planTime.toJSDate(),
      deadline: plan.deadline,
    }));
  }
}

class PlanManager {
  start = $state(new PlanEndpoint());
  end = $state(new PlanEndpoint());

  activeInput = $state<EndpointKey | null>(null);
  planTime = $state<DateTime>(DateTime.now());
  deadline = $state<Deadline>(Deadline.LEAVE_BY);
  selectedPlan = $state<TripItinerary | null>(null);
  shownInstruction = $state<number | null>(null);

  #queries = $state<PlanQueries | null>(null);

  activeEndpoint = $derived(this.activeInput ? this[this.activeInput] : null);
  activeSearchTerm = $derived(this.activeEndpoint?.searchTerm ?? '');
  showMyLocation = $derived(!!this.activeEndpoint && !this.activeEndpoint.searchTerm);

  wantsMyLocation = $derived(this.start.isMyLocation || this.end.isMyLocation);
  locationError = $derived(this.wantsMyLocation && !!this.#queries?.myLocation.error);
  awaitingLocation = $derived(
    !this.activeInput &&
      !!this.start.location &&
      !!this.end.location &&
      this.wantsMyLocation &&
      !this.#queries?.myLocation.current,
  );
  origin = $derived(this.#withMyLocation(this.start.location));
  destination = $derived(this.#withMyLocation(this.end.location));

  searchPending = $derived(!!this.#queries?.debouncedSearchTerm.pending);

  suggestions = $derived(
    this.activeSearchTerm.trim() ? (this.#queries?.suggestions.data ?? []) : [],
  );
  plans = $derived(sortBy(this.#queries?.tripPlan.data ?? [], 'arriveAt'));

  error = $derived.by(() => {
    const suggestions = this.#queries?.suggestions;
    const tripPlan = this.#queries?.tripPlan;

    if (this.activeInput) {
      if (this.showMyLocation) return null;
      if (suggestions?.isError) return 'Failed to load locations';
      if (this.searchPending || suggestions?.isLoading || this.suggestions.length) return null;
      return 'No locations found';
    }

    if (!this.start.location || !this.end.location) return null;
    if (this.start.location.name === this.end.location.name)
      return 'Start and End locations cannot be the same';
    if (this.locationError) return 'Location Unavailable. Enable Location permissions in Settings.';
    if (tripPlan?.isError) return 'Failed to load routes';
    if (this.awaitingLocation || tripPlan?.isLoading || this.plans.length) return null;
    return 'No routes found';
  });
  loading = $derived(
    !this.error &&
      !!(
        this.awaitingLocation ||
        this.#queries?.tripPlan.isLoading ||
        this.#queries?.suggestions.isLoading ||
        this.searchPending
      ),
  );

  constructor() {
    this.reset();
  }

  #withMyLocation(place: PlaceSuggestion | null): PlaceSuggestion | null {
    if (place?.type !== PlaceType.MY_LOCATION) return place;
    return { ...place, location: this.#queries?.myLocation.current };
  }

  /** Starts the plan page's searches. Call it while the page mounts. */
  attachQueries() {
    this.#queries = new PlanQueries(this);
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

  reset() {
    this.start.select({ ...MyLocation });
    this.end.select(null);
    this.activeInput = null;
    this.planTime = DateTime.now();
    this.deadline = Deadline.LEAVE_BY;
    this.selectedPlan = null;
    this.shownInstruction = null;
  }
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
