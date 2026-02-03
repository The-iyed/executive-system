import { z } from 'zod';

export const step4SchedulingSchema = z.object({
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

export type Step4SchedulingFormData = z.infer<typeof step4SchedulingSchema>;
