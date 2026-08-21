<script lang="ts">
  import type { WalkingInstruction } from '$lib/data/types';
  import { cn } from '$lib/utils';

  type Props = {
    instructions: WalkingInstruction[];
  };

  let { instructions }: Props = $props();

  // strips the inline html the API returns while keeping <b>, so the markup below is the only thing @html renders
  const domParser = new DOMParser();
  const strip = (s: string) => {
    s = s.replaceAll(/<b>(.*?)<\/b>/gs, '**$1**'); //protect bolds from the strip
    s = domParser.parseFromString(s, 'text/html').body.textContent ?? ''; //strip
    return s.replaceAll(/\*\*(.*?)\*\*/gs, '<b>$1</b>').trim(); //reinsert bold
  };

  // a step is "Turn <b>left</b> onto <b>Hensel St</b>" plus zero or more <div> disclosures, so
  // split those off instead of leaving them inline. "Destination will be on the left" is the one
  // the rider is actually looking for, so it keeps the emphasis the advisory ones
  // ("Restricted usage road", "Pass by ...") don't get
  const format = (s: string) => {
    const notes: { text: string; isDestination: boolean }[] = [];
    const text = strip(
      s.replaceAll(/<div[^>]*>(.*?)<\/div>/gs, (_, note: string) => {
        const stripped = strip(note);
        if (stripped)
          notes.push({ text: stripped, isDestination: /^Destination\b/.test(stripped) });
        return '';
      }),
    );
    return { text, notes };
  };
  const formattedContent = $derived(instructions.map((instr) => format(instr.instruction)));
</script>

<ul class="flex flex-col rounded-lg bg-muted p-3">
  {#each instructions as instr, i}
    <li class="text-left text-xs">
      {instr.stepNumber}. {@html formattedContent[i].text}
      {#each formattedContent[i].notes as note}
        <div
          class={cn(
            'pl-3 text-[0.9em] text-muted-foreground',
            note.isDestination && 'pl-0 text-xs font-semibold text-foreground',
          )}
        >
          {@html note.text}
        </div>
      {/each}
    </li>
  {/each}
</ul>
