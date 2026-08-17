import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  return {
    routeCode: params.routeCode,
    stopId: params.stop,
    directionId: params.direction,
  };
};
