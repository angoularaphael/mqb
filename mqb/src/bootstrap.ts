/**
 * Crée le premier compte administrateur si la base ne contient aucun utilisateur.
 * Variables (.env) : BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD (optionnelles)
 * Défaut si non définies : giffareno05@gmail.com / 12345678
 * Optionnel : BOOTSTRAP_ADMIN_FIRST_NAME, BOOTSTRAP_ADMIN_LAST_NAME
 */
import { db } from '@/db/index';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

async function bootstrap() {
  const existing = await db.select().from(users).limit(1);
  if (existing.length > 0) {
    console.log('Des utilisateurs existent déjà. Aucune création (aucune donnée fictive injectée).');
    process.exit(0);
  }

  const email =
    process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase() || 'giffareno05@gmail.com';
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || '12345678';
  const first = process.env.BOOTSTRAP_ADMIN_FIRST_NAME?.trim() || 'Super';
  const last = process.env.BOOTSTRAP_ADMIN_LAST_NAME?.trim() || 'Admin';

  const password_hash = bcrypt.hashSync(password, 10);
  await db.insert(users).values({
    id: uuid(),
    email,
    password_hash,
    first_name: first,
    last_name: last,
    role: 'admin',
    avatar_url: null,
    is_active: 1,
  });

  console.log('Compte administrateur initial créé :', email);
  process.exit(0);
}

bootstrap().catch((e) => {
  console.error(e);
  process.exit(1);
});
