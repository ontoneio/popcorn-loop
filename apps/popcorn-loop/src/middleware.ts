import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server'

const isProtectedRoute = createRouteMatcher([ '/api(.*)', '/create(.*)','/room(.*)'])

export const onRequest = clerkMiddleware((auth, context) => {
  const { isAuthenticated, redirectToSignIn } = auth()

  if (!isAuthenticated && isProtectedRoute(context.request)) {
    // Add custom logic to run before redirecting
    return redirectToSignIn()
  }
}, {
    publishableKey: `${process.env.PUBLIC_CLERK_PUBLISHABLE_KEY}`,
    secretKey: `${process.env.CLERK_SECRET_KEY}`,
    signInUrl: '/login',
    signUpUrl: '/login',
    afterSignInUrl: '/create',
    afterSignUpUrl: '/create',
})