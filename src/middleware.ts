import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const isUserRoute = createRouteMatcher(['/user'])
const isPublicRoute = createRouteMatcher(['/public-route-example'])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, redirectToSignIn } = await auth()

  // For users visiting /onboarding, don't try to redirect
  if (userId && !isUserRoute(req)) {
    return NextResponse.redirect(new URL('/user', req.url))
  }

  // If the user is logged in and the route is protected, let them view.
  if (userId && !isPublicRoute(req)) return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
