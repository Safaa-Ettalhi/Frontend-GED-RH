# Dépendances Frontend - GEDPro

Documentation détaillée de toutes les bibliothèques et dépendances externes utilisées dans le projet frontend.

## 📦 Dépendances principales

### Framework et Core

#### **next** `16.1.1`
- **Rôle** : Framework React pour applications web avec Server-Side Rendering (SSR) et optimisations
- **Justification** : 
  - App Router moderne pour une meilleure performance
  - SSR natif pour les offres d'emploi (SEO)
  - Optimisations automatiques (images, fonts, code splitting)
  - Support TypeScript natif
- **Utilisation** : Framework principal de l'application

#### **react** `19.2.3`
- **Rôle** : Bibliothèque JavaScript pour construire des interfaces utilisateur
- **Justification** : Bibliothèque UI standard, compatible avec Next.js 16
- **Utilisation** : Création de tous les composants React

#### **react-dom** `19.2.3`
- **Rôle** : Rendu React dans le DOM
- **Justification** : Nécessaire pour le rendu côté client
- **Utilisation** : Rendu des composants dans le navigateur

### Styling et UI

#### **tailwindcss** `^4`
- **Rôle** : Framework CSS utilitaire
- **Justification** :
  - Développement rapide avec classes utilitaires
  - Purge automatique du CSS non utilisé
  - Design system cohérent
  - Responsive design facile
- **Utilisation** : Tous les styles de l'application

#### **@radix-ui/react-dialog** `^1.1.15`
- **Rôle** : Composant Dialog accessible (modales)
- **Justification** : 
  - Accessibilité (ARIA) intégrée
  - Composant de base pour shadcn/ui
  - Gestion du focus et du clavier
- **Utilisation** : Modales, dialogues de confirmation

#### **@radix-ui/react-dropdown-menu** `^2.1.16`
- **Rôle** : Menu déroulant accessible
- **Justification** : Accessibilité et UX améliorée
- **Utilisation** : Menus contextuels, navigation

#### **@radix-ui/react-label** `^2.1.8`
- **Rôle** : Composant Label accessible
- **Justification** : Accessibilité des formulaires
- **Utilisation** : Labels de formulaires

#### **@radix-ui/react-separator** `^1.1.8`
- **Rôle** : Séparateur visuel accessible
- **Justification** : Séparation de contenu avec accessibilité
- **Utilisation** : Séparateurs dans les layouts

#### **@radix-ui/react-slot** `^1.2.4`
- **Rôle** : Composition de composants
- **Justification** : Permet la composition flexible des composants
- **Utilisation** : Composants UI réutilisables

#### **lucide-react** `^0.562.0`
- **Rôle** : Bibliothèque d'icônes
- **Justification** :
  - Icônes modernes et cohérentes
  - Tree-shaking automatique
  - Support TypeScript
- **Utilisation** : Toutes les icônes de l'interface

#### **framer-motion** `^12.24.7`
- **Rôle** : Bibliothèque d'animations React
- **Justification** :
  - Animations fluides et performantes
  - API simple et déclarative
  - Optimisations automatiques
- **Utilisation** : Animations de transitions, hover effects

#### **class-variance-authority** `^0.7.1`
- **Rôle** : Gestion des variantes de classes CSS
- **Justification** : Création de variantes de composants (tailwind)
- **Utilisation** : Composants UI avec variantes (Button, etc.)

#### **clsx** `^2.1.1`
- **Rôle** : Utilitaire pour combiner des classes CSS
- **Justification** : Gestion conditionnelle des classes
- **Utilisation** : Classes conditionnelles dans les composants

#### **tailwind-merge** `^3.4.0`
- **Rôle** : Fusion intelligente des classes Tailwind
- **Justification** : Évite les conflits de classes Tailwind
- **Utilisation** : Utilitaires de style

### Gestion de formulaires et validation

#### **react-hook-form** `^7.70.0`
- **Rôle** : Gestion performante des formulaires React
- **Justification** :
  - Performance optimale (re-renders minimaux)
  - Validation intégrée
  - API simple et flexible
  - Support TypeScript
- **Utilisation** : Tous les formulaires de l'application

#### **@hookform/resolvers** `^5.2.2`
- **Rôle** : Résolveurs de validation pour react-hook-form
- **Justification** : Intégration avec Zod pour la validation
- **Utilisation** : Validation des formulaires avec Zod

#### **zod** `^4.3.5`
- **Rôle** : Bibliothèque de validation de schémas TypeScript-first
- **Justification** :
  - Validation côté client et serveur
  - Inférence de types automatique
  - Messages d'erreur personnalisables
  - Sécurité des types
- **Utilisation** : Validation de tous les formulaires

### Communication avec le backend

#### **axios** `^1.13.2`
- **Rôle** : Client HTTP pour les requêtes API
- **Justification** :
  - Intercepteurs pour JWT
  - Gestion d'erreurs centralisée
  - Support des requêtes async/await
  - Configuration centralisée
- **Utilisation** : Toutes les communications avec l'API backend

#### **socket.io-client** `^4.8.3`
- **Rôle** : Client WebSocket pour communications temps réel
- **Justification** :
  - Notifications en temps réel
  - Reconnexion automatique
  - Support des événements personnalisés
- **Utilisation** : Système de notifications temps réel

### Utilitaires

