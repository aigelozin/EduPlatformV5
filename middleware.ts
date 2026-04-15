import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'

const protectedRoutes = ['/dashboard', '/teacher/', '/admin']
const adminRoutes = ['/admin']
const teacherRoutes = ['/teacher/']

function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((r) => pathname === r.replace(/\/$/, '') || pathname.startsWith(r))
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // DEV BYPASS: пропускаем auth-проверки если нет базы данных
  if (process.env.DEV_BYPASS_AUTH === 'true') {
    return NextResponse.next()
  }

  // Protect routes
  if (matchesRoute(pathname, protectedRoutes) && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Admin-only routes
  if (matchesRoute(pathname, adminRoutes) && session?.user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Teacher-only routes
  if (matchesRoute(pathname, teacherRoutes) && !['teacher', 'admin'].includes(session?.user?.role ?? '')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
