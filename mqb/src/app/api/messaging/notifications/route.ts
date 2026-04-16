import { NextResponse } from 'next/server';
import { db } from '@/db/index';
import { messages, broadcast_recipients } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ unreadCount: 0, latestMessage: null });

    const userId = user.userId;

    // Direct messages count
    const directUnread = await db.select()
      .from(messages)
      .where(and(
        eq(messages.recipient_id, userId),
        eq(messages.is_read, 0),
        eq(messages.type, 'direct')
      ));

    // Broadcasts count
    const broadcastUnread = await db.select()
      .from(broadcast_recipients)
      .where(and(
        eq(broadcast_recipients.recipient_id, userId),
        eq(broadcast_recipients.is_read, 0)
      ));

    // Get latest message (direct or broadcast) for the popup
    const latestDirect = await db.select()
      .from(messages)
      .where(eq(messages.recipient_id, userId))
      .orderBy(messages.created_at)
      .limit(1);

    const totalUnread = directUnread.length + broadcastUnread.length;

    return NextResponse.json({ 
      unreadCount: totalUnread, 
      latestMessage: latestDirect[0] || null 
    });
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json({ unreadCount: 0, latestMessage: null });
  }
}
