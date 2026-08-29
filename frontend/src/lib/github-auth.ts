/**
 * GitHub OAuth utility for client-side OAuth flow.
 *
 * Flow:
 * 1. Redirect to GitHub authorize URL
 * 2. GitHub redirects back with ?code=XXX
 * 3. We exchange the code for a token via a serverless function
 * 4. Use the token to fetch user profile and skills
 *
 * The token exchange MUST happen server-side (GitHub requires client_secret).
 * This module provides the client-side redirect and callback handling.
 * You'll need a minimal serverless function (Vercel Edge Function) for the
 * token exchange.
 */
import { GITHUB_CLIENT_ID, getGitHubRedirectUri } from '../config';

/** GitHub OAuth scopes needed for profile verification. */
const SCOPES = ['read:user'].join(' ');

/** Generate a random state parameter for CSRF protection. */
function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Use localStorage instead of sessionStorage. sessionStorage is cleared when
// the browser navigates away from the page (e.g. to github.com for OAuth).
// localStorage survives navigation and is consumed (deleted) after one use.
function storeState(state: string): void {
  localStorage.setItem('devmatch:github_oauth_state', state);
}

function consumeState(): string | null {
  const state = localStorage.getItem('devmatch:github_oauth_state');
  localStorage.removeItem('devmatch:github_oauth_state');
  return state;
}

/**
 * Initiate the GitHub OAuth flow.
 * Redirects the browser to GitHub's authorization page.
 */
export function initiateGitHubOAuth(): void {
  if (!GITHUB_CLIENT_ID) {
    throw new Error(
      'GitHub OAuth not configured. Set VITE_GITHUB_CLIENT_ID in your .env file.',
    );
  }

  const state = generateState();
  storeState(state);

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: getGitHubRedirectUri(),
    scope: SCOPES,
    state,
    allow_signup: 'false',
  });

  window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Handle the OAuth callback.
 * Call this on your /auth/callback route.
 * Returns the authorization code if valid, null otherwise.
 */
export function handleGitHubCallback(): { code: string; state: string } | null {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    console.error('GitHub OAuth error:', error);
    return null;
  }

  if (!code || !state) {
    return null;
  }

  // Validate state for CSRF protection
  const storedState = consumeState();
  if (storedState !== state) {
    console.error('OAuth state mismatch - possible CSRF attack');
    return null;
  }

  return { code, state };
}

/**
 * Exchange the authorization code for an access token.
 *
 * IMPORTANT: This requires a serverless function to handle the token exchange
 * securely (GitHub requires client_secret, which must not be exposed to the browser).
 *
 * The serverless function should:
 * 1. Accept POST with { code, state }
 * 2. Exchange code for access_token via GitHub API
 * 3. Return { access_token, token_type, scope }
 *
 * Example Vercel Edge Function (api/auth/github.ts):
 * ```ts
 * import { GITHUB_CLIENT_SECRET } from '../config';
 *
 * export default async function handler(req: Request) {
 *   const { code } = await req.json();
 *   const res = await fetch('https://github.com/login/oauth/access_token', {
 *     method: 'POST',
 *     headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       client_id: GITHUB_CLIENT_ID,
 *       client_secret: GITHUB_CLIENT_SECRET,
 *       code,
 *     }),
 *   });
 *   const data = await res.json();
 *   return Response.json(data);
 * }
 * ```
 */
export async function exchangeCodeForToken(
  code: string,
  serverEndpoint: string = '/api/auth/github',
): Promise<string> {
  const res = await fetch(serverEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.statusText}`);
  }

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  return data.access_token;
}

/** Fetch the authenticated user's GitHub profile. */
export async function fetchGitHubProfile(
  accessToken: string,
): Promise<GitHubProfile> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch GitHub profile: ${res.statusText}`);
  }

  return res.json();
}

/** Fetch the user's public repositories for skill verification. */
export async function fetchGitHubRepos(
  accessToken: string,
): Promise<GitHubRepo[]> {
  const res = await fetch(
    'https://api.github.com/user/repos?per_page=100&sort=updated',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    },
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch GitHub repos: ${res.statusText}`);
  }

  return res.json();
}

/** Extract programming languages from repositories. */
export function extractSkillsFromRepos(repos: GitHubRepo[]): string[] {
  const languageCount = new Map<string, number>();

  for (const repo of repos) {
    if (repo.language) {
      languageCount.set(
        repo.language,
        (languageCount.get(repo.language) ?? 0) + 1,
      );
    }
  }

  // Sort by usage count and return top languages
  return Array.from(languageCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([lang]) => lang);
}

export interface GitHubProfile {
  login: string;
  name: string | null;
  avatar_url: string;
  public_repos: number;
  followers: number;
  bio: string | null;
}

export interface GitHubRepo {
  name: string;
  language: string | null;
  stargazers_count: number;
  description: string | null;
  topics: string[];
}

/** Store the attested profile hash in localStorage. */
export function storeAttestedProfileHash(hash: string): void {
  localStorage.setItem('devmatch:attestedProfileHash', hash);
}

/** Retrieve the attested profile hash from localStorage. */
export function getAttestedProfileHash(): string | null {
  return localStorage.getItem('devmatch:attestedProfileHash');
}

/** Store GitHub verification result. */
export function storeGitHubVerification(profile: GitHubProfile, skills: string[]): void {
  localStorage.setItem(
    'devmatch:githubVerification',
    JSON.stringify({
      login: profile.login,
      name: profile.name,
      skills,
      verifiedAt: new Date().toISOString(),
    }),
  );
}

/** Retrieve GitHub verification result. */
export function getGitHubVerification(): {
  login: string;
  name: string | null;
  skills: string[];
  verifiedAt: string;
} | null {
  const data = localStorage.getItem('devmatch:githubVerification');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}
