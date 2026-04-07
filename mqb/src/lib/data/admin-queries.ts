import { asc } from 'drizzle-orm';
import { db } from '@/db/index';
import { users } from '@/db/schema';

export async function listUsersForAdmin() {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.first_name,
      lastName: users.last_name,
      role: users.role,
      isActive: users.is_active,
    })
    .from(users)
    .orderBy(asc(users.email));

  return rows.map((r) => ({
    id: r.id,
    name: `${r.firstName} ${r.lastName}`.trim(),
    firstName: r.firstName,
    lastName: r.lastName,
    email: r.email,
    role: r.role,
    status: r.isActive ? 'active' : 'inactive',
  }));
}
