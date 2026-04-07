import { db } from '@/db/index';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { compare, hash } from 'bcryptjs';
import { v4 as uuid } from 'uuid';

export async function getUserById(userId: string) {
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] || null;
}

export async function getUserByEmail(email: string) {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] || null;
}

export async function verifyPassword(inputPassword: string, hash: string): Promise<boolean> {
  return compare(inputPassword, hash);
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

export async function createUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}) {
  const hashedPassword = await hashPassword(data.password);
  
  const newUser = await db.insert(users).values({
    id: uuid(),
    email: data.email,
    password_hash: hashedPassword,
    first_name: data.firstName,
    last_name: data.lastName,
    role: data.role,
    avatar_url: null,
    is_active: 1,
  }).returning();

  return newUser[0];
}

export async function updateUser(userId: string, data: Partial<typeof users.$inferInsert>) {
  const updated = await db.update(users).set({
    ...data,
    updated_at: Math.floor(Date.now() / 1000),
  }).where(eq(users.id, userId)).returning();

  return updated[0] || null;
}

export async function deleteUser(userId: string) {
  await db.delete(users).where(eq(users.id, userId));
}
