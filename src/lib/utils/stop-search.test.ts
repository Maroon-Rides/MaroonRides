import { describe, expect, it } from 'vitest';
import { toStopSuggestions } from './stop-search';

describe('toStopSuggestions', () => {
  const match = (id: string, name: string, routeCode: string) => ({
    id,
    name,
    lat: 1,
    lon: 2,
    routeCode,
  });

  it('collapses a stop served by several directions into one place listing its routes', () => {
    const [msc, ...rest] = toStopSuggestions(
      [match('a', 'MSC', '27'), match('b', 'MSC', '01'), match('c', 'MSC', '27')],
      'msc',
    );

    expect(rest).toHaveLength(0);
    expect(msc).toMatchObject({ id: 'a', name: 'MSC', description: 'Routes 01, 27' });
  });

  it('ranks names starting with the query first', () => {
    const names = toStopSuggestions(
      [match('a', 'Asbury @ MSC', '01'), match('b', 'MSC', '27')],
      'msc',
    ).map((p) => p.name);

    expect(names).toEqual(['MSC', 'Asbury @ MSC']);
  });
});
