'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Copy, CheckCircle } from 'lucide-react';
import { canAccessStudentArea } from '@/lib/roles';
import { fetchApi } from '@/lib/fetch-api';

type WifiPayload = { code: string | null; networkName: string | null; expiresAt: string | null };

export default function StudentWiFi() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wifi, setWifi] = useState<WifiPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      const currentUser = await getCurrentUserAction();
      if (!currentUser || !canAccessStudentArea(currentUser.role)) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      try {
        const w = await fetchApi<WifiPayload>('/api/student/wifi');
        setWifi(w);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [router]);

  if (isLoading) return null;
  if (!user) return null;

  const wifiCode = wifi?.code ?? '';
  const networkName = wifi?.networkName ?? '—';

  const handleCopy = () => {
    if (!wifiCode) return;
    navigator.clipboard.writeText(wifiCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayoutWrapper user={user}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Code WiFi</h1>
          <p className="text-muted-foreground">Code actif en base (table wifi_codes) — /api/student/wifi</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white rounded-2xl p-8 text-center shadow-lg"
        >
          <p className="text-sm opacity-90 mb-2">Réseau WiFi</p>
          <p className="text-2xl font-semibold mb-8">{networkName}</p>

          <div className="bg-white/20 backdrop-blur rounded-lg p-8 mb-8">
            <p className="text-sm opacity-90 mb-3">Code d&apos;accès</p>
            {wifiCode ? (
              <p className="text-4xl sm:text-6xl font-mono font-bold tracking-widest mb-6 break-all">
                {wifiCode}
              </p>
            ) : (
              <p className="text-lg mb-6 opacity-90">Aucun code actif (admin : insérer une ligne wifi_codes).</p>
            )}
            {wifiCode ? (
              <motion.button
                onClick={handleCopy}
                whileHover={{ scale: 1.05 }}
                className="flex items-center justify-center gap-3 mx-auto px-6 py-3 bg-white text-blue-600 font-bold rounded-lg"
              >
                {copied ? (
                  <>
                    <CheckCircle size={20} />
                    Copié
                  </>
                ) : (
                  <>
                    <Copy size={20} />
                    Copier
                  </>
                )}
              </motion.button>
            ) : null}
          </div>

          {wifi?.expiresAt ? (
            <p className="text-xs opacity-75">Valide jusqu&apos;au {wifi.expiresAt}</p>
          ) : null}
        </motion.div>
      </motion.div>
    </AppLayoutWrapper>
  );
}
