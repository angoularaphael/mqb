// Color palettes for animated background
export const COLOR_PALETTES = [
  ['#667eea', '#764ba2'], // Purple mix
  ['#f093fb', '#f5576c'], // Pinkish
  ['#4facfe', '#00f2fe'], // Blue mix
  ['#43e97b', '#38f9d7'], // Green mix
  ['#fa709a', '#fee140'], // Orange mix
  ['#30cfd0', '#330867'], // Cyan mix
];

export const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
  PARENT: 'parent',
};

export const ROLE_LABELS: Record<string, string> = {
  student: 'Étudiant',
  teacher: 'Enseignant',
  admin: 'Administrateur',
  parent: 'Parent',
};

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  JUSTIFIED: 'justified',
};

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  present: 'Présent',
  absent: 'Absent',
  late: 'Retard',
  justified: 'Justifié',
};

export const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  present: 'bg-green-100 text-green-800',
  absent: 'bg-red-100 text-red-800',
  late: 'bg-yellow-100 text-yellow-800',
  justified: 'bg-blue-100 text-blue-800',
};

export const MESSAGE_TYPE = {
  DIRECT: 'direct',
  BROADCAST: 'broadcast',
};

export const REQUEST_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
};

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  in_progress: 'En cours',
  resolved: 'Résolu',
  rejected: 'Rejeté',
};

export const REQUEST_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export const DAYS_OF_WEEK_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const ROOM_TYPES = {
  CLASSROOM: 'classroom',
  LAB: 'lab',
  AUDITORIUM: 'auditorium',
};

export const ROOM_TYPE_LABELS: Record<string, string> = {
  classroom: 'Salle de classe',
  lab: 'Laboratoire',
  auditorium: 'Amphithéâtre',
};

export const VISIBILITY = {
  PRIVATE: 'private',
  STUDENTS: 'students',
  PUBLIC: 'public',
};

export const VISIBILITY_LABELS: Record<string, string> = {
  private: 'Privé',
  students: 'Étudiants',
  public: 'Public',
};

// Session timeout
export const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
export const SESSION_WARNING_TIME = 10 * 60 * 1000; // 10 minutes before timeout
export const INACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check every minute

// WiFi code expiration (7 days)
export const WIFI_CODE_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

// Password reset code expiration (10 minutes)
export const PASSWORD_RESET_EXPIRATION = 10 * 60 * 1000;

export const MENU_STUDENT = [
  { href: '/dashboard', label: 'Accueil', icon: 'Home' },
  { href: '/student/evaluation', label: 'Évaluation', icon: 'BarChart3' },
  { href: '/student/planning', label: 'Planning', icon: 'Calendar' },
  { href: '/student/pedagogy', label: 'Pédagogie', icon: 'BookOpen' },
  { href: '/student/week', label: 'Ma semaine', icon: 'Clock' },
  { href: '/student/attendance', label: 'Émargement', icon: 'CheckSquare' },
  { href: '/student/data', label: 'Mes données', icon: 'FileText' },
  { href: '/student/life', label: 'Vie au centre', icon: 'Users' },
  { href: '/student/messaging', label: 'Messagerie', icon: 'MessageSquare' },
  { href: '/student/request', label: 'Requête', icon: 'HelpCircle' },
  { href: '/student/documents', label: 'Documents', icon: 'Folder' },
  { href: '/student/wifi', label: 'Code WiFi', icon: 'Wifi' },
  { href: '/settings', label: 'Paramètres', icon: 'Settings' },
];

export const MENU_TEACHER = [
  { href: '/teacher/dashboard', label: 'Tableau de bord', icon: 'Home' },
  { href: '/teacher/attendance', label: 'Appel & Émargement', icon: 'CheckSquare' },
  { href: '/teacher/messaging', label: 'Messagerie', icon: 'MessageSquare' },
  { href: '/teacher/documents', label: 'Documents', icon: 'Folder' },
  { href: '/teacher/courses', label: 'Cours', icon: 'BookOpen' },
  { href: '/teacher/constraints', label: 'Contraintes', icon: 'Clock' },
  { href: '/teacher/planning', label: 'Emploi du temps', icon: 'Calendar' },
  { href: '/teacher/exams', label: 'Examens & Quizz', icon: 'GraduationCap' },
  { href: '/teacher/rh', label: 'Espace RH', icon: 'Briefcase' },
  { href: '/settings', label: 'Paramètres', icon: 'Settings' },
];

export const MENU_ADMIN = [
  { href: '/admin/dashboard', label: 'Tableau de bord', icon: 'Home' },
  { href: '/settings', label: 'Profil', icon: 'User' },
  { href: '/admin/teachers', label: 'Gestion enseignants', icon: 'Users' },
  { href: '/admin/groups', label: 'Gestion groupes', icon: 'UsersRound' },
  { href: '/admin/rooms', label: 'Gestion salles', icon: 'Building2' },
  { href: '/admin/courses', label: 'Cours', icon: 'BookOpen' },
  { href: '/admin/schedules', label: 'Planning & créneaux', icon: 'Calendar' },
  { href: '/admin/wifi', label: 'Codes Wi‑Fi', icon: 'Wifi' },
  { href: '/admin/users', label: 'Gestion utilisateurs', icon: 'UsersRound' },
  { href: '/admin/constraints', label: 'Gestion contraintes', icon: 'Lock' },
  { href: '/admin/export', label: 'Exportation', icon: 'Download' },
  { href: '/admin/documents', label: 'Documents', icon: 'Folder' },
  { href: '/admin/requests', label: 'Requêtes', icon: 'HelpCircle' },
  { href: '/admin/messaging', label: 'Messagerie', icon: 'MessageSquare' },
  { href: '/admin/statistics', label: 'Statistiques', icon: 'BarChart3' },
  { href: '/admin/library', label: 'Bibliothèque / CDI', icon: 'BookOpen' },
  { href: '/admin/rh', label: 'Ressources Humaines', icon: 'Briefcase' },
];

export const MENU_PARENT = [
  { href: '/parent/dashboard', label: 'Mes Enfants', icon: 'Users' },
  { href: '/parent/messaging', label: 'Messagerie', icon: 'MessageSquare' },
  { href: '/settings', label: 'Paramètres', icon: 'Settings' },
];
