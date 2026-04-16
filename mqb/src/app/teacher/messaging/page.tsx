'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Megaphone, Send } from 'lucide-react';
import { fetchApi } from '@/lib/fetch-api';
import { useAppPrefs } from '@/components/app-providers';

type Conv = { peerId: string; peerName: string; lastAt: number; preview: string; lastMessageId: string };
type ThreadMsg = {
  id: string;
  mine: boolean;
  content: string;
  title: string | null;
  createdAt: number | null;
  senderName: string;
};
type Broadcast = {
  id: string;
  title: string | null;
  content: string;
  createdAt: number | null;
  senderName: string;
  isRead: boolean;
};

export default function TeacherMessagingPage() {
  const router = useRouter();
  const { t } = useAppPrefs();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [tab, setTab] = useState<'chats' | 'broadcasts'>('chats');
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadMsg[]>([]);
  const [students, setStudents] = useState<{ id: string; label: string; email: string }[]>([]);
  const [staff, setStaff] = useState<{ id: string; label: string; email: string; role: string }[]>([]);
  const [broadcastStudents, setBroadcastStudents] = useState<{ id: string; label: string }[]>([]);
  const [recipientId, setRecipientId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [bcTitle, setBcTitle] = useState('');
  const [bcContent, setBcContent] = useState('');
  const [bcAll, setBcAll] = useState(true);
  const [bcSelected, setBcSelected] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [bcSending, setBcSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadLists = useCallback(async (myId: string) => {
    const [c, b, r, mine] = await Promise.all([
      fetchApi<{ conversations: Conv[] }>('/api/teacher/messaging/conversations'),
      fetchApi<{ broadcasts: Broadcast[] }>('/api/teacher/messaging/broadcasts'),
      fetchApi<{
        students: { id: string; label: string; email: string }[];
        staff: { id: string; label: string; email: string; role: string }[];
      }>('/api/teacher/recipients'),
      fetchApi<{ students: { id: string; label: string }[] }>('/api/teacher/students-for-broadcast'),
    ]);
    setConversations(c.conversations);
    setBroadcasts(b.broadcasts);
    setStudents(r.students);
    setStaff(r.staff.filter((s) => s.id !== myId));
    setBroadcastStudents(mine.students);
  }, []);

  const loadThread = useCallback(async (pid: string) => {
    const d = await fetchApi<{ messages: ThreadMsg[] }>(
      `/api/teacher/messaging/thread?peerId=${encodeURIComponent(pid)}`,
    );
    setThread(d.messages);
    // Mark as read
    if (d.messages.length > 0) {
      const unreadIds = d.messages.filter(m => !m.mine).map(m => m.id);
      for (const id of unreadIds) {
        fetchApi('/api/messaging/mark-read', {
          method: 'POST',
          body: JSON.stringify({ messageId: id, type: 'direct' })
        }).catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    (async () => {
      const currentUser = await getCurrentUserAction();
      if (!currentUser || currentUser.role !== 'teacher') {
        router.push('/login');
        return;
      }
      setUser(currentUser);
    })();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const myId = (user as { id: string }).id;
    (async () => {
      try {
        await loadLists(myId);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, loadLists]);

  useEffect(() => {
    if (peerId && tab === 'chats') {
      loadThread(peerId).catch((e) => setError(e instanceof Error ? e.message : 'Erreur'));
    } else {
      setThread([]);
    }
  }, [peerId, tab, loadThread]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    const rid = recipientId;
    try {
      await fetchApi('/api/teacher/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: rid, title, content }),
      });
      setTitle('');
      setContent('');
      setRecipientId('');
      await loadLists((user as { id: string }).id);
      if (rid) {
        setPeerId(rid);
        await loadThread(rid);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Envoi impossible');
    } finally {
      setSending(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBcSending(true);
    try {
      const recipientIds = bcAll
        ? []
        : Object.entries(bcSelected)
            .filter(([, v]) => v)
            .map(([id]) => id);
      await fetchApi('/api/teacher/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bcTitle,
          content: bcContent,
          allMyStudents: bcAll,
          recipientIds: bcAll ? undefined : recipientIds,
        }),
      });
      setBcTitle('');
      setBcContent('');
      await loadLists((user as { id: string }).id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Diffusion impossible');
    } finally {
      setBcSending(false);
    }
  };

  if (loading || !user) return null;

  const selectedPeer = conversations.find((c) => c.peerId === peerId);
  const me = user as { id: string };

  return (
    <AppLayoutWrapper user={user}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Messagerie</h1>
          <p className="text-muted-foreground text-sm">Discussions, diffusions reçues et envoi aux étudiants de vos cours</p>
        </div>
        {error && <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>}

        <div className="flex gap-2 border-b border-border pb-2">
          <button
            type="button"
            onClick={() => {
              setTab('chats');
              setPeerId(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === 'chats' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            {t('conversations')}
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('broadcasts');
              setPeerId(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === 'broadcasts' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            {t('broadcasts')}
          </button>
        </div>

        {tab === 'broadcasts' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Megaphone size={18} /> Diffusions reçues
              </h2>
              {broadcasts.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucune.</p>
              ) : (
                broadcasts.map((b) => (
                  <div 
                    key={b.id} 
                    className={`p-4 rounded-lg border transition-colors ${b.isRead ? 'bg-card border-border' : 'bg-primary/5 border-primary/20 cursor-pointer hover:bg-primary/10'}`}
                    onClick={async () => {
                      if (!b.isRead) {
                        try {
                          await fetchApi('/api/messaging/mark-read', {
                            method: 'POST',
                            body: JSON.stringify({ messageId: b.id, type: 'broadcast' })
                          });
                          setBroadcasts(prev => prev.map(item => item.id === b.id ? { ...item, isRead: true } : item));
                        } catch (e) {}
                      }
                    }}
                  >
                    <p className="text-xs text-muted-foreground">{b.senderName}</p>
                    <p className="font-semibold mt-1">{b.title ?? '—'}</p>
                    <p className="text-sm mt-2 whitespace-pre-wrap">{b.content}</p>
                    <p className="text-[10px] font-mono text-muted-foreground mt-2">ID: {b.id}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleBroadcast} className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="font-semibold">Nouvelle diffusion (vos cours)</h2>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={bcAll} onChange={(e) => setBcAll(e.target.checked)} />
                Tous les étudiants de mes cours
              </label>
              {!bcAll && (
                <div className="max-h-40 overflow-y-auto border border-border rounded-lg p-2 space-y-1">
                  {broadcastStudents.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(bcSelected[s.id])}
                        onChange={(e) => setBcSelected((p) => ({ ...p, [s.id]: e.target.checked }))}
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
              )}
              <input
                required
                placeholder="Sujet"
                value={bcTitle}
                onChange={(e) => setBcTitle(e.target.value)}
                className="w-full px-3 py-2 bg-muted border rounded-lg"
              />
              <textarea
                required
                placeholder="Message"
                value={bcContent}
                onChange={(e) => setBcContent(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 bg-muted border rounded-lg"
              />
              <button
                type="submit"
                disabled={bcSending}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50"
              >
                {bcSending ? 'Envoi…' : 'Diffuser'}
              </button>
            </form>
          </div>
        )}

        {tab === 'chats' && (
          <div className="grid lg:grid-cols-[280px_1fr] gap-4 min-h-[480px]">
            <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
              <div className="p-2 border-b text-xs text-muted-foreground">{t('conversations')}</div>
              <div className="overflow-y-auto flex-1">
                {conversations.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">Aucune discussion.</p>
                ) : (
                  conversations.map((c) => (
                    <button
                      key={c.peerId}
                      type="button"
                      onClick={() => setPeerId(c.peerId)}
                      className={`w-full text-left px-3 py-3 border-b border-border hover:bg-muted ${
                        peerId === c.peerId ? 'bg-primary/10' : ''
                      }`}
                    >
                      <p className="font-medium text-sm">{c.peerName}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.preview}</p>
                      <p className="text-[10px] font-mono text-muted-foreground mt-1">#{c.peerId.slice(0, 8)}…</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg flex flex-col min-h-[400px]">
              {!peerId ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                  {t('select_recipient')}
                </div>
              ) : (
                <>
                  <div className="p-3 border-b border-border">
                    <p className="font-semibold">{selectedPeer?.peerName ?? 'Discussion'}</p>
                    <p className="text-xs font-mono text-muted-foreground">{peerId}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
                    {thread.map((m) => (
                      <div
                        key={m.id}
                        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                          m.mine
                            ? 'ml-auto bg-primary text-primary-foreground'
                            : 'mr-auto bg-card border border-border'
                        }`}
                      >
                        {!m.mine && <p className="text-xs opacity-80 mb-1">{m.senderName}</p>}
                        {m.title ? <p className="text-xs font-semibold mb-1">{m.title}</p> : null}
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <form onSubmit={handleSend} className="p-4 border-t border-border space-y-2">
                <select
                  required
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border rounded-lg text-sm"
                >
                  <option value="">Destinataire</option>
                  <optgroup label="Étudiants">
                    {students.map((s) => (
                      <option key={s.id} value={s.id} disabled={s.id === me.id}>
                        {s.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Personnel">
                    {staff.map((s) => (
                      <option key={s.id} value={s.id} disabled={s.id === me.id}>
                        {s.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <input
                  placeholder="Sujet (optionnel)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border rounded-lg text-sm"
                />
                <textarea
                  required
                  placeholder="Message"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-muted border rounded-lg text-sm"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  <Send size={16} />
                  {sending ? '…' : t('send')}
                </button>
              </form>
            </div>
          </div>
        )}
      </motion.div>
    </AppLayoutWrapper>
  );
}
