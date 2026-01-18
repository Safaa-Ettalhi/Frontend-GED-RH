# Architecture Frontend - GEDPro

Documentation détaillée de l'architecture de l'application frontend GEDPro.

## 🏗️ Vue d'ensemble

L'application frontend GEDPro est construite avec **Next.js 16** utilisant l'**App Router**, combinant Server-Side Rendering (SSR) et Client-Side Rendering (CSR) pour une expérience optimale.

## 📐 Architecture générale

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                       │
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │ Server Components │         │ Client Components │        │
│  │ (SSR)             │         │ (CSR)             │        │
│  │                   │         │                   │        │
│  │ - Offres d'emploi │         │ - Formulaires     │        │
│  │ - Métadonnées SEO │         │ - Interactions    │        │
│  │ - Données initial │         │ - Notifications   │        │
│  └──────────────────┘         └──────────────────┘         │
│           │                              │                   │
│           └──────────┬───────────────────┘                   │
│                      │                                       │
│              ┌───────▼────────┐                              │
│              │  Shared Layer  │                              │
│              │  - Hooks       │                              │
│              │  - Contexts    │                              │
│              │  - Utils       │                              │
│              └───────┬────────┘                              │
└──────────────────────┼───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API (NestJS)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  REST API    │  │  WebSocket   │  │  Auth JWT    │       │
│  │  (Axios)     │  │ (Socket.io)  │  │ (Middleware) │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## 🗂️ Structure détaillée

### 1. App Router (Next.js 16)

#### Routes publiques (`/app/(auth)/`)
```
(auth)/
├── login/
│   └── page.tsx          # Page de connexion
├── register/
│   └── page.tsx          # Page d'inscription
└── layout.tsx            # Layout d'authentification
```

#### Routes protégées (`/app/dashboard/`)
```
dashboard/
├── page.tsx              # Tableau de bord (routage par rôle)
├── layout.tsx            # Layout avec navigation
│
├── applications/         # Candidatures (candidats)
│   └── page.tsx
│
├── calendar/            # Calendrier des entretiens
│   └── page.tsx
│
├── candidates/          # Gestion des candidats
│   └── page.tsx
│
├── documents/           # Gestion documentaire
│   └── page.tsx
│
├── forms/               # Formulaires RH
│   └── page.tsx
│
├── job-offers/          # Offres d'emploi (admin/RH)
│   └── page.tsx
│
├── offres/              # Offres publiques (SSR)
│   ├── page.tsx         # Server Component (SSR)
│   └── job-offers-client.tsx  # Client Component
│
├── notifications/       # Notifications
│   └── page.tsx
│
├── organizations/      # Organisations (admin)
│   └── page.tsx
│
├── profile/            # Profil utilisateur
│   └── page.tsx
│
└── users/              # Gestion utilisateurs
    └── page.tsx
```

### 2. Composants (`/src/components/`)

#### Structure hiérarchique
```
components/
├── auth/                 # Composants d'authentification
│   ├── auth-guard.tsx    # Protection des routes
│   ├── login-form.tsx    # Formulaire de connexion
│   ├── logout-button.tsx # Bouton de déconnexion
│   ├── register-form.tsx # Formulaire d'inscription
│   └── role-guard.tsx    # Protection par rôle
│
├── dashboard/            # Composants de tableau de bord
│   ├── admin-dashboard.tsx
│   ├── candidate-dashboard.tsx
│   ├── manager-dashboard.tsx
│   └── rh-dashboard.tsx
│
├── ui/                   # Composants UI réutilisables (shadcn/ui)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── select.tsx
│   ├── separator.tsx
│   ├── sonner.tsx
│   └── textarea.tsx
│
└── logo.tsx              # Composant logo
```

### 3. Hooks personnalisés (`/src/hooks/`)

#### `useRole.ts`
Gère les informations utilisateur, rôle et permissions.

**Fonctionnalités** :
- Récupération des informations utilisateur
- Gestion du rôle et de l'organisation
- Calcul des permissions
- Méthodes utilitaires (`isAdmin`, `isRH`, `hasPermission`)

**API** :
```typescript
const {
  user,              // Informations utilisateur
  role,              // Rôle actuel
  organizationId,    // ID de l'organisation
  permissions,       // Permissions du rôle
  hasPermission,     // Fonction de vérification
  isAdmin,          // Helpers de rôle
  isRH,
  isManager,
  isCandidate,
  refreshUser       // Rafraîchir les données
} = useRole()
```

#### `useNotifications.ts`
Gère les notifications temps réel via WebSocket.

**Fonctionnalités** :
- Connexion WebSocket automatique
- Réception des notifications en temps réel
- Gestion de la reconnexion
- Callback pour nouvelles notifications

**API** :
```typescript
const {
  notifications,     // Liste des notifications
  isConnected,      // État de la connexion
  markAsRead,       // Marquer comme lu
  markAllAsRead     // Tout marquer comme lu
} = useNotifications({
  organizationId,
  onNewNotification: (notification) => { /* ... */ },
  enabled: true
})
```

### 4. Contextes (`/src/contexts/`)

#### `NotificationsContext.tsx`
Fournit l'état global des notifications.

**Fonctionnalités** :
- Compteur de notifications non lues
- État partagé entre composants
- Provider avec WebSocket intégré

