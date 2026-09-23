import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Everything is protected except the login page. The API routes had no auth of
// their own, so they must be covered here.
const isPublicRoute = createRouteMatcher(['/admin/login(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
