<script lang="ts">
  import { cn } from '$lib/utils.js';
  import { Dialog as DialogPrimitive } from 'bits-ui';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: DialogPrimitive.TitleProps = $props();
</script>

<DialogPrimitive.Title
  bind:ref
  data-slot="dialog-title"
  class={cn('pe-6 text-base font-semibold', className)}
  {...restProps}
>
  {@render children?.()}
</DialogPrimitive.Title>
