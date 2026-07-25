import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  return {
    routeId: params.id,
    stopId: params.stop,
    directionId: params.direction,
  };
};
