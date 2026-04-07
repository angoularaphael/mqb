import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this'
);

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  iat?: number;
  exp?: number;
}

export async function generateJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);

  return token;
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const verified = await jwtVerify(token, secret);
    const p = verified.payload as Record<string, unknown>;
    const userId = p.userId ?? p.sub;
    if (typeof userId !== 'string' || !p.email || !p.role) return null;
    return {
      userId,
      email: String(p.email),
      role: String(p.role).toLowerCase(),
      firstName: String(p.firstName ?? ''),
      lastName: String(p.lastName ?? ''),
      iat: typeof p.iat === 'number' ? p.iat : undefined,
      exp: typeof p.exp === 'number' ? p.exp : undefined,
    };
  } catch {
    return null;
  }
}

/** En prod sur http://localhost, les cookies Secure peuvent poser problème : AUTH_COOKIE_INSECURE=1 */
function useSecureAuthCookie(): boolean {
  if (process.env.AUTH_COOKIE_INSECURE === '1' || process.env.AUTH_COOKIE_INSECURE === 'true') {
    return false;
  }
  return process.env.NODE_ENV === 'production';
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: useSecureAuthCookie(),
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  });
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value || null;
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  const token = await getAuthToken();
  if (!token) return null;
  return verifyJWT(token);
}
