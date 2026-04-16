import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { library_loans, library_items } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// PUT /api/admin/library/loans/[id]/return — return a loan
export async function PUT(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const loan = await db.select().from(library_loans).where(eq(library_loans.id, params.id)).limit(1);
    if (!loan[0]) return NextResponse.json({ error: 'Emprunt non trouvé' }, { status: 404 });

    await db.update(library_loans).set({ status: 'returned', returned_at: Math.floor(Date.now() / 1000) }).where(eq(library_loans.id, params.id));

    // Increment availability
    const item = await db.select().from(library_items).where(eq(library_items.id, loan[0].item_id)).limit(1);
    if (item[0]) {
      await db.update(library_items).set({ available: item[0].available + 1 }).where(eq(library_items.id, loan[0].item_id));
    }

    return NextResponse.json({ message: 'Retour enregistré' });
  } catch (error) {
    console.error('PUT return error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
