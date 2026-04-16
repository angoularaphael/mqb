// ---- Internationalization (i18n) ----

export type Locale = 'fr' | 'en';

const translations = {
  fr: {
    // Navbar
    'nav.login': 'Se connecter',

    // Home page
    'home.hero.title_line1': "L'excellence dans la",
    'home.hero.title_line2': 'Gestion Scolaire',
    'home.hero.desc':
      "Une plateforme professionnelle complète pour fluidifier l'organisation de votre établissement. Simplifiez vos plannings, suivez l'évolution de vos étudiants et centralisez toutes vos ressources.",
    'home.hero.cta': 'Accéder au portail',
    'home.stats.students': 'Étudiants gérés',
    'home.stats.teachers': 'Enseignants & Staff',
    'home.features.title': 'Une solution tout-en-un',
    'home.features.auth.title': 'Authentification Supérieure',
    'home.features.auth.desc':
      'Portails dédiés, sécurité maximale par JWT, rôles strictement segmentés.',
    'home.features.schedule.title': 'Emplois du Temps',
    'home.features.schedule.desc':
      'Planification intelligente, gestion des contraintes salles et professeurs.',
    'home.features.stats.title': 'Suivi & Statistiques',
    'home.features.stats.desc':
      'Tableaux de bord des notes, retards, absences et rapports automatiques.',
    'home.footer':
      '© 2024 MQB System - Architecture & Gestion Scolaire Avancée',

    // Role selection
    'role.title': 'Choisir votre portail',
    'role.desc': 'Veuillez sélectionner votre profil pour vous connecter.',
    'role.student': 'Espace Étudiant',
    'role.student.desc': 'Accédez à vos cours et notes',
    'role.teacher': 'Espace Enseignant',
    'role.teacher.desc': 'Gérez vos emplois du temps',
    'role.parent': 'Portail Parent',
    'role.parent.desc': 'Suivez la scolarité de vos enfants',
    'role.admin.note':
      "Note: L'accès Administrateur est géré sur n'importe quel portail.",

    // Login page
    'login.back': "Retour à l'accueil",
    'login.student.space': 'Espace Étudiant',
    'login.teacher.space': 'Espace Enseignant',
    'login.parent.space': 'Portail Parent',
    'login.subtitle': 'Veuillez vous authentifier pour continuer',
    'login.email': 'Adresse Email',
    'login.email.placeholder': 'votre@email.com',
    'login.password': 'Mot de passe',
    'login.password.forgot': 'Oublié ?',
    'login.submit': 'Se connecter',
    'login.loading': 'Connexion...',
    'login.error.generic': 'Connexion impossible. Veuillez réessayer.',
    'login.secure': 'Connexion sécurisée MQB System',
    'login.datetime': 'Date & Heure',

    // Theme
    'theme.light': 'Clair',
    'theme.dark': 'Sombre',
    'theme.system': 'Système',
  },
  en: {
    // Navbar
    'nav.login': 'Log in',

    // Home page
    'home.hero.title_line1': 'Excellence in',
    'home.hero.title_line2': 'School Management',
    'home.hero.desc':
      'A comprehensive professional platform to streamline your institution. Simplify scheduling, track student progress, and centralize all your resources.',
    'home.hero.cta': 'Access portal',
    'home.stats.students': 'Students managed',
    'home.stats.teachers': 'Teachers & Staff',
    'home.features.title': 'An all-in-one solution',
    'home.features.auth.title': 'Superior Authentication',
    'home.features.auth.desc':
      'Dedicated portals, maximum JWT security, strictly segmented roles.',
    'home.features.schedule.title': 'Timetables',
    'home.features.schedule.desc':
      'Intelligent scheduling, room and teacher constraint management.',
    'home.features.stats.title': 'Tracking & Statistics',
    'home.features.stats.desc':
      'Dashboards for grades, tardiness, absences, and automatic reports.',
    'home.footer':
      '© 2024 MQB System - Advanced School Architecture & Management',

    // Role selection
    'role.title': 'Choose your portal',
    'role.desc': 'Please select your profile to log in.',
    'role.student': 'Student Portal',
    'role.student.desc': 'Access your courses and grades',
    'role.teacher': 'Teacher Portal',
    'role.teacher.desc': 'Manage your timetables',
    'role.parent': 'Parent Portal',
    'role.parent.desc': "Monitor your children's progress",
    'role.admin.note':
      'Note: Admin access is available through any portal.',

    // Login page
    'login.back': 'Back to home',
    'login.student.space': 'Student Portal',
    'login.teacher.space': 'Teacher Portal',
    'login.parent.space': 'Parent Portal',
    'login.subtitle': 'Please authenticate to continue',
    'login.email': 'Email Address',
    'login.email.placeholder': 'your@email.com',
    'login.password': 'Password',
    'login.password.forgot': 'Forgot?',
    'login.submit': 'Log in',
    'login.loading': 'Logging in...',
    'login.error.generic': 'Login failed. Please try again.',
    'login.secure': 'Secure MQB System Login',
    'login.datetime': 'Date & Time',

    // Theme
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',
  },
} as const;

export type TranslationKey = keyof (typeof translations)['fr'];

export function t(locale: Locale, key: TranslationKey): string {
  return translations[locale]?.[key] ?? translations['fr'][key] ?? key;
}

export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'fr';
  return (localStorage.getItem('mqb_locale') as Locale) || 'fr';
}

export function setStoredLocale(locale: Locale) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mqb_locale', locale);
  }
}
