import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { library_items, library_loans, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

// GET all library items + POST new item
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const items = await db.select().from(library_items).orderBy(desc(library_items.created_at));
    const loans = await db
      .select({ id: library_loans.id, itemId: library_loans.item_id, studentId: library_loans.student_id, studentName: users.first_name, studentLastName: users.last_name, borrowedAt: library_loans.borrowed_at, dueDate: library_loans.due_date, returnedAt: library_loans.returned_at, status: library_loans.status })
      .from(library_loans)
      .leftJoin(users, eq(library_loans.student_id, users.id))
      .orderBy(desc(library_loans.created_at));
    return NextResponse.json({ items, loans });
  } catch (error) {
    console.error('GET /api/admin/library error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const body = await req.json();
    const { title, author, isbn, type, category, quantity } = body;
    if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });
    const id = uuid();
    await db.insert(library_items).values({ id, title, author, isbn, type: type || 'book', category, quantity: parseInt(quantity) || 1, available: parseInt(quantity) || 1 });
    return NextResponse.json({ id, message: 'Item ajouté' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/library error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
