# MQB - Advanced School Management System

Une plateforme complète et professionnelle de gestion d'école avec authentification réelle, emplois du temps dynamiques, gestion des absences, notes, messagerie et bien plus.

## 🌐 Déploiement en Production

**🚀 Application en ligne :** https://mieux-que-brad.onrender.com

---

## 📝 Informations de Connexion

### Compte Administrateur
```
Email    : giffareno05@gmail.com
Mot de passe : 12345678
```

### Test d'Email (pour notifications)
```
Email : suzinabot@gmail.com
```

---

## 🚀 Stack Technique

- **Next.js 14** (App Router) + TypeScript
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

### 2. Configuration Environnement (.env.local)

Créez un fichier `.env.local` avec vos variables :

```env
# Base de données
DATABASE_URL=file:./data/mqb.db

# Authentification
JWT_SECRET=votre-clé-secrète-super-longue-ici
NEXTAUTH_SECRET=votre-secret-auth-long-ici
NEXTAUTH_URL=http://localhost:3000

# Admin par défaut
BOOTSTRAP_ADMIN_EMAIL=giffareno05@gmail.com
BOOTSTRAP_ADMIN_PASSWORD=12345678

# Email (Gmail SMTP)
EMAIL_USER=suzinabot@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx  # App Password, pas le mot de passe Gmail normal

# Application
NEXT_PUBLIC_APP_NAME=MQB
NEXT_PUBLIC_APP_URL=http://localhost:3000
EMAIL_FROM_NAME=MQB System
EMAIL_FROM_EMAIL=suzinabot@gmail.com
```

**⚠️ Important pour Gmail :**
1. Allez sur [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Sélectionnez "Mail" et "Windows Computer"
3. Copiez le mot de passe généré (16 caractères)
4. Collez-le dans `EMAIL_PASS` (sans espaces de séparation)

### 3. Initialiser la base de données

```bash
# Créer le schéma et les migrations
npm run db:push

# Créer le compte admin initial
npm run bootstrap
```

### 4. Démarrer le serveur de développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) et connectez-vous avec :
```
Email : giffareno05@gmail.com
Mot de passe : 12345678
```

---

## 🚀 Déploiement sur Render

### Prerequisites
- Repository GitHub avec votre code
- Compte Render gratuit (render.com)

### Étapes

1. **Créer un Web Service sur Render**
   - Aller sur [render.com](https://render.com)
   - Cliquer **New +** → **Web Service**
   - Connecter GitHub et sélectionner votre repo
   - Runtime : **Docker**

2. **Variables d'Environnement**
   ```
   DATABASE_URL=file:./data/mqb.db
   NODE_ENV=production
   NEXTAUTH_URL=https://votre-app.onrender.com
   NEXTAUTH_SECRET=(Générer une clé aléatoire)
   JWT_SECRET=(Générer une clé aléatoire)
   BOOTSTRAP_ADMIN_EMAIL=giffareno05@gmail.com
   BOOTSTRAP_ADMIN_PASSWORD=12345678
   EMAIL_USER=suzinabot@gmail.com
   EMAIL_PASS=(Votre App Password Gmail)
   NEXT_PUBLIC_APP_NAME=MQB
   NEXT_PUBLIC_APP_URL=https://votre-app.onrender.com
   EMAIL_FROM_NAME=MQB System
   EMAIL_FROM_EMAIL=suzinabot@gmail.com
   ```

3. **Persistent Disk** (pour SQLite)
   - Mount Path : `/opt/render/project/mqb/data`
   - Size : 1 GB

4. **Déployer**
   - Cliquer **Create Web Service**
   - Attendre ~10-15 minutes pour le build

### Accès à l'Application
```
https://votre-app.onrender.com
Email : giffareno05@gmail.com
Mot de passe : 12345678
```

---

## 📝 Identifiants de Connexion

### Compte Super Administrateur
```
Email    : giffareno05@gmail.com
Mot de passe : 12345678
```

Ce compte est créé automatiquement au premier démarrage de l'application.

### Configuration Email
```
Email utilisé    : suzinabot@gmail.com
Utilisé pour     : Notifications et emails système
```

Pour configurer votre propre email, mettez à jour `.env.local` :

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
