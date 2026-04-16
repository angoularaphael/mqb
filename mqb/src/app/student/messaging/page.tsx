'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { canAccessStudentArea } from '@/lib/roles';
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
type Recipient = { id: string; label: string; email: string; role: string };

export default function StudentMessaging() {
  const router = useRouter();
  const { t } = useAppPrefs();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [tab, setTab] = useState<'chats' | 'broadcasts'>('chats');
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadMsg[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientId, setRecipientId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadLists = useCallback(async () => {
    const [c, b, r] = await Promise.all([
      fetchApi<{ conversations: Conv[] }>('/api/student/messaging/conversations'),
      fetchApi<{ broadcasts: Broadcast[] }>('/api/student/messaging/broadcasts'),
      fetchApi<{ recipients: Recipient[] }>('/api/student/recipients'),
    ]);
    setConversations(c.conversations);
    setBroadcasts(b.broadcasts);
    setRecipients(r.recipients);
  }, []);

  const loadThread = useCallback(async (pid: string) => {
    const d = await fetchApi<{ messages: ThreadMsg[] }>(
      `/api/student/messaging/thread?peerId=${encodeURIComponent(pid)}`,
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
    const load = async () => {
      const currentUser = await getCurrentUserAction();
      if (!currentUser || !canAccessStudentArea(currentUser.role)) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      try {
        await loadLists();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router, loadLists]);

  useEffect(() => {
    if (peerId && tab === 'chats') {
      loadThread(peerId).catch((e) => setError(e instanceof Error ? e.message : 'Erreur'));
    } else {
      setThread([]);
    }
  }, [peerId, tab, loadThread]);

  if (loading || !user) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    const rid = recipientId;
    try {
      await fetchApi('/api/student/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: rid, title, content }),
      });
      setTitle('');
      setContent('');
      setRecipientId('');
      await loadLists();
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

  const selectedPeer = conversations.find((c) => c.peerId === peerId);

  return (
    <AppLayoutWrapper user={user}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Messagerie</h1>
          <p className="text-muted-foreground text-sm">Discussions et diffusions</p>
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
          <div className="space-y-4 max-w-3xl">
            {broadcasts.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune diffusion.</p>
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
                  <p className="text-xs text-muted-foreground mt-2">
                    {b.createdAt ? new Date(b.createdAt * 1000).toLocaleString() : ''}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono">ID: {b.id}</p>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'chats' && (
          <div className="grid lg:grid-cols-[280px_1fr] gap-4 min-h-[480px]">
            <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
              <div className="p-2 border-b border-border text-xs text-muted-foreground font-mono">
                {t('conversations')}
              </div>
              <div className="overflow-y-auto flex-1">
                {conversations.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">Aucune discussion.</p>
                ) : (
                  conversations.map((c) => (
                    <button
                      key={c.peerId}
                      type="button"
                      onClick={() => setPeerId(c.peerId)}
                      className={`w-full text-left px-3 py-3 border-b border-border hover:bg-muted transition-colors ${
                        peerId === c.peerId ? 'bg-primary/10' : ''
                      }`}
                    >
                      <p className="font-medium text-sm">{c.peerName}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.preview}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-1">#{c.peerId.slice(0, 8)}…</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg flex flex-col min-h-[400px]">
              {!peerId ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-6">
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
                        <p className="text-[10px] opacity-70 mt-1">
                          {m.createdAt ? new Date(m.createdAt * 1000).toLocaleString() : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <form onSubmit={handleSend} className="p-4 border-t border-border space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{t('new_message')}</p>
                <select
                  required
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                >
                  <option value="">{t('select_recipient')}</option>
                  {recipients.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder={t('subject')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                />
                <textarea
                  required
                  placeholder={t('message_body')}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm resize-none"
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