#### **date-fns** `^4.1.0`
- **Rôle** : Bibliothèque de manipulation de dates
- **Justification** :
  - Fonctions modulaires (tree-shaking)
  - Formatage de dates localisé
  - Calculs de dates (différences, etc.)
  - Support TypeScript
- **Utilisation** : Formatage des dates dans l'interface

#### **js-cookie** `^3.0.5`
- **Rôle** : Gestion simple des cookies
- **Justification** : Stockage du token JWT dans les cookies
- **Utilisation** : Authentification et session

#### **react-day-picker** `^9.13.0`
- **Rôle** : Sélecteur de dates accessible
- **Justification** : Sélection de dates dans les formulaires
- **Utilisation** : Calendrier des entretiens, sélection de dates

#### **next-themes** `^0.4.6`
- **Rôle** : Gestion des thèmes (dark/light mode)
- **Justification** : Support du mode sombre (préparé pour l'avenir)
- **Utilisation** : Système de thèmes (actuellement non utilisé mais préparé)

### Notifications

#### **sonner** `^2.0.7`
- **Rôle** : Bibliothèque de notifications toast
- **Justification** :
  - Notifications élégantes et accessibles
  - Support des actions (boutons)
  - Positionnement flexible
  - Animations fluides
- **Utilisation** : Toutes les notifications utilisateur (succès, erreur, info)

## 🔧 Dépendances de développement

### TypeScript

#### **typescript** `^5`
- **Rôle** : Superset typé de JavaScript
- **Justification** :
  - Sécurité des types
  - Meilleure expérience développeur (autocomplétion)
  - Détection d'erreurs à la compilation
  - Refactoring facilité
- **Utilisation** : Tout le code de l'application

#### **@types/node** `^20`
- **Rôle** : Types TypeScript pour Node.js
- **Justification** : Types pour les APIs Node.js utilisées
- **Utilisation** : Types globaux Node.js

#### **@types/react** `^19`
- **Rôle** : Types TypeScript pour React
- **Justification** : Types pour React 19
- **Utilisation** : Types des composants React

#### **@types/react-dom** `^19`
- **Rôle** : Types TypeScript pour react-dom
- **Justification** : Types pour react-dom 19
- **Utilisation** : Types du rendu React

#### **@types/js-cookie** `^3.0.6`
- **Rôle** : Types TypeScript pour js-cookie
- **Justification** : Types pour la bibliothèque js-cookie
- **Utilisation** : Types des cookies

### Linting et qualité du code

#### **eslint** `^9`
- **Rôle** : Linter JavaScript/TypeScript
- **Justification** : Détection des erreurs et mauvaises pratiques
- **Utilisation** : Vérification du code avant commit

#### **eslint-config-next** `16.1.1`
- **Rôle** : Configuration ESLint pour Next.js
- **Justification** : Règles optimisées pour Next.js
- **Utilisation** : Configuration du linter

### Build et outils

#### **@tailwindcss/postcss** `^4`
- **Rôle** : Plugin PostCSS pour Tailwind CSS
- **Justification** : Intégration Tailwind dans le pipeline de build
- **Utilisation** : Traitement CSS pendant le build

#### **tw-animate-css** `^1.4.0`
- **Rôle** : Animations CSS pour Tailwind
- **Justification** : Animations supplémentaires pour Tailwind
- **Utilisation** : Animations de l'interface

## 📊 Résumé des dépendances

### Par catégorie

| Catégorie | Nombre | Exemples |
|-----------|--------|----------|
| Framework | 3 | next, react, react-dom |
| UI/Styling | 10 | tailwindcss, radix-ui, lucide-react |
| Formulaires | 3 | react-hook-form, zod, @hookform/resolvers |
| Communication | 2 | axios, socket.io-client |
| Utilitaires | 5 | date-fns, js-cookie, sonner |
| DevDependencies | 7 | typescript, eslint, @types/* |

### Taille des bundles (estimations)

- **Framework (Next.js + React)** : ~150 KB (gzipped)
- **UI Components (Radix + Tailwind)** : ~50 KB (gzipped)
- **Formulaires (React Hook Form + Zod)** : ~30 KB (gzipped)
- **Communication (Axios + Socket.io)** : ~40 KB (gzipped)
- **Total estimé** : ~270 KB (gzipped) pour le bundle principal

> Note : Next.js optimise automatiquement le code splitting, donc seule la partie nécessaire est chargée par page.

## 🔄 Mises à jour et maintenance

### Politique de mise à jour

- **Mises à jour de sécurité** : Appliquées immédiatement
- **Mises à jour mineures** : Testées puis appliquées mensuellement
- **Mises à jour majeures** : Évaluées et planifiées trimestriellement

### Vérification des vulnérabilités

```bash
npm audit
```

### Mise à jour des dépendances

```bash
# Mises à jour mineures
npm update

# Mises à jour majeures (attention aux breaking changes)
npm install package@latest
```

## 📝 Notes importantes

1. **Compatibilité Next.js 16** : Toutes les dépendances sont compatibles avec Next.js 16.1.1
2. **React 19** : Utilisation de React 19.2.3 (dernière version stable)
3. **Tree-shaking** : La plupart des bibliothèques supportent le tree-shaking pour optimiser la taille du bundle
4. **TypeScript strict** : Toutes les dépendances ont des types TypeScript disponibles
5. **Accessibilité** : Les composants Radix UI sont accessibles par défaut (ARIA)

## 🔗 Ressources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com)
- [React Hook Form Documentation](https://react-hook-form.com)
- [Zod Documentation](https://zod.dev)


