'use server';

import { db } from '@/db/index';
import { users, password_reset_tokens } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateJWT, setAuthCookie, clearAuthCookie, getCurrentUser } from '@/lib/auth';
import { verifyPassword, hashPassword } from '@/lib/db-client';
import { sendPasswordResetEmail } from '@/lib/email';
import { v4 as uuid } from 'uuid';
import {
  LoginInput,
  PasswordResetInput,
  ResetPasswordInput,
  loginSchema,
} from '@/lib/validations';

export async function loginAction(data: LoginInput) {
  try {
    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? 'Données invalides';
      return { success: false, error: msg };
    }

    const email = parsed.data.email.trim().toLowerCase();
    const password = parsed.data.password;
    const portalType = parsed.data.portalType;

    let userObj: any = null;

    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!result[0]) return { success: false, error: 'Email ou mot de passe invalide' };
    userObj = result[0];

    if (!userObj) {
      return { success: false, error: 'Email ou mot de passe invalide' };
    }

    const storedHash = userObj.password_hash;
    if (!storedHash || typeof storedHash !== 'string') {
      console.error('Login: utilisateur sans hash de mot de passe valide', userObj.id);
      return { success: false, error: 'Compte incomplet : contactez un administrateur' };
    }

    let isPasswordValid = false;
    try {
      isPasswordValid = await verifyPassword(password, storedHash);
    } catch (e) {
      console.error('Login: erreur bcrypt (hash invalide ou corrompu ?)', e);
      return { success: false, error: 'Email ou mot de passe invalide' };
    }

    if (!isPasswordValid) {
      return { success: false, error: 'Email ou mot de passe invalide' };
    }

    if (!userObj.is_active) {
      return { success: false, error: 'Ce compte est désactivé' };
    }

    if (portalType && userObj.role !== 'admin') {
      if (portalType === 'student' && userObj.role !== 'student') {
        return { success: false, error: 'Accès non autorisé au portail étudiant. Veuillez utiliser le portail enseignant.' };
      }
      if (portalType === 'teacher' && userObj.role !== 'teacher') {
        return { success: false, error: 'Accès non autorisé au portail enseignant. Veuillez utiliser le portail étudiant.' };
      }
      if (portalType === 'parent' && userObj.role !== 'parent') {
        return { success: false, error: 'Accès non autorisé au portail parent.' };
      }
    }

    // Generate JWT token (claims strictement sérialisables pour jose)
    const token = await generateJWT({
      userId: String(userObj.id),
      email: String(userObj.email),
      role: String(userObj.role ?? 'student').toLowerCase(),
      firstName: String(userObj.first_name ?? ''),
      lastName: String(userObj.last_name ?? ''),
    });

    // Set auth cookie
    await setAuthCookie(token);

    return {
      success: true,
      user: {
        id: userObj.id,
        email: userObj.email,
        firstName: userObj.first_name,
        lastName: userObj.last_name,
        role: userObj.role,
        avatar: userObj.avatar_url,
      },
    };
  } catch (error) {
    console.error('Login error:', error);
    const hint =
      error instanceof Error && process.env.NODE_ENV === 'development'
        ? ` (${error.message})`
        : '';
    return {
      success: false,
      error: `Une erreur est survenue lors de la connexion${hint}`,
    };
  }
}

export async function logoutAction() {
  try {
    await clearAuthCookie();
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: 'Une erreur est survenue lors de la déconnexion' };
  }
}

export async function requestPasswordResetAction(data: PasswordResetInput) {
  try {
    const user = await db.select().from(users).where(eq(users.email, data.email)).limit(1);

    if (!user[0]) {
      // Don't reveal if user exists for security
      return { success: true, message: 'Si ce compte existe, un code de vérification a été envoyé' };
    }

    // Generate verification code (6 digits)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Math.floor(Date.now() / 1000) + 10 * 60; // 10 minutes

    // Delete old tokens
    await db.delete(password_reset_tokens)
      .where(eq(password_reset_tokens.user_id, user[0].id));

    // Create new token
    await db.insert(password_reset_tokens).values({
      id: uuid(),
      user_id: user[0].id,
      code,
      expires_at: expiresAt,
    });

    // Send email
    await sendPasswordResetEmail(
      user[0].email,
      code,
      user[0].first_name
    );

    return {
      success: true,
      message: 'Un code de vérification a été envoyé. Vérifiez votre boîte de réception.',
    };
  } catch (error) {
    console.error('Password reset request error:', error);
    return { success: false, error: 'Une erreur est survenue' };
  }
}

export async function resetPasswordAction(data: ResetPasswordInput) {
  try {
    // Find reset token
    const tokens = await db.select().from(password_reset_tokens)
      .where(eq(password_reset_tokens.code, data.code));

    if (!tokens[0]) {
      return { success: false, error: 'Code de réinitialisation invalide' };
    }

    // Check expiration
    if (tokens[0].expires_at < Math.floor(Date.now() / 1000)) {
      return { success: false, error: 'Le code de réinitialisation a expiré' };
    }

    // Update password
    const hashedPassword = await hashPassword(data.password);
    await db.update(users)
      .set({ password_hash: hashedPassword })
      .where(eq(users.id, tokens[0].user_id));

    // Delete token
    await db.delete(password_reset_tokens)
      .where(eq(password_reset_tokens.id, tokens[0].id));

    return { success: true, message: 'Votre mot de passe a été réinitialisé avec succès' };
  } catch (error) {
    console.error('Reset password error:', error);
    return { success: false, error: 'Une erreur est survenue' };
  }
}

export async function getCurrentUserAction() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return null;
    }
    return {
      id: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}
