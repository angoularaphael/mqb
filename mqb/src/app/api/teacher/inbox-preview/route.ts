import { getInboxPreviewForUser } from '@/lib/data/student-queries';
import { listBroadcastsForUser } from '@/lib/data/messaging-queries';

export async function GET() {
  const auth = await requireStaffSession();
  if ('response' in auth) return auth.response;
  if (auth.user.role !== 'teacher') {
    return NextResponse.json({ error: 'Réservé aux enseignants' }, { status: 403 });
  }
  const [direct, broadcasts] = await Promise.all([
    getInboxPreviewForUser(auth.user.userId, 4),
    listBroadcastsForUser(auth.user.userId)
  ]);

  const combined = [
    ...broadcasts.map(b => ({
      id: b.id,
      fromMe: false,
      peerName: b.senderName,
      title: b.title || '(Diffusion)',
      preview: b.content.slice(0, 100),
      date: b.createdAt ? new Date(b.createdAt * 1000).toISOString().slice(0, 10) : '',
      read: b.isRead,
      type: 'broadcast'
    })),
    ...direct
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  return NextResponse.json({ inboxPreview: combined });
}
