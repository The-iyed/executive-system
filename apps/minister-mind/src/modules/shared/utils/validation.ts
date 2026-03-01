export function isValidEmail(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(trimmed);
}

/** Phone: only digits and optional leading + for country code */
const PHONE_REGEX = /^\+?[0-9]+$/;

export function isValidPhone(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return PHONE_REGEX.test(trimmed);
}

/** Strip invalid characters from phone input; keeps at most one leading +. */
export function sanitizePhoneInput(value: string): string {
  const digitsAndPlus = value.replace(/[^\d+]/g, '');
  const hasPlus = digitsAndPlus.startsWith('+');
  const digits = digitsAndPlus.replace(/\+/g, '');
  return hasPlus ? '+' + digits : digits;
}
