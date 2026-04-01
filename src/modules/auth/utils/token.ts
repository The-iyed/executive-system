import { cookieStorage } from '@/lib/auth/cookieStorage'
import { isSsoEnabled } from '@/lib/auth/ssoOrigin'

export const getTokens = () => {
  return {
    access_token: localStorage.getItem('access_token') || null,
  }
}

export const setTokens = (access_token: string) => {
  localStorage.setItem('access_token', access_token)
}

export const clearTokens = () => {
  localStorage.removeItem('access_token')
}

/**
 * Clear all auth-related and app storage, then redirect.
 * Non-SSO: app login page. SSO: root so AuthProvider runs OIDC bootstrap (never /login).
 */
export function clearAllBrowserStorage(): void {
  clearTokens()
  if (typeof window === 'undefined') return
  try {
    cookieStorage.clear()
  } catch {
    // ignore
  }
  try {
    localStorage.clear()
    sessionStorage.clear()
  } catch {
    // ignore
  }
  const origin = window.location.origin
  const path = isSsoEnabled() ? '/' : '/login'
  window.location.href = `${origin}${path}`
}