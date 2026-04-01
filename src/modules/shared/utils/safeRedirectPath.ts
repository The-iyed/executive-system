/**
 * Validates a post-login redirect path to prevent open redirects.
 * Only same-app relative paths are allowed (must start with `/`, not `//`).
 */
export function getSafeInternalRedirectPath(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== "string") return null;
  let path = raw.trim();
  if (!path) return null;
  try {
    path = decodeURIComponent(path);
  } catch {
    return null;
  }
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  if (/[\n\r]/.test(path)) return null;
  if (path.includes("://")) return null;
  return path;
}
