import { db } from '@/db/index';
import { messages, users, broadcast_recipients } from '@/db/schema';
import { eq, and, or, desc, asc, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

const msgSender = alias(users, 'msg_sender');

export type ConversationSummary = {
  peerId: string;
  peerName: string;
  lastAt: number;
  preview: string;
  lastMessageId: string;
};

export async function listConversationSummaries(userId: string): Promise<ConversationSummary[]> {
  const rows = await db
    .select({
      id: messages.id,
      senderId: messages.sender_id,
      recipientId: messages.recipient_id,
      content: messages.content,
      title: messages.title,
      createdAt: messages.created_at,
      senderFirst: msgSender.first_name,
      senderLast: msgSender.last_name,
    })
    .from(messages)
    .innerJoin(msgSender, eq(messages.sender_id, msgSender.id))
    .where(
      and(
        eq(messages.type, 'direct'),
        or(eq(messages.sender_id, userId), eq(messages.recipient_id, userId)),
      ),
    )
    .orderBy(desc(messages.created_at));

  const firstByPeer = new Map<
    string,
    { lastAt: number; preview: string; lastMessageId: string; peerNameHint?: string }
  >();

  const peerIdsNeedingName = new Set<string>();

  for (const r of rows) {
    const peerId = r.senderId === userId ? r.recipientId : r.senderId;
    if (!peerId || firstByPeer.has(peerId)) continue;
    const preview = (r.title ? `${r.title} — ` : '') + (r.content ?? '').slice(0, 120);
    if (r.senderId === userId) {
      peerIdsNeedingName.add(peerId);
      firstByPeer.set(peerId, {
        lastAt: r.createdAt ?? 0,
        preview,
        lastMessageId: r.id,
      });
    } else {
      firstByPeer.set(peerId, {
        lastAt: r.createdAt ?? 0,
        preview,
        lastMessageId: r.id,
        peerNameHint: `${r.senderFirst} ${r.senderLast}`.trim(),
      });
    }
  }

  let nameById = new Map<string, string>();
  if (peerIdsNeedingName.size) {
    const peers = await db
      .select({
        id: users.id,
        firstName: users.first_name,
        lastName: users.last_name,
      })
      .from(users)
      .where(inArray(users.id, [...peerIdsNeedingName]));
    nameById = new Map(
      peers.map((p) => [p.id, `${p.firstName} ${p.lastName}`.trim() || p.id]),
    );
  }

  return [...firstByPeer.entries()].map(([peerId, v]) => ({
    peerId,
    peerName: v.peerNameHint ?? nameById.get(peerId) ?? peerId,
    lastAt: v.lastAt,
    preview: v.preview,
    lastMessageId: v.lastMessageId,
  }));
}

export async function getDirectThread(userId: string, peerId: string) {
  const rows = await db
    .select({
      id: messages.id,
      senderId: messages.sender_id,
      content: messages.content,
      title: messages.title,
      createdAt: messages.created_at,
      senderFirst: msgSender.first_name,
      senderLast: msgSender.last_name,
    })
    .from(messages)
    .innerJoin(msgSender, eq(messages.sender_id, msgSender.id))
    .where(
      and(
        eq(messages.type, 'direct'),
        or(
          and(eq(messages.sender_id, userId), eq(messages.recipient_id, peerId)),
          and(eq(messages.sender_id, peerId), eq(messages.recipient_id, userId)),
        ),
      ),
    )
    .orderBy(asc(messages.created_at));

  return rows.map((r) => ({
    id: r.id,
    mine: r.senderId === userId,
    content: r.content,
    title: r.title,
    createdAt: r.createdAt,
    senderName: `${r.senderFirst} ${r.senderLast}`.trim(),
  }));
}

export type BroadcastRow = {
  id: string;
  title: string | null;
  content: string;
  createdAt: number | null;
  senderName: string;
  isRead: boolean;
};

export async function listBroadcastsForUser(userId: string): Promise<BroadcastRow[]> {
  const rows = await db
    .select({
      id: messages.id,
      title: messages.title,
      content: messages.content,
      createdAt: messages.created_at,
      senderFirst: msgSender.first_name,
      senderLast: msgSender.last_name,
      readRecipient: broadcast_recipients.is_read,
    })
    .from(broadcast_recipients)
    .innerJoin(messages, eq(broadcast_recipients.message_id, messages.id))
    .innerJoin(msgSender, eq(messages.sender_id, msgSender.id))
    .where(eq(broadcast_recipients.recipient_id, userId))
    .orderBy(desc(messages.created_at));

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    createdAt: r.createdAt,
    senderName: `${r.senderFirst} ${r.senderLast}`.trim(),
    isRead: Boolean(r.readRecipient),
  }));
}
