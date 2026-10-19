import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/reset-password(.*)',
  '/pricing(.*)',
  '/docs(.*)',
  '/status(.*)',
  '/manifest.webmanifest',
  '/sw.js',
  '/icons(.*)',
  '/api/cron/workers(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // 1. Allow intentionally public routes
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

  // 2. Fail-closed in production if Clerk Secret Key is unconfigured
  if (isProduction && !process.env.CLERK_SECRET_KEY) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Server authentication configuration missing (CLERK_SECRET_KEY required in production).' },
        { status: 401 }
      );
    }
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('error', 'auth_unconfigured');
    return NextResponse.redirect(signInUrl);
  }

  // 3. Strictly protect private application routes
  await auth.protect();
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
