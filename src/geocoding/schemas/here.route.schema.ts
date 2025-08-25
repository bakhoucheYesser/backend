import { z } from 'zod';

export const HereRouteResponse = z.object({
  routes: z
    .array(
      z.object({
        sections: z.array(
          z.object({
            summary: z.object({
              duration: z.number(),
              length: z.number(),
            }),
            polyline: z.string(),
          }),
        ),
      }),
    )
    .default([]),
});
