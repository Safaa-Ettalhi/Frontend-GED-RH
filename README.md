# GEDPro Frontend - Plateforme GED RH Intelligente

Application web Front-End moderne développée avec Next.js 16 pour la gestion électronique de documents orientée RH.

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Scripts disponibles](#scripts-disponibles)
- [Structure du projet](#structure-du-projet)
- [Fonctionnalités principales](#fonctionnalités-principales)
- [Technologies utilisées](#technologies-utilisées)
- [Dépendances](#dépendances)
- [CI/CD](#cicd)
- [Déploiement](#déploiement)

## 🎯 Vue d'ensemble

GEDPro Frontend est une application web moderne permettant aux équipes RH d'interagir efficacement avec la plateforme GED RH. L'application offre une expérience utilisateur fluide, claire et sécurisée pour la gestion des documents, candidats, entretiens, formulaires RH et comptes utilisateurs.

### Caractéristiques principales

- ✅ **Authentification sécurisée** avec JWT et gestion des rôles
- ✅ **Tableau de bord personnalisé** selon le rôle utilisateur
- ✅ **Gestion documentaire intelligente** avec OCR et extraction de compétences
- ✅ **Formulaires RH dynamiques** avec création et soumission
- ✅ **Planification d'entretiens** avec synchronisation Google Calendar
- ✅ **Notifications temps réel** via WebSocket
- ✅ **Server-Side Rendering (SSR)** pour les offres d'emploi (SEO)
- ✅ **Support multi-organisation** avec isolation des données
- ✅ **Interface responsive** et moderne

## 🏗️ Architecture

### Architecture générale

L'application utilise **Next.js 16** avec l'**App Router** (architecture moderne de Next.js), permettant une combinaison optimale de Server-Side Rendering (SSR) et de Client-Side Rendering (CSR).

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                    │
├─────────────────────────────────────────────────────────┤
│  Server Components (SSR)  │  Client Components (CSR)    │
│  - Offres d'emploi       │  - Interactions utilisateur  │
│  - Métadonnées SEO       │  - Formulaires dynamiques    │
│  - Données initiales     │  - Notifications temps réel  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Backend API (NestJS)                        │
│  - REST API                                              │
│  - WebSocket (Socket.io)                                 │
│  - PostgreSQL + MongoDB                                 │
└─────────────────────────────────────────────────────────┘
```

### Structure des dossiers

```
frontend/
├── src/
│   ├── app/                    # App Router (Next.js 16)
│   │   ├── (auth)/             # Routes d'authentification (groupe)
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── dashboard/          # Routes du tableau de bord
│   │   │   ├── applications/   # Candidatures (candidats)
│   │   │   ├── calendar/       # Calendrier des entretiens
│   │   │   ├── candidates/     # Gestion des candidats
│   │   │   ├── documents/      # Gestion documentaire
│   │   │   ├── forms/          # Formulaires RH
│   │   │   ├── job-offers/     # Offres d'emploi (admin/RH)
│   │   │   ├── offres/         # Offres publiques (SSR)
│   │   │   ├── notifications/  # Notifications
│   │   │   ├── organizations/  # Organisations (admin)
│   │   │   ├── profile/        # Profil utilisateur
│   │   │   └── users/          # Gestion utilisateurs
│   │   ├── layout.tsx          # Layout racine
│   │   └── page.tsx            # Page d'accueil
│   │
│   ├── components/             # Composants réutilisables
│   │   ├── auth/                # Composants d'authentification
│   │   │   ├── auth-guard.tsx
│   │   │   ├── login-form.tsx
│   │   │   ├── logout-button.tsx
│   │   │   ├── register-form.tsx
│   │   │   └── role-guard.tsx
│   │   ├── dashboard/          # Composants de tableau de bord
│   │   │   ├── admin-dashboard.tsx
│   │   │   ├── candidate-dashboard.tsx
│   │   │   ├── manager-dashboard.tsx
│   │   │   └── rh-dashboard.tsx
│   │   └── ui/                 # Composants UI (shadcn/ui)
│   │       ├── button.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       └── ...
│   │
│   ├── contexts/               # Contextes React
│   │   └── NotificationsContext.tsx
│   │
│   ├── hooks/                  # Hooks personnalisés
│   │   ├── useNotifications.ts
│   │   └── useRole.ts
│   │
│   ├── lib/                    # Utilitaires et configurations
│   │   ├── api.ts              # Configuration Axios
│   │   ├── roles.ts            # Définitions des rôles
│   │   └── utils.ts            # Fonctions utilitaires
│   │
│   ├── middleware.ts           # Middleware Next.js (auth)
│   ├── types/                  # Types TypeScript
│   └── globals.css             # Styles globaux
│
├── public/                     # Fichiers statiques
├── .github/workflows/          # GitHub Actions (CI/CD)
├── next.config.ts              # Configuration Next.js
├── tailwind.config.ts          # Configuration Tailwind CSS
├── tsconfig.json               # Configuration TypeScript
└── package.json                # Dépendances
```

### Patterns architecturaux

1. **Server Components / Client Components**
   - **Server Components** : Pour les pages nécessitant SSR (offres d'emploi)
   - **Client Components** : Pour les interactions utilisateur (formulaires, notifications)

2. **Custom Hooks**
   - `useRole()` : Gestion des rôles et permissions
   - `useNotifications()` : Gestion des notifications temps réel

3. **Context API**
   - `NotificationsContext` : État global des notifications

4. **Guards et Middleware**
   - `AuthGuard` : Protection des routes authentifiées
   - `RoleGuard` : Protection basée sur les rôles
   - `middleware.ts` : Vérification JWT au niveau Next.js

5. **API Client**
   - Configuration centralisée avec Axios
   - Intercepteurs pour l'authentification JWT

## 📦 Prérequis

- **Node.js** : version 20.x ou supérieure
- **npm** : version 10.x ou supérieure
- **Backend API** : Le backend NestJS doit être démarré et accessible

## 🚀 Installation

### 1. Cloner le dépôt

```bash
git clone "https://github.com/Safaa-Ettalhi/Frontend-GED-RH.git"
cd frontend
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration de l'environnement

Créer un fichier `.env.local` à la racine du dossier `frontend` :

```env
# URL de l'API backend
NEXT_PUBLIC_API_URL=http://localhost:4000

# URL WebSocket (optionnel, utilise NEXT_PUBLIC_API_URL par défaut)
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

### 4. Lancer l'application en développement

```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuration

### Variables d'environnement

| Variable | Description | Valeur par défaut |
|----------|------------|-------------------|
| `NEXT_PUBLIC_API_URL` | URL de l'API backend | `http://localhost:3000` |
| `NEXT_PUBLIC_WS_URL` | URL WebSocket (optionnel) | Dérivé de `NEXT_PUBLIC_API_URL` |

### Configuration Next.js

Le fichier `next.config.ts` contient la configuration Next.js. Les principales options :

- **React Strict Mode** : Activé pour détecter les problèmes potentiels
- **TypeScript** : Configuration stricte activée
- **Images** : Configuration pour l'optimisation des images

### Configuration TypeScript

Le fichier `tsconfig.json` définit :
- **Strict mode** : Activé pour une meilleure sécurité des types
- **Paths aliases** : `@/*` pointe vers `src/*`
- **Target** : ES2020

## 📜 Scripts disponibles

```bash
# Développement
npm run dev          # Lance le serveur de développement

# Production
npm run build        # Compile l'application pour la production
npm start            # Lance le serveur de production

# Qualité du code
npm run lint         # Exécute ESLint pour vérifier le code
```

## 🎨 Structure du projet

### App Router (Next.js 16)

L'application utilise le nouveau système de routage de Next.js basé sur les dossiers :

- **Routes publiques** : `/login`, `/register`
- **Routes protégées** : `/dashboard/*` (nécessitent authentification)
- **Routes par rôle** : Accès conditionnel selon les permissions

### Composants

#### Composants d'authentification
- `AuthGuard` : Vérifie l'authentification avant d'afficher les routes
- `RoleGuard` : Vérifie les permissions selon le rôle
- `LoginForm` : Formulaire de connexion avec validation Zod
- `RegisterForm` : Formulaire d'inscription

#### Composants de tableau de bord
- `AdminDashboard` : Vue administrateur avec statistiques complètes
- `RHDashboard` : Vue RH avec métriques RH
- `ManagerDashboard` : Vue manager avec candidats assignés
- `CandidateDashboard` : Vue candidat avec candidatures

#### Composants UI (shadcn/ui)
Composants réutilisables basés sur Radix UI :
- `Button`, `Input`, `Dialog`, `Select`, `Textarea`, etc.

### Hooks personnalisés

#### `useRole()`
Gère les informations utilisateur, rôle et permissions.

```typescript
const { user, role, organizationId, permissions, hasPermission } = useRole()
```

#### `useNotifications()`
Gère les notifications temps réel via WebSocket.

```typescript
const { notifications, isConnected } = useNotifications({
  organizationId,
  onNewNotification: (notification) => { /* ... */ }
})
```

### Contextes

#### `NotificationsContext`
Fournit l'état global des notifications à toute l'application.

## ✨ Fonctionnalités principales

### 1. Authentification et gestion des comptes

- ✅ Interface de connexion sécurisée avec validation
- ✅ Gestion des rôles : Admin, RH, Manager, Candidat
- ✅ Accès restreint aux fonctionnalités selon les permissions
- ✅ Support multi-organisation avec isolation des données

### 2. Tableau de bord RH

- ✅ Statistiques en temps réel (candidatures, entretiens, documents)
- ✅ Vue personnalisée selon le rôle
- ✅ Accès rapide aux actions principales
- ✅ Notifications récentes

### 3. Gestion documentaire intelligente

- ✅ Upload de documents (drag & drop)
- ✅ Visualisation et téléchargement
- ✅ Indication du statut OCR (en cours / terminé)
- ✅ Affichage des compétences extraites
- ✅ Recherche et filtrage avancés

### 4. Formulaires RH dynamiques

- ✅ **SSR pour les offres d'emploi** (SEO optimisé)
- ✅ Interface de création de formulaires personnalisés
- ✅ Types de champs : texte, nombre, email, fichier
- ✅ Association aux processus RH (recrutement, onboarding, évaluation)
- ✅ Prévisualisation des formulaires
- ✅ Soumission par les candidats

### 5. Gestion des candidats

- ✅ Création et édition de candidats
- ✅ Suivi des états (Nouveau, Présélectionné, Entretien, etc.)
- ✅ Historique des changements d'état
- ✅ Gestion des documents associés
- ✅ Évaluations des managers

### 6. Planification d'entretiens

- ✅ Création et modification d'entretiens
- ✅ Synchronisation avec Google Calendar
- ✅ Invitation automatique des participants
- ✅ Vue calendrier et liste

### 7. Notifications temps réel

- ✅ Notifications WebSocket en temps réel
- ✅ Types : nouvelle candidature, changement d'état, entretien, etc.
- ✅ Marquer comme lu/non lu
- ✅ Filtrage et recherche

## 🛠️ Technologies utilisées

### Framework principal
- **Next.js 16.1.1** : Framework React avec SSR, App Router, optimisations

### Bibliothèques UI
- **React 19.2.3** : Bibliothèque UI
- **Tailwind CSS 4** : Framework CSS utilitaire
- **shadcn/ui** : Composants UI basés sur Radix UI
- **Lucide React** : Icônes
- **Framer Motion** : Animations

### Gestion d'état et données
- **Axios 1.13.2** : Client HTTP
- **React Hook Form 7.70.0** : Gestion de formulaires
- **Zod 4.3.5** : Validation de schémas
- **Socket.io Client 4.8.3** : WebSocket pour notifications temps réel

### Utilitaires
- **date-fns 4.1.0** : Manipulation de dates
- **js-cookie 3.0.5** : Gestion des cookies
- **sonner 2.0.7** : Notifications toast

### Développement
- **TypeScript 5** : Typage statique
- **ESLint** : Linter
- **Tailwind CSS** : Styles

Pour plus de détails sur les dépendances, voir [DEPENDENCIES.md](./docs/DEPENDENCIES.md).

## 🔄 CI/CD

### GitHub Actions

Le workflow CI/CD est configuré dans `.github/workflows/ci.yml` :

1. **Lint** : Vérification du code avec ESLint
2. **Build** : Compilation de l'application Next.js
3. **Vérification** : Validation des artefacts de build

Le workflow se déclenche automatiquement sur :
- Push vers `main` ou `develop`
- Pull requests vers `main` ou `develop`

## 🚢 Déploiement

### Build de production

```bash
npm run build
```

Cela génère :
- Un dossier `.next/` avec l'application optimisée
- Des pages statiques pré-rendues (quand possible)
- Des Server Components optimisés

### Démarrage en production

```bash
npm start
```

### Déploiement sur Vercel (recommandé)

1. Connecter le dépôt GitHub à Vercel
2. Configurer les variables d'environnement
3. Déployer automatiquement

### Variables d'environnement en production

Assurez-vous de configurer :
- `NEXT_PUBLIC_API_URL` : URL de l'API backend en production
- `NEXT_PUBLIC_WS_URL` : URL WebSocket en production (si différente)

## 📚 Documentation supplémentaire

- [DEPENDENCIES.md](./docs/DEPENDENCIES.md) : Détails complets sur toutes les dépendances
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) : Architecture détaillée de l'application

## 🤝 Contribution

1. Créer une branche depuis `develop`
2. Développer la fonctionnalité
3. Vérifier avec `npm run lint`
4. Créer une pull request

## 📝 Licence

Ce projet est propriétaire.

---

**Développé avec ❤️ par Safaa Ettalhi**
