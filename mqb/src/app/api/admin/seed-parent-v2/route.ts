import { NextResponse } from 'next/server';
import { db } from '@/db/index';
import { parents, parent_students, users } from '@/db/schema';
import { hashPassword } from '@/lib/db-client';
import { v4 as uuid } from 'uuid';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const email = 'parent@mqb.com';
    const password = '12345678';
    
    // Check if parent exists
    const existing = await db.select().from(parents).where(eq(parents.email, email)).limit(1);
    const hashedPassword = await hashPassword(password);

    let parentId: string;

    if (existing[0]) {
      console.log('Parent already exists, updating password...');
      parentId = existing[0].id;
      await db.update(parents).set({ password_hash: hashedPassword }).where(eq(parents.id, parentId));
    } else {
      parentId = uuid();
      await db.insert(parents).values({
        id: parentId,
        email,
        password_hash: hashedPassword,
        first_name: 'Jean',
        last_name: 'Dupont',
        is_active: 1
      });
    }

    // Ensure link to a student
    const student = await db.select().from(users).where(eq(users.role, 'student')).limit(1);
    if (student[0]) {
      const link = await db.select().from(parent_students).where(and(eq(parent_students.parent_id, parentId), eq(parent_students.student_id, student[0].id))).limit(1);
      if (!link[0]) {
        await db.insert(parent_students).values({
          id: uuid(),
          parent_id: parentId,
          student_id: student[0].id
        });
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Parent account seeded/updated', 
      email, 
      password,
      linkedStudent: student[0] ? `${student[0].first_name} ${student[0].last_name}` : 'None'
    });
  } catch (error) {
    console.error('Seed parent error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// Helper function because direct import of 'and' from drizzle might be tricky in some environments if not careful
import { and } from 'drizzle-orm';
