'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function IntroLoader() {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Hide the loader after a set duration
    const timer = setTimeout(() => {
      setShow(false);
    }, 2800); // 2.8 seconds should be enough for the animation to play

    // Check if we want to run it only once per session using session storage.
    // If you want it on every refresh, comment out the sessionStorage lines.
    /*
    const hasSeenIntro = sessionStorage.getItem('mqb_intro_seen');
    if (hasSeenIntro) {
      setShow(false);
      return;
    }
    sessionStorage.setItem('mqb_intro_seen', 'true');
    */

    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-background overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            transition: { duration: 0.8, ease: "easeInOut" } 
          }}
        >
          {/* Animated Background Gradients during load */}
          <motion.div
            className="absolute inset-0 z-0 opacity-30"
            animate={{
              background: [
                "radial-gradient(circle at 10% 20%, rgba(102, 126, 234, 0.4) 0%, transparent 40%)",
                "radial-gradient(circle at 90% 80%, rgba(118, 75, 162, 0.4) 0%, transparent 40%)",
                "radial-gradient(circle at 50% 50%, rgba(102, 126, 234, 0.4) 0%, transparent 40%)",
                "radial-gradient(circle at 10% 20%, rgba(102, 126, 234, 0.4) 0%, transparent 40%)",
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />

          <div className="relative z-10 flex flex-col items-center">
            {/* Logo Text Animation */}
            <motion.div className="flex overflow-hidden relative">
              {['M', 'Q', 'B'].map((letter, idx) => (
                <motion.span
                  key={idx}
                  className="text-7xl md:text-9xl font-bold text-foreground mx-1"
                  initial={{ y: 150, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    duration: 0.8,
                    ease: [0.16, 1, 0.3, 1], // Custom spring-like easing
                    delay: idx * 0.2, // Stagger effect
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </motion.div>

            {/* Glowing line / progress indicator */}
            <motion.div
              className="mt-6 h-1 bg-primary rounded-full"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "200px", opacity: 1 }}
              transition={{
                duration: 1.5,
                delay: 0.8, // Start after letters
                ease: "easeInOut",
              }}
            >
              <motion.div 
                className="w-full h-full bg-white blur-[2px]"
                animate={{ opacity: [0.2, 0.8, 0.2] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </motion.div>
            
            {/* Tagline */}
            <motion.p
              className="mt-4 text-muted-foreground text-sm font-medium tracking-widest uppercase"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.5 }}
            >
              Système de Gestion
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
