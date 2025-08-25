import { z } from 'zod';

export const HereItem = z.object({
  id: z.string(),
  title: z.string(),
  resultType: z.string(),
  distance: z.number().optional(),
  address: z
    .object({
      label: z.string().optional(),
      countryCode: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      houseNumber: z.string().optional(),
      street: z.string().optional(),
    })
    .optional(),
  position: z.object({ lat: z.number(), lng: z.number() }),
});

export const HereSearchResponse = z.object({
  items: z.array(HereItem).default([]),
});
