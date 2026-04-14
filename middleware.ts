import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'

const intlMiddleware = createIntlMiddleware({
  locales: ['ru'],
  defaultLocale: 'ru',
})

const protectedRoutes = ['/dashboard', '/teacher', '/admin']
const adminRoutes = ['/admin']
const teacherRoutes = ['/teacher']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Protect routes
  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r))
  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Admin-only routes
  const isAdmin = adminRoutes.some((r) => pathname.startsWith(r))
  if (isAdmin && session?.user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Teacher-only routes
  const isTeacher = teacherRoutes.some((r) => pathname.startsWith(r))
  if (isTeacher && !['teacher', 'admin'].includes(session?.user?.role ?? '')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return intlMiddleware(req)
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
