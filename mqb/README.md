# MQB - Advanced School Management System

Une plateforme complète et professionnelle de gestion d'école avec authentification réelle, emplois du temps dynamiques, gestion des absences, notes, messagerie et bien plus.

## 🚀 Stack Technique

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui + Lucide Icons
- **Framer Motion** pour les animations premium
- **Drizzle ORM** + SQLite 3
- **Zustand** + TanStack Query
- **JWT Authentication** avec cookies sécurisés
- **Nodemailer** pour emails réels (Gmail SMTP)
- **@react-pdf/renderer** pour génération PDF
- **csv-stringify** pour exports CSV
- **ical-generator** pour calendriers iCal

## 🔧 Installation

### 1. Cloner et installer les dépendances

```bash
cd mqb
npm install
# ou
pnpm install
```

### 2. Configuration Gmail SMTP

Pour l'envoi d'emails réels, configurez votre compte Gmail :

1. Allez sur [Google Account](https://myaccount.google.com/)
2. Accédez à **Sécurité** > **App Passwords**
3. Générez un App Password
4. Créez un fichier `.env.local` :

```env
DATABASE_URL="file:./database.db"
EMAIL_USER=suzinabot@gmail.com
EMAIL_PASS=votre_app_password_ici
JWT_SECRET=votre_secret_jwt_super_long_ici
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Initialiser la base de données

```bash
# Créer le schéma et les migrations
npm run db:push

# Remplir avec des données de démonstration
npm run seed
```

### 4. Démarrer le serveur de développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

## 📝 Identifiants de Test

Après le seed, utilisez ces identifiants pour tester :

### Admin
- **Email:** admin@mqb.local
- **Password:** MQB@2024!

### Professeur
- **Email:** prof.martin@mqb.local
- **Password:** MQB@2024!

### Étudiant
- **Email:** etudiant1@mqb.local
- **Password:** MQB@2024!

### Code WiFi
- Généré automatiquement lors du seed (affiché dans la console)

## 🏠 Structure du Projet

```
mqb/
├── src/
│   ├── app/                      # Routes Next.js
│   │   ├── (auth)/              # Routes authentification
│   │   ├── (app)/               # Routes protégées
│   │   │   ├── dashboard/       # Dashboards par rôle
│   │   │   ├── student/         # Espace étudiant
│   │   │   ├── teacher/         # Espace enseignant
│   │   │   └── admin/           # Espace administrateur
│   │   ├── actions/             # Server actions
│   │   └── layout.tsx           # Layout principal
│   ├── components/              # Composants React
│   │   ├── ui/                  # Composants shadcn/ui
│   │   ├── animations/          # Composants animés
│   │   └── dashboard/           # Composants métier
│   ├── db/
│   │   ├── schema.ts            # Schéma Drizzle
│   │   ├── migrations/          # Migrations auto
│   │   └── index.ts             # Client DB
│   ├── lib/
│   │   ├── auth.ts              # Utilitaires JWT/Auth
│   │   ├── email.ts             # Nodemailer config
│   │   ├── files.ts             # Gestion fichiers
│   │   ├── exports.ts           # PDF/CSV/iCal
│   │   ├── db-client.ts         # Queries DB
│   │   ├── store.ts             # Zustand stores
│   │   ├── constants.ts         # Constantes
│   │   └── validations.ts       # Schémas Zod
│   ├── types/                   # Types TypeScript
│   ├── seed.ts                  # Population DB
│   ├── middleware.ts            # Auth middleware
│   └── globals.css              # Styles globaux
├── database.db                  # SQLite (généré)
├── uploads/                     # Fichiers uploads (généré)
├── drizzle.config.ts            # Config Drizzle
├── next.config.ts               # Config Next.js
├── tailwind.config.ts           # Config Tailwind
├── tsconfig.json                # Config TypeScript
├── .env.example                 # Variables exemple
└── package.json                 # Dépendances

```

## ✨ Fonctionnalités Principales

### Authentification
- ✅ Login/Logout avec JWT
- ✅ Réinitialisation de mot de passe via email
- ✅ Sessions auto-expirantes (2h inactivité)
- ✅ Protection des routes par rôle

### Espace Étudiant
- 📊 Dashboard avec actualités et planning
- 📅 Planning et emploi du temps détaillé
- 📝 Historique des absences et notes
- ✅ Émargement numérique
- 💬 Messagerie et diffusions
- 📧 Notifications par email
- 🔐 Code WiFi personnel
- ⚙️ Paramètres (thème, police, langue)

### Espace Enseignant
- 📋 Prise d'appel et émargement
- 📚 Gestion documents et cours
- ⏰ Gestion des contraintes horaires
- 💬 Messagerie avec étudiants
- 📅 Visualisation emploi du temps

### Espace Administrateur
- 🎛️ Tableau de bord avec KPI
- 👥 CRUD complet utilisateurs/groupes/salles
- 📅 Générateur d'emplois du temps
- 📊 Statistiques avancées
- 📤 Exports (PDF, CSV, iCal)
- 🔐 Générateur code WiFi
- 📨 Messagerie de diffusion massive
- 📄 Gestion documents

## 🎨 UX/UI Premium

- ✨ Animations fluides Framer Motion partout
- 🎨 Dark mode élégant par défaut
- 🌈 Gradients animés (changement toutes les 2s)
- 💎 Glassmorphism design
- 📱 100% responsive mobile/tablet
- ⌨️ Accessibilité (ARIA labels)
- 🎯 Toasts animés pour actions
- ⚡ Loaders premium
- 🎉 Confetti discrets

## 📊 Données Persistées en SQLite

- Utilisateurs avec rôles (étudiant, enseignant, admin)
- Groupes et groupes d'étudiants
- Salles et types de salles
- Cours et emplois du temps
- Présences et absences
- Notes et évaluations
- Documents et fichiers
- Messages et diffusions
- Requêtes étudiants
- Codes WiFi avec expiration
- Toutes les données sont 100% réelles et persistantes

## 🚀 Performance

- ⚡ React Query pour caching intelligent
- 🎯 Pagination et infinité scroll
- 🖼️ Image optimization (Next.js)
- 📦 Code splitting automatique
- 🔄 Revalidation temps réel

## 🔐 Sécurité

- 🔒 JWT tokens sécurisés
- 🍪 Cookies httpOnly
- 🛡️ CSRF protection
- ✅ Validation Zod côté client/serveur
- 🔐 Hashage bcrypt des mots de passe
- 🚫 Middleware d'authentification
- 🚨 Gestion des erreurs sécurisée

## 📧 Emails Réels

Le système envoie des emails réels à travers Gmail SMTP :

- ✉️ Réinitialisation de mot de passe
- 📢 Messagerie de diffusion
- 🔔 Notifications système
- Tous les emails sont templés et professionnels

## 🗂️ Upload & Téléchargement

- 📤 Upload de fichiers réels dans `./uploads`
- 📥 Téléchargement de documents
- 📄 Génération PDF (emploi du temps, rapports)
- 📊 Export CSV (listes, statistiques)
- 📅 Export iCal (calendriers)

## 🛠️ Commandes Utiles

```bash
# Développement
npm run dev              # Démarrer serveur dev
npm run build           # Build production
npm run start           # Démarrer prod
npm run lint            # Linting

# Base de données
npm run db:push         # Push schema DB
npm run db:studio       # Drizzle Studio UI
npm run seed            # Population données

```

## 🎯 Roadmap Future

- [ ] Synchronisation iCal bidirectionnelle
- [ ] Intégration Zoom/Teams pour visioconférences
- [ ] Notifications push web
- [ ] Analytics avancés
- [ ] Import données depuis Ypareo
- [ ] API publique GraphQL
- [ ] Mobile app React Native

## 📞 Support

Pour toute question ou problème :
- Vérifiez les variables `.env.local`
- Assurez-vous que Gmail SMTP est configuré
- Vérifiez les logs du serveur
- Testez avec les identifiants par défaut du seed

## 📄 License

© 2024 MQB - All Rights Reserved

---

**Bon utilisation de MQB!** 🎓
