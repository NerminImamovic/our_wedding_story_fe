import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/user', '/gallery'])

const isDefaultRoute = createRouteMatcher(['/'])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, redirectToSignIn } = await auth()

  // Redirect logged-in users from home to user page
  if (userId && isDefaultRoute(req)) {
    return NextResponse.redirect(new URL('/user', req.url))
  }

  // Protect authenticated routes
  if (!userId && isProtectedRoute(req)) {
    return redirectToSignIn()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
