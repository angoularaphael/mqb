import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT, type JWTPayload } from '@/lib/auth';
import { canAccessStudentArea } from '@/lib/roles';

export async function getSessionUser(): Promise<JWTPayload | null> {
  const token = (await cookies()).get('auth_token')?.value;
  if (!token) return null;
  return verifyJWT(token);
}

export function unauthorized() {
  return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
}

export type SessionResult<T extends JWTPayload = JWTPayload> =
  | { user: T; response?: never }
  | { response: NextResponse; user?: never };

export async function requireStudentSession(): Promise<SessionResult> {
  const user = await getSessionUser();
  if (!user) return { response: unauthorized() };
  if (!canAccessStudentArea(user.role)) return { response: forbidden() };
  return { user };
}

export async function requireAdminSession(): Promise<SessionResult> {
  const user = await getSessionUser();
  if (!user) return { response: unauthorized() };
  if (user.role !== 'admin') return { response: forbidden() };
  return { user };
}

/** Enseignant ou administrateur */
export async function requireStaffSession(): Promise<SessionResult> {
  const user = await getSessionUser();
  if (!user) return { response: unauthorized() };
  if (user.role !== 'teacher' && user.role !== 'admin') return { response: forbidden() };
  return { user };
}

export async function requireAuthSession(): Promise<SessionResult> {
  const user = await getSessionUser();
  if (!user) return { response: unauthorized() };
  return { user };
}
