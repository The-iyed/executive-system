import { z, ZodSchema } from 'zod';
import { ParsedResponse } from './types';

export const parseResponse = <T>(schema: ZodSchema<T>, data: unknown): ParsedResponse<T> => {
  try {
    const parsed = schema.parse(data);
    return {
      success: true,
      data: parsed,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }
    return {
      success: false,
      error: 'Unknown parsing error',
    };
  }
};

export const safeParseResponse = <T>(schema: ZodSchema<T>, data: unknown): ParsedResponse<T> => {
  const result = schema.safeParse(data);
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }
  return {
    success: false,
    error: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
  };
};