**Utilisation** :
```typescript
const { unreadCount } = useNotificationsContext()
```

### 5. Utilitaires (`/src/lib/`)

#### `api.ts`
Configuration centralisée d'Axios.

**Fonctionnalités** :
- Configuration de base URL
- Intercepteur pour JWT (Bearer token)
- Gestion centralisée des erreurs

#### `roles.ts`
Définitions des rôles et permissions.

**Contenu** :
- Enum `UserRole` (ADMIN, RH, MANAGER, CANDIDATE)
- Objet `ROLE_PERMISSIONS` avec permissions par rôle
- Fonction `hasPermission()` pour vérifier les permissions

#### `utils.ts`
Fonctions utilitaires (cn pour classNames, etc.)

### 6. Middleware (`/src/middleware.ts`)

**Fonctionnalités** :
- Protection des routes `/dashboard/*`
- Redirection automatique si non authentifié
- Vérification du token JWT dans les cookies
- Redirection des utilisateurs authentifiés depuis `/login`

## 🔄 Flux de données

### Authentification

```
1. Utilisateur → LoginForm
2. LoginForm → API POST /auth/login
3. API → JWT Token
4. Token → localStorage + Cookies
5. Middleware → Vérification token
6. useRole → Récupération user info
7. RoleGuard → Vérification permissions
8. Accès accordé → Affichage page
```

### Notifications temps réel

```
1. NotificationsProvider → Connexion WebSocket
2. WebSocket → Événements backend
3. useNotifications → Réception notifications
4. NotificationsContext → Mise à jour état global
5. Composants → Affichage notifications
```

### SSR pour les offres d'emploi

```
1. Requête → /dashboard/offres
2. Next.js → Appelle fetchJobOffers() (Server Component)
3. Server Component → Fetch API backend
4. Données → Passées à JobOffersClient (Client Component)
5. Client Component → Interactions utilisateur
```

## 🛡️ Sécurité

### Protection des routes

1. **Middleware Next.js** : Vérifie le token JWT avant d'accéder à `/dashboard/*`
2. **AuthGuard** : Composant qui vérifie l'authentification côté client
3. **RoleGuard** : Composant qui vérifie les permissions selon le rôle

### Gestion des tokens

- **Stockage** : localStorage + Cookies (pour SSR)
- **Envoi** : Intercepteur Axios ajoute automatiquement le header `Authorization: Bearer <token>`
- **Expiration** : Gérée par le backend, redirection vers login si token invalide

## 🎨 Styling

### Tailwind CSS

- **Configuration** : `tailwind.config.ts`
- **Approche** : Utility-first CSS
- **Thème** : Personnalisé avec couleurs GEDPro (rouge/rose)

### Composants UI

- **Base** : Radix UI (accessibilité)
- **Style** : Tailwind CSS
- **Système** : shadcn/ui (composants pré-construits)

## 📱 Responsive Design

- **Mobile First** : Design optimisé pour mobile
- **Breakpoints** : sm, md, lg, xl (Tailwind)
- **Navigation** : Menu hamburger sur mobile
- **Layouts** : Flexbox et Grid pour l'adaptabilité

## ⚡ Optimisations

### Performance

1. **Code Splitting** : Automatique avec Next.js
2. **Image Optimization** : Next.js Image component
3. **Tree Shaking** : Suppression du code non utilisé
4. **Lazy Loading** : Composants chargés à la demande
5. **Memoization** : useMemo et useCallback pour éviter les re-renders

### SEO

1. **SSR** : Pour les offres d'emploi (indexation)
2. **Metadata** : Défini dans chaque page
3. **Semantic HTML** : Utilisation correcte des balises

## 🔧 Patterns utilisés

### 1. Server Components / Client Components

- **Server Components** : Par défaut, pour le rendu serveur
- **Client Components** : Avec `"use client"` pour les interactions

### 2. Custom Hooks

- Encapsulation de la logique réutilisable
- Séparation des préoccupations

### 3. Context API

- État global pour les notifications
- Évite le prop drilling

### 4. Composition

- Composants composables (Radix UI)
- Props children pour la flexibilité

### 5. Error Boundaries

- Gestion des erreurs React (à implémenter si nécessaire)

## 🧪 Tests (à implémenter)

### Recommandations

1. **Unit Tests** : Jest + React Testing Library
2. **Integration Tests** : Tests des flux utilisateur
3. **E2E Tests** : Playwright ou Cypress

## 📊 Métriques et monitoring

### À implémenter

1. **Analytics** : Google Analytics ou alternative
2. **Error Tracking** : Sentry ou similaire
3. **Performance Monitoring** : Web Vitals

## 🚀 Déploiement

### Build

```bash
npm run build
```

Génère :
- `.next/` : Application optimisée
- Pages statiques pré-rendues
- Server Components optimisés

### Environnements

- **Development** : `npm run dev`
- **Production** : `npm start` (après build)
- **Staging** : Déploiement sur Vercel preview

## 🔄 Évolutions futures

1. **PWA** : Support Progressive Web App
2. **Offline Mode** : Service Workers
3. **Internationalization** : Support multi-langues
4. **Dark Mode** : Thème sombre (déjà préparé avec next-themes)
5. **Tests** : Suite de tests complète

---

**Dernière mise à jour** : Janvier 2026
