import { z } from 'zod';

export const NearbyHospitalsQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

export type NearbyHospitalsQueryDto = z.infer<typeof NearbyHospitalsQuerySchema>;
