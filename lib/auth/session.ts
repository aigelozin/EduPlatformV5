import { auth } from '@/lib/auth/config'
import type { SessionUser } from '@/types'

export async function getSession(): Promise<SessionUser | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  return session.user as SessionUser
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession()
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}

export async function requireRole(
  ...roles: SessionUser['role'][]
): Promise<SessionUser> {
  const user = await requireAuth()
  if (!roles.includes(user.role)) throw new Error('FORBIDDEN')
  return user
}
