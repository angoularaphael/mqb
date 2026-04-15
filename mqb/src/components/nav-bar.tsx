'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  MapPin, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  FileText, 
  BarChart, 
  UserCheck,
  Building,
  HelpCircle
} from 'lucide-react';

interface RoleNavBarProps {
  role?: string; // 'admin' | 'teacher' | 'student'
}

type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
};

// Define routes for each role
const NAV_LINKS: Record<string, NavItem[]> = {
  admin: [
    { name: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={16} /> },
    { name: 'Utilisateurs', href: '/admin/users', icon: <Users size={16} /> },
    { name: 'Professeurs', href: '/admin/teachers', icon: <GraduationCap size={16} /> },
    { name: 'Groupes', href: '/admin/groups', icon: <Users size={16} /> },
    { name: 'Cours', href: '/admin/courses', icon: <BookOpen size={16} /> },
    { name: 'Salles', href: '/admin/rooms', icon: <MapPin size={16} /> },
    { name: 'Emplois', href: '/admin/schedules', icon: <Calendar size={16} /> },
    { name: 'Docs', href: '/admin/documents', icon: <FileText size={16} /> },
    { name: 'Comms', href: '/admin/messaging', icon: <MessageSquare size={16} /> },
    { name: 'Stats', href: '/admin/statistics', icon: <BarChart size={16} /> },
  ],
  teacher: [
    { name: 'Dashboard', href: '/teacher/dashboard', icon: <LayoutDashboard size={16} /> },
    { name: 'Mes Cours', href: '/teacher/courses', icon: <BookOpen size={16} /> },
    { name: 'Planning', href: '/teacher/planning', icon: <Calendar size={16} /> },
    { name: 'Absences', href: '/teacher/attendance', icon: <UserCheck size={16} /> },
    { name: 'Contraintes', href: '/teacher/constraints', icon: <Calendar size={16} /> },
    { name: 'Documents', href: '/teacher/documents', icon: <FileText size={16} /> },
    { name: 'Comms', href: '/teacher/messaging', icon: <MessageSquare size={16} /> },
  ],
  student: [
    { name: 'Dashboard', href: '/student/dashboard', icon: <LayoutDashboard size={16} /> },
    { name: 'Planning', href: '/student/planning', icon: <Calendar size={16} /> },
    { name: 'Évaluations', href: '/student/evaluation', icon: <FileText size={16} /> },
    { name: 'Pédagogie', href: '/student/pedagogy', icon: <BookOpen size={16} /> },
    { name: 'Présences', href: '/student/attendance', icon: <UserCheck size={16} /> },
    { name: 'Demandes', href: '/student/request', icon: <HelpCircle size={16} /> },
    { name: 'Vie Scolaire', href: '/student/life', icon: <Building size={16} /> },
    { name: 'Documents', href: '/student/documents', icon: <FileText size={16} /> },
    { name: 'Comms', href: '/student/messaging', icon: <MessageSquare size={16} /> },
  ]
};

export function RoleNavBar({ role }: RoleNavBarProps) {
  const pathname = usePathname();
  
  if (!role || !NAV_LINKS[role.toLowerCase()]) {
    return null;
  }

  const links = NAV_LINKS[role.toLowerCase()];

  return (
    <nav className="w-full bg-background border-b border-border z-40 sticky top-[73px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Horizontal scroll container with hidden scrollbar */}
        <div className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors flex-shrink-0 ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {link.icon}
                {link.name}

                {/* Animated active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="navbar-active-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
