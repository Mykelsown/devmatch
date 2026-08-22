/**
 * Vercel Serverless Function — GitHub OAuth token exchange.
 *
 * The client-side OAuth flow redirects back with a ?code= param.
 * This function exchanges that code for an access_token using the
 * GitHub OAuth App's client_secret (which must never be exposed to the browser).
 *
 * Route: POST /api/auth/github
 * Request body:  { code: string }
 * Response:      { access_token, token_type, scope }  — or  { error, error_description }
 */

export default async function handler(req: Request) {
  // CORS headers (same-origin on Vercel, but defensive for local dev)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  const clientId = process.env.VITE_GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return Response.json(
      { error: 'server_config_error', error_description: 'GitHub OAuth is not configured on the server.' },
      { status: 500 },
    );
  }

  let code: string;
  try {
    const body = await req.json();
    code = body.code;
  } catch {
    return Response.json(
      { error: 'invalid_request', error_description: 'Request body must be valid JSON with a "code" field.' },
      { status: 400 },
    );
  }

  if (!code || typeof code !== 'string') {
    return Response.json(
      { error: 'missing_code', error_description: 'The "code" field is required.' },
      { status: 400 },
    );
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const data = await response.json();

    // Forward GitHub's response shape: { access_token, token_type, scope }
    // or on error: { error, error_description }
    return Response.json(data, {
      status: response.ok ? 200 : 401,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    console.error('GitHub token exchange failed:', error);
    return Response.json(
      { error: 'exchange_failed', error_description: 'Failed to exchange authorization code for access token.' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } },
    );
  }
}
