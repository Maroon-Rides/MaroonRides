<script lang="ts">
  import RouteBubble from '$lib/components/RouteBubble.svelte';
  import MarkerPopup from '$lib/components/ui/map/MarkerPopup.svelte';
  import { Amenity, type Bus } from '$lib/data/types';

  type Props = {
    bus: Bus;
  };

  let { bus }: Props = $props();
</script>

<MarkerPopup class="flex flex-col gap-3 rounded-xl p-3">
  <div class="flex items-center justify-between gap-10">
    <div class="flex items-center gap-2 rounded-md bg-muted pe-2">
      <RouteBubble type={'calloutIcon'} route={bus.route} />
      <span class="text-xs font-bold text-muted-foreground">{bus.name}</span>
    </div>

    <div class="flex items-center gap-2">
      {#each bus.amenities as amenity}
        {@const AmenityIcon = Amenity.getIcon(amenity)}
        <AmenityIcon class="size-6" />
      {/each}
    </div>
  </div>

  <div class="flex items-center justify-between">
    <span class="text-xs font-bold text-muted-foreground">{bus.capacity}% Full</span>
    <span class="text-xs font-bold text-muted-foreground">
      {Math.round(bus.speed)} MPH
    </span>
  </div>
</MarkerPopup>
