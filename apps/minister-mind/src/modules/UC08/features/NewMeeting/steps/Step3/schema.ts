import { z } from 'zod';

export const step3Schema = z.object({
  selectedEvent: z
    .object({
      id: z.string(),
      type: z.enum(['reserved', 'optional', 'compulsory']),
      label: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      date: z.date(),
      title: z.string().optional(),
    })
    .optional(),
});

export type Step3FormData = z.infer<typeof step3Schema>;
