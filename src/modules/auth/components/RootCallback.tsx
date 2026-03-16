import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleCallback, handleSilentRenew } from '@/lib/auth';
import { isSsoEnabled } from '@/lib/auth/ssoOrigin';
import { useAuth } from '@/modules/auth/context';
import { setTokens } from '@/modules/auth/utils/token';
import { getCurrentUserApi } from '@/modules/auth/data/authApi';
import type { User } from '@/modules/auth/data/authApi';
import { getDefaultRouteForUser } from '@/modules/shared';
import { SSOLoader } from './SSOLoader';

/**
 * Handles OIDC callback (/callback) and silent renew (/silent-renew).
 * Processes code/state once, fetches /me, then redirects by use_cases.
 * Redirect runs in an effect when user is set so the router sees authenticated state.
 */
export default function RootCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, setUserFromCallback } = useAuth();
  const processedRef = useRef(false);
  const pendingRedirectRef = useRef<string | null>(null);

  const hasCallbackParams =
    searchParams.has('code') || searchParams.has('error') || searchParams.has('state');
  const isSilentRenew = window.location.pathname === '/silent-renew';

  // When user becomes set after callback, perform the pending redirect
  useEffect(() => {
    if (user && pendingRedirectRef.current) {
      const target = pendingRedirectRef.current;
      pendingRedirectRef.current = null;
      navigate({ pathname: target, search: '', hash: '' }, { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!hasCallbackParams) {
      navigate('/', { replace: true });
      return;
    }
    if (processedRef.current) return;
    processedRef.current = true;

    const processCallback = async () => {
      try {
        if (!isSsoEnabled()) {
          navigate({ pathname: '/', search: '', hash: '' }, { replace: true });
          return;
        }
        if (isSilentRenew) {
          await handleSilentRenew();
          const pathname = (window.location.pathname || '/').replace(/\/$/, '') || '/';
          navigate({ pathname: pathname === '/callback' || pathname === '/silent-renew' ? '/' : pathname, search: '', hash: '' }, { replace: true });
          return;
        }
        const result = await handleCallback();
        if (result) {
          const { oidcUser } = result;
          setTokens(oidcUser.access_token);
          let appUser: User | null = result.appUser as User | null;
          if (!appUser) {
            try {
              appUser = await getCurrentUserApi();
            } catch {
              appUser = null;
            }
          }
          const targetPath = getDefaultRouteForUser(appUser?.use_cases, appUser?.roles);
          pendingRedirectRef.current = targetPath;
          setUserFromCallback(oidcUser, appUser);
        } else {
          navigate({ pathname: '/', search: '', hash: '' }, { replace: true });
        }
      } catch (err) {
        console.error('[Auth] Callback error:', err);
        navigate({ pathname: '/', search: '', hash: '' }, { replace: true });
      }
    };

    processCallback();
  }, [hasCallbackParams, isSilentRenew, setUserFromCallback, navigate]);

  return <SSOLoader />;
}
