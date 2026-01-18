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
  meetingChannel: z.string().optional(),
  requiresProtocol: z.boolean().optional().default(false),
  notes: z.string().optional().or(z.literal('')),
});

export type Step3FormData = z.infer<typeof step3Schema>;
