import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { library_loans, library_items } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

// POST /api/admin/library/loans — create loan
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const { itemId, studentId, dueDate } = await req.json();
    if (!itemId || !studentId || !dueDate) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    // Check availability
    const item = await db.select().from(library_items).where(eq(library_items.id, itemId)).limit(1);
    if (!item[0] || item[0].available < 1) return NextResponse.json({ error: 'Item non disponible' }, { status: 400 });

    const id = uuid();
    await db.insert(library_loans).values({ id, item_id: itemId, student_id: studentId, due_date: dueDate });
    await db.update(library_items).set({ available: item[0].available - 1 }).where(eq(library_items.id, itemId));

    return NextResponse.json({ id, message: 'Emprunt enregistré' }, { status: 201 });
  } catch (error) {
    console.error('POST loan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
