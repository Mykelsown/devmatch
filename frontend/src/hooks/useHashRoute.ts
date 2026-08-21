/**
 * Minimal hash router for the DevMatch views.
 *
 * Routes live in the URL hash so the browser back/forward buttons work and
 * views are shareable:
 *   #/            landing
 *   #/dashboard   browse / match dashboard
 *   #/register    developer profile registration
 *   #/match/<id>  match detail + reveal flow
 */
import { useCallback, useEffect, useState } from 'react';

export type Route =
  | { view: 'landing' }
  | { view: 'dashboard' }
  | { view: 'register' }
  | { view: 'register-team' }
  | { view: 'match'; id: string };

function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '');
  const [segment, ...rest] = clean.split('/');
  switch (segment) {
    case 'dashboard':
      return { view: 'dashboard' };
    case 'register':
      return { view: 'register' };
    case 'register-team':
      return { view: 'register-team' };
    case 'match': {
      const id = rest[0];
      return id ? { view: 'match', id } : { view: 'dashboard' };
    }
    default:
      return { view: 'landing' };
  }
}

function encodeRoute(route: Route): string {
  switch (route.view) {
    case 'landing':
      return '#/';
    case 'dashboard':
      return '#/dashboard';
    case 'register':
      return '#/register';
    case 'register-team':
      return '#/register-team';
    case 'match':
      return `#/match/${route.id}`;
  }
}

export function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((next: Route) => {
    window.location.hash = encodeRoute(next);
  }, []);

  return { route, navigate };
}
