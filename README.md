# Mieux Que Brad (MQB)

Une plateforme de gestion éducative complète pour les étudiants, enseignants et administrateurs.

## 🚀 Déploiement en Production

**URL de l'application :** https://mieux-que-brad.onrender.com

Déployé sur **Render** avec Docker.

---

## 📝 Informations de Connexion

### Compte Administrateur par Défaut

```
Email    : giffareno05@gmail.com
Mot de passe : 12345678
```

### Compte de Test Email
```
Email    : suzinabot@gmail.com
Ces informations sont utilisées pour les notifications par email
```

---

## 🏗️ Architecture du Projet

```
mieux-que-brad/
├── mqb/                          # Frontend Next.js + Backend intégré
│   ├── src/
│   │   ├── app/                  # Routes et pages Next.js
│   │   ├── components/           # Composants React
│   │   ├── db/                   # Configuration base de données (SQLite + Drizzle)
│   │   ├── lib/                  # Utilitaires et helpers
│   │   └── store/                # État global
│   ├── public/                   # Fichiers statiques
│   ├── package.json
│   └── Dockerfile
├── mqb-backend/                  # Backend Node.js (optionnel, si utilisé)
│   └── server.js
├── Dockerfile                    # Dockerfile racine pour Render
└── docker-compose.yml            # Configuration pour développement local
```

---

## 🛠️ Installation et Développement Local

### Prérequis
- Node.js 20+
- npm ou yarn
- Docker (optionnel, pour docker-compose)

### Installation

```bash
# Cloner le repository
git clone https://github.com/angoularaphael/mqb.git
cd mqb

# Installer les dépendances du frontend
cd mqb
npm install

# Ou avec Docker Compose
cd ..
docker-compose up
```

### Variables d'Environnement `.env`

Créer un fichier `.env` ou `.env.local` dans `mqb/` :

```env
# Base de données
DATABASE_URL=file:./data/mqb.db

# Authentification JWT
JWT_SECRET=votre-clé-secrète-ici

# Admin par défaut
BOOTSTRAP_ADMIN_EMAIL=giffareno05@gmail.com
BOOTSTRAP_ADMIN_PASSWORD=12345678

# Email
EMAIL_USER=suzinabot@gmail.com
EMAIL_PASS=votre-mot-de-passe-app

# Application
NEXT_PUBLIC_APP_NAME=MQB
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=votre-secret-jwt

# Email
EMAIL_FROM_NAME=MQB System
EMAIL_FROM_EMAIL=suzinabot@gmail.com
```

### Lancer le développement

```bash
cd mqb
npm run dev
```

L'application sera accessible sur **http://localhost:3000**

---

## 🗄️ Base de Données

- **Type :** SQLite
- **ORM :** Drizzle
- **Emplacement :** `mqb/data/mqb.db`

### Migrations

```bash
cd mqb
npm run migrate
```

---

## 🚀 Déployer sur Render

1. **Pousser vers GitHub**
   ```bash
   git push origin main
   ```

2. **Créer un service Web sur Render**
   - Aller sur [render.com](https://render.com)
   - Cliquer **New +** → **Web Service**
   - Connecter votre GitHub
   - Sélectionner le repo `mqb`
   - Runtime : **Docker**

3. **Variables d'Environnement sur Render**
   ```
   NEXTAUTH_SECRET       = [Générer une clé secrète aléatoire]
   NEXTAUTH_URL          = https://mieux-que-brad.onrender.com
   NODE_ENV              = production
   EMAIL_USER            = suzinabot@gmail.com
   EMAIL_PASS            = [Votre mot de passe app]
   BOOTSTRAP_ADMIN_EMAIL = giffareno05@gmail.com
   BOOTSTRAP_ADMIN_PASSWORD = 12345678
   ```

4. **Persistent Disk** (pour SQLite)
   - Mount Path : `/opt/render/project/mqb/data`
   - Size : 1 GB

---

## 📚 Fonctionnalités Principales

### Administrateurs
- Dashboard analytique
- Gestion des utilisateurs
- Gestion des cours et contraintes
- Gestion des emplois du temps
- Export de données
- Gestion WiFi

### Enseignants
- Gestion des cours
- Feuilles d'émargement (présences)
- Évaluation des étudiants
- Planification pédagogique
- Messagerie

### Étudiants
- Tableau de bord personnalisé
- Consultation du planning
- Consultation des documents pédagogiques
- Évaluation et notes
- Demandes et requêtes
- Messagerie

---

## 🔐 Sécurité

- **JWT** pour l'authentification
- **NextAuth.js** pour la gestion des sessions
- **Variables d'environnement** pour les secrets
- **Validation des données** côté serveur et client

---

## 📧 Support Email

Les emails de notification sont envoyés via :
- **Service :** Gmail App Password
- **Email :** suzinabot@gmail.com
- **Templates :** Notifications de réinitialisation de mot de passe, confirmations, etc.

---

## 🐛 Dépannage

### Docker build échoue
- Vérifier que `package-lock.json` existe dans `mqb/`
- S'assurer que le dossier `mqb/public/` existe
- Vérifier les permissions des fichiers

### Erreur de connexion
- Vérifier la variable `DATABASE_URL`
- S'assurer que le dossier `data/` est accessible en écriture
- Sur Render, vérifier que le Persistent Disk est configuré

### Erreur d'email
- Vérifier les credentials Gmail
- Utiliser un **App Password**, pas le mot de passe principal
- Vérifier `NEXTAUTH_URL` correspond au domaine

---

## 📝 Licence

Projet privé - Tous droits réservés.

---

## 👥 Contact

- **Email Admin :** giffareno05@gmail.com
- **GitHub :** https://github.com/angoularaphael/mqb
- **Déploiement :** https://mieux-que-brad.onrender.com
