import { z } from 'zod';
import { HereItem } from './here.search.schema';

export const HereReverseResponse = z.object({
  items: z.array(HereItem).default([]),
});