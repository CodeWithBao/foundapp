/**
 * Cloudflare Pages Function Catch-all Proxy for /api/*
 * File path: functions/api/[[path]].js
 */

export async function onRequest(context) {
  const { request, env, params } = context;

  // 1. Get backend origin and proxy secret from environment variables
  const backendOrigin = env.BACKEND_ORIGIN ? env.BACKEND_ORIGIN.replace(/\/+$/, '') : '';
  const proxySecret = env.ORIGIN_PROXY_SECRET || '';

  if (!backendOrigin) {
    return new Response(
      JSON.stringify({
        error: 'BACKEND_ORIGIN_NOT_CONFIGURED',
        message: 'Server environment variable BACKEND_ORIGIN is missing.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 2. Build backend URL
  const requestUrl = new URL(request.url);
  const path = Array.isArray(params.path) ? params.path.join('/') : (params.path || '');
  const targetUrl = `${backendOrigin}/api/${path}${requestUrl.search}`;

  // 3. Prepare headers and inject X-Origin-Secret
  const headers = new Headers(request.headers);
  if (proxySecret) {
    headers.set('X-Origin-Secret', proxySecret);
  }

  // Preserve original host or proxy headers
  headers.set('X-Forwarded-Host', requestUrl.host);
  headers.set('X-Forwarded-Proto', requestUrl.protocol.replace(':', ''));

  // 4. Proxy request options
  const init = {
    method: request.method,
    headers: headers,
    redirect: 'follow',
  };

  // Attach body for non-GET/HEAD methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method.toUpperCase())) {
    init.body = request.body;
  }

  try {
    const response = await fetch(targetUrl, init);
    const responseHeaders = new Headers(response.headers);

    // Optional CORS pass-through header optimization
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: 'PROXY_FETCH_ERROR',
        message: 'Failed to connect to backend origin server.',
        details: err.message,
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
