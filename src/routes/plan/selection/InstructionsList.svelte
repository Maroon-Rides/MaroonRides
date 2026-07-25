<script lang="ts">
  import type { WalkingInstruction } from '$lib/data/types';

  type Props = {
    instructions: WalkingInstruction[];
  };

  let { instructions }: Props = $props();

  // strips the inline html the API returns while keeping <b>, so the markup below is the only thing @html renders
  const domParser = new DOMParser();
  const format = (s: string) => {
    s = s.replaceAll(/<b>(.*?)<\/b>/g, '**$1**'); //protect bolds from the strip
    s = domParser.parseFromString(s, 'text/html').body.textContent ?? ''; //strip
    s = s.replaceAll(/\*\*(.*?)\*\*/g, '<b>$1</b>'); //reinsert bold
    s = s.replace(/Destination(.+)$/g, '<br><b>Destination$1</b>'); //separate "Destination will be..." line
    return s;
  };
  const formattedContent = $derived(instructions.map((instr) => format(instr.instruction)));
</script>

<ul class="flex flex-col rounded-lg bg-muted p-3">
  {#each instructions as instr, i}
    <li class="text-left text-xs">
      {instr.stepNumber}. {@html formattedContent[i]}
    </li>
  {/each}
</ul>
