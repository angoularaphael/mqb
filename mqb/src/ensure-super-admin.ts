/**
 * Crée ou met à jour le compte super administrateur (email + mot de passe + rôle admin).
 * Utile même si d’autres utilisateurs existent déjà (contrairement à bootstrap).
 * Exécution : npm run ensure-super-admin
 */
import { db } from '@/db/index';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

const SUPER_ADMIN_EMAIL = 'giffareno05@gmail.com';
const SUPER_ADMIN_PASSWORD = '12345678';
const FIRST_NAME = 'Super';
const LAST_NAME = 'Admin';

async function main() {
  const email = SUPER_ADMIN_EMAIL.trim().toLowerCase();
  const password_hash = bcrypt.hashSync(SUPER_ADMIN_PASSWORD, 10);
  const now = Math.floor(Date.now() / 1000);

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existing) {
    await db
      .update(users)
      .set({
        password_hash,
        role: 'admin',
        is_active: 1,
        first_name: FIRST_NAME,
        last_name: LAST_NAME,
        updated_at: now,
      })
      .where(eq(users.id, existing.id));
    console.log('Super admin mis à jour :', email);
  } else {
    await db.insert(users).values({
      id: uuid(),
      email,
      password_hash,
      first_name: FIRST_NAME,
      last_name: LAST_NAME,
      role: 'admin',
      avatar_url: null,
      is_active: 1,
    });
    console.log('Super admin créé :', email);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
