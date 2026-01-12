import { z } from 'zod';

export const MessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.number(),
});

export const ConversationSchema = z.object({
  id: z.string(),
  messages: z.array(MessageSchema),
  title: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const SendMessageRequestSchema = z.object({
  message: z.string(),
  conversationId: z.string().optional(),
});

export const SendMessageResponseSchema = z.object({
  messageId: z.string(),
  conversationId: z.string(),
  content: z.string(),
});

export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;
export type SendMessageResponse = z.infer<typeof SendMessageResponseSchema>;




