export function getLighterColor(color: string): string {
  color = color.substring(1);

  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  const lightenedR = Math.min(r + 100, 255);
  const lightenedG = Math.min(g + 100, 255);
  const lightenedB = Math.min(b + 100, 255);

  const lightenedColor =
    lightenedR.toString(16).padStart(2, '0') +
    lightenedG.toString(16).padStart(2, '0') +
    lightenedB.toString(16).padStart(2, '0');

  return '#' + lightenedColor;
}
