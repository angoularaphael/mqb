import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { messages, broadcast_recipients } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { messageId, type } = await req.json();
    if (!messageId) return NextResponse.json({ error: 'messageId requis' }, { status: 400 });

    if (type === 'broadcast') {
      await db.update(broadcast_recipients)
        .set({ is_read: 1 })
        .where(and(
          eq(broadcast_recipients.message_id, messageId),
          eq(broadcast_recipients.recipient_id, user.userId)
        ));
    } else {
      await db.update(messages)
        .set({ is_read: 1 })
        .where(and(
          eq(messages.id, messageId),
          eq(messages.recipient_id, user.userId)
        ));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark read API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
