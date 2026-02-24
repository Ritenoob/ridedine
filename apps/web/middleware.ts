import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting store (in-memory for development, use Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMITS = {
  general: { max: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
  auth: { max: 5, windowMs: 15 * 60 * 1000 },      // 5 requests per 15 minutes for auth endpoints
};

function rateLimit(ip: string, limit: { max: number; windowMs: number }): boolean {
  const now = Date.now();
  const key = `${ip}:${Math.floor(now / limit.windowMs)}`;

  const record = rateLimitStore.get(key);

  if (!record) {
    rateLimitStore.set(key, { count: 1, resetTime: now + limit.windowMs });
    return true;
  }

  if (now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + limit.windowMs });
    return true;
  }

  if (record.count >= limit.max) {
    return false;
  }

  record.count++;
  return true;
}

// Clean up old rate limit records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Clean every minute

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get client IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown';

  // Apply rate limiting
  const isAuthEndpoint = pathname.startsWith('/api/auth');
  const limit = isAuthEndpoint ? RATE_LIMITS.auth : RATE_LIMITS.general;

  if (!rateLimit(ip, limit)) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil(limit.windowMs / 1000)),
      },
    });
  }

  // Check authentication for protected routes
  const isCheckoutRoute = pathname.startsWith('/checkout');
  const isProtectedRoute = isCheckoutRoute;

  if (isProtectedRoute) {
    // Check for auth session (Supabase stores session in cookies)
    const hasSession = request.cookies.has('sb-access-token') ||
                       request.cookies.has('supabase-auth-token');

    if (!hasSession) {
      // Redirect to home with return URL
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('redirected', 'true');
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Add security headers
  const response = NextResponse.next();

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');

  // Content Security Policy (CSP)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co",
    "frame-src 'self' https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // HSTS (HTTP Strict Transport Security) - only in production with HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
