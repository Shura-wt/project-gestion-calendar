# Application de Gestion des Chantiers

Application de gestion d'affectation d'employés sur des chantiers de construction avec authentification Supabase et interface responsive.

## Fonctionnalités

- **Authentification sécurisée** avec Supabase et Row Level Security (RLS)
- **Gestion des utilisateurs** : Création, modification, suppression d'employés
- **Gestion des projets** : Organisation des chantiers avec statuts et géolocalisation
- **Calendrier de planification** : Affectation drag & drop avec vues jour/semaine/mois
- **Interface responsive** : Mobile-first avec burger menu
- **Rôles hiérarchiques** : ADMIN > SUPERVISEUR > OUVRIER
- **Navigation GPS** : Intégration Google Maps et Waze

## Variables d'environnement

Les variables d'environnement sont automatiquement configurées via l'intégration Vercel/Supabase.

Pour un développement local :
1. Copiez `.env.example` vers `.env.local`
2. Remplissez les valeurs depuis votre projet Supabase
3. Exécutez les scripts SQL dans l'ordre (001 à 007)

## Structure de la base de données

- **users** : Employés avec rôles et statuts
- **projects** : Chantiers avec géolocalisation et statuts
- **assignments** : Affectations employé-projet par date

## Déploiement

1. Connectez l'intégration Supabase dans les paramètres du projet
2. Exécutez les scripts SQL de configuration
3. Déployez sur Vercel

## Scripts SQL

Exécutez dans l'ordre :
1. `001_create_tables.sql` - Création des tables
2. `002_create_rls_policies.sql` - Politiques de sécurité
3. `003_create_functions_triggers.sql` - Fonctions et triggers
4. `004_seed_data.sql` - Données de test
5. `005_additional_rls_policies.sql` - Politiques supplémentaires
6. `006_fix_rls_policies.sql` - Correction récursion RLS
7. `007_fix_assignments_constraint.sql` - Contraintes d'affectation
