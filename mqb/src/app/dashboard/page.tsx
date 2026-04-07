'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserAction } from '@/app/actions/auth';
import { motion } from 'framer-motion';

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      const user = await getCurrentUserAction();

      if (!user) {
        router.push('/login');
        return;
      }

      switch (user.role) {
        case 'admin':
          router.push('/admin/dashboard');
          break;
        case 'teacher':
          router.push('/teacher/dashboard');
          break;
        case 'student':
          router.push('/student/dashboard');
          break;
        default:
          router.push('/login');
      }
    };

    redirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
      />
    </div>
  );
}
