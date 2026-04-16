import { NextResponse } from 'next/server';
import { db } from '@/db/index';
import { library_items, library_loans } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const items = await db.select().from(library_items).orderBy(desc(library_items.created_at));
    const myLoans = await db.select().from(library_loans).where(eq(library_loans.student_id, user.userId)).orderBy(desc(library_loans.created_at));

    const loansWithItems = myLoans.map(loan => {
      const item = items.find(i => i.id === loan.item_id);
      return { ...loan, itemTitle: item?.title || 'Inconnu', itemAuthor: item?.author || '' };
    });

    return NextResponse.json({ items, myLoans: loansWithItems });
  } catch (error) {
    console.error('GET /api/student/library error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
