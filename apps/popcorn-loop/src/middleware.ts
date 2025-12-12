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
    signInUrl: `${process.env.PUBLIC_CLERK_SIGN_IN_URL}`,
    signUpUrl: `${process.env.PUBLIC_CLERK_SIGN_UP_URL}`,
    afterSignInUrl: '/create',
    afterSignUpUrl: '/create',
})