'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { loginAction } from '@/app/actions/auth';
import { COLOR_PALETTES } from '@/lib/constants';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await loginAction({ email, password });

      if (result.success) {
        // Redirect to appropriate dashboard based on role
        if (result.user?.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (result.user?.role === 'teacher') {
          router.push('/teacher/dashboard');
        } else {
          router.push('/student/dashboard');
        }
      } else {
        setError(result.error || 'Erreur de connexion');
      }
    } catch (err) {
      console.error(err);
      const dev = process.env.NODE_ENV === 'development';
      setError(
        dev && err instanceof Error
          ? err.message
          : 'Connexion impossible. En local avec « npm start » sur http, ajoutez AUTH_COOKIE_INSECURE=1 au fichier .env, ou utilisez « npm run dev ».',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 -z-10"
        animate={{
          background: [
            `linear-gradient(135deg, ${COLOR_PALETTES[0][0]} 0%, ${COLOR_PALETTES[0][1]} 100%)`,
            `linear-gradient(135deg, ${COLOR_PALETTES[1][0]} 0%, ${COLOR_PALETTES[1][1]} 100%)`,
            `linear-gradient(135deg, ${COLOR_PALETTES[2][0]} 0%, ${COLOR_PALETTES[2][1]} 100%)`,
            `linear-gradient(135deg, ${COLOR_PALETTES[3][0]} 0%, ${COLOR_PALETTES[3][1]} 100%)`,
            `linear-gradient(135deg, ${COLOR_PALETTES[4][0]} 0%, ${COLOR_PALETTES[4][1]} 100%)`,
            `linear-gradient(135deg, ${COLOR_PALETTES[5][0]} 0%, ${COLOR_PALETTES[5][1]} 100%)`,
            `linear-gradient(135deg, ${COLOR_PALETTES[0][0]} 0%, ${COLOR_PALETTES[0][1]} 100%)`,
          ],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      <div className="absolute inset-0 bg-black/20 -z-10" />

      {/* Floating shapes */}
      <motion.div
        className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"
        animate={{ y: [0, 50, 0], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"
        animate={{ y: [0, -50, 0], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div className="bg-background/80 backdrop-blur border border-white/20 rounded-2xl p-8 premium-glass shadow-2xl">
            {/* Live clock */}
            <motion.div
              className="text-center mb-8 p-4 bg-black/30 rounded-lg border border-white/10"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="text-sm text-white/60 mb-2">Date & Heure</div>
              <div className="text-2xl font-mono font-bold text-white">
                {currentTime.toLocaleTimeString('fr-FR')}
              </div>
              <div className="text-sm text-white/60">
                {currentTime.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </motion.div>

            {/* Header */}
            <div className="text-center mb-8">
              <motion.h1
                className="text-4xl font-bold text-white mb-2 glow-text"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                MQB
              </motion.h1>
              <p className="text-white/60">Gestion Scolaire Avancée</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email
                </label>
                <motion.input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/50 transition-colors"
                  whileFocus={{ scale: 1.02 }}
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <motion.input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/50 transition-colors pr-12"
                    whileFocus={{ scale: 1.02 }}
                    required
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                    whileHover={{ scale: 1.1 }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </motion.button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Connexion...
                  </>
                ) : (
                  <>
                    Se Connecter
                    <ArrowRight size={20} />
                  </>
                )}
              </motion.button>
            </form>

            {/* Links */}
            <div className="mt-6 space-y-3 text-center">
              <p className="text-white/60 text-sm">
                Mot de passe oublié?
                <Link href="/request-reset" className="text-blue-400 hover:text-blue-300 ml-1">
                  Réinitialiser
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
