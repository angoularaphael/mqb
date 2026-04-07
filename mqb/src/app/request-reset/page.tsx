'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { requestPasswordResetAction } from '@/app/actions/auth';

export default function RequestResetPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const result = await requestPasswordResetAction({ email });
      if (result.success) {
        setMessage(result.message ?? '');
        setEmail('');
      } else {
        setError(result.error ?? '');
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md"
      >
        <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-2xl p-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8 text-sm"
          >
            <ArrowLeft size={18} />
            Retour
          </Link>

          <h1 className="text-3xl font-bold text-white mb-2">Réinitialiser le mot de passe</h1>
          <p className="text-slate-300 mb-8">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Email</label>
              <motion.input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
                whileFocus={{ scale: 1.02 }}
                required
              />
            </div>

            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm"
              >
                {message}
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                'Envoyer le lien'
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
