'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { resetPasswordAction } from '@/app/actions/auth';

function ResetPasswordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code) {
      setError('Code de réinitialisation manquant');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit avoir au moins 8 caractères');
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPasswordAction({
        code,
        password,
        confirmPassword,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(result.error ?? '');
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  if (!code) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Code invalide</h1>
          <p className="text-slate-300 mb-8">
            Le code de réinitialisation est manquant ou invalide.
          </p>
          <Link href="/request-reset" className="text-purple-400 hover:text-purple-300">
            Demander une nouvelle réinitialisation
          </Link>
        </div>
      </div>
    );
  }

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

          <h1 className="text-3xl font-bold text-white mb-2">Nouveau mot de passe</h1>
          <p className="text-slate-300 mb-8">Entrez votre nouveau mot de passe</p>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-center"
            >
              <p className="text-green-200 font-bold">✓ Mot de passe réinitialisé!</p>
              <p className="text-green-200/70 text-sm mt-2">Redirection vers connexion...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <motion.input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors pr-12"
                    whileFocus={{ scale: 1.02 }}
                    required
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    whileHover={{ scale: 1.1 }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </motion.button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <motion.input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors pr-12"
                    whileFocus={{ scale: 1.02 }}
                    required
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    whileHover={{ scale: 1.1 }}
                  >
                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </motion.button>
                </div>
              </div>

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
                    Traitement...
                  </>
                ) : (
                  'Réinitialiser le mot de passe'
                )}
              </motion.button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <p className="text-slate-300">Chargement…</p>
        </div>
      }
    >
      <ResetPasswordPageInner />
    </Suspense>
  );
}
