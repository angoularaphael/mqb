'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { COLOR_PALETTES } from '@/lib/constants';

export default function HomePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
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

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 -z-10" />

      {/* Floating shapes */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl"
        animate={{
          y: [0, 100, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl"
        animate={{
          y: [0, -100, 0],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 min-h-screen flex items-center justify-center px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Title */}
          <motion.div variants={itemVariants} className="mb-8">
            <motion.h1
              className="text-7xl md:text-8xl font-bold text-white mb-4 glow-text"
              animate={{
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              MQB
            </motion.h1>
          </motion.div>

          {/* Main text with typing effect */}
          <motion.div variants={itemVariants} className="mb-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 px-1 break-words hyphens-auto">
              Bienvenue dans
              <span className="block mt-4 typing-text text-balance">
                MQB - Système Avancé de Gestion Scolaire
              </span>
            </h2>
          </motion.div>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="text-xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Une plateforme complète et professionnelle pour la gestion d'école.
            Authentification sécurisée, emplois du temps dynamiques, gestion des notes,
            et bien plus encore.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href="/login"
              className="inline-block px-12 py-4 bg-white text-blue-600 font-bold rounded-lg shadow-2xl hover:shadow-3xl transition-shadow text-lg"
            >
              Se Connecter
            </Link>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            variants={itemVariants}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { icon: '🔐', title: 'Authentification', desc: 'Sécurité JWT avancée' },
              { icon: '📅', title: 'Emplois du temps', desc: 'Gestion complète' },
              { icon: '📊', title: 'Statistiques', desc: 'Rapports détaillés' },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-6 premium-glass"
                whileHover={{ y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-white/70 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Footer text */}
          <motion.p
            variants={itemVariants}
            className="mt-16 text-white/60 text-sm"
          >
            © 2024 MQB - Tous droits réservés
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
