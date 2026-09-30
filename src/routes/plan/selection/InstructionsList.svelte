<script lang="ts">
  import type { WalkingInstruction } from '$lib/data/types';
  import { cn } from '$lib/utils';

  type Props = {
    instructions: WalkingInstruction[];
  };

  let { instructions }: Props = $props();

  // Strips the API's inline HTML but keeps <b>, so @html renders only the markup added here.
  const domParser = new DOMParser();
  const strip = (s: string) => {
    s = s.replaceAll(/<b>(.*?)<\/b>/gs, '**$1**');
    s = domParser.parseFromString(s, 'text/html').body.textContent ?? '';
    return s.replaceAll(/\*\*(.*?)\*\*/gs, '<b>$1</b>').trim();
  };

  // A step can end in <div> notes like "Pass by ..." or "Destination will be on the left".
  // They get their own lines, and only the destination note is emphasized.
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
