# Backend — Journalisation, Statistiques & Alertes

Ce module fournit l’implémentation des fonctionnalités de journalisation des actions sensibles,
de génération de statistiques globales pour le tableau de bord d’administration et d’alertes
automatiques sur les demandes en attente trop longtemps. Il repose sur Firebase
(Cloud Functions et Firestore) et expose une API REST accessible via Express.

## Structure du projet

```
walid_backend/
  ├─ src/                # Code TypeScript des fonctions Cloud et de l’API
  │   ├─ index.ts        # Point d’entrée principal qui assemble l’API et exporte les triggers
  │   ├─ logs.ts         # Gestionnaire pour enregistrer et lister les logs + trigger automatique
  │   ├─ stats.ts        # Gestionnaire des statistiques + triggers d’agrégation journalière
  │   └─ alerts.ts       # Tâche planifiée pour générer des alertes sur les demandes en attente
  ├─ firestore.rules     # Règles de sécurité Firestore pour les collections `logs`, `analytics_daily` et `alerts`
  ├─ firestore.indexes.json # Indexes recommandés pour optimiser les requêtes
  ├─ openapi.yml         # Spécification OpenAPI de l’API REST
  ├─ package.json        # Dépendances et scripts npm
  ├─ tsconfig.json       # Configuration du compilateur TypeScript
  └─ README.md           # Ce document
```

## Installation et exécution locale

Assurez‑vous d’avoir [Node.js 18+](https://nodejs.org/) et [Firebase CLI](https://firebase.google.com/docs/cli) installés.

```bash
# Installez les dépendances
cd walid_backend
npm install

# Lancez les émulateurs Firestore et Functions avec vos règles et indexes
firebase emulators:start --only functions,firestore
```

Les fonctions HTTP seront disponibles sur `http://localhost:5001/<project>/us-central1/api`.

## Déploiement

Déployez le module vers Firebase avec :

```bash
npm run deploy
```

Ce script compile d’abord le TypeScript (`npm run build`), puis déploie les fonctions,
les règles et les indexes Firestore.

## Endpoints

| Méthode | Chemin            | Description                                                       | Authentification |
|--------:|-------------------|------------------------------------------------------------------|-----------------|
| `POST`  | `/logs`           | Crée une entrée de log à partir d’une action de l’application.    | Utilisateur     |
| `GET`   | `/admin/logs`     | Récupère les logs (filtrables par utilisateur ou plage de dates).  | Admin           |
| `GET`   | `/admin/stats`    | Retourne les indicateurs globaux pour le dashboard administratif. | Admin           |

Les détails des schémas d’entrée et de sortie sont décrits dans le fichier
[openapi.yml](openapi.yml).

## Sécurité

Les règles Firestore limitent l’accès aux collections sensibles :

* Les logs (`logs`) et les statistiques (`analytics_daily`) ne sont lisibles que par les
  comptes dotés du rôle `admin` (claim custom dans Firebase Auth).
* Les logs peuvent être créés par n’importe quel utilisateur authentifié.
* Les alertes (`alerts`) sont écrites par une fonction système et lues seulement par les admins.

Pour attribuer le rôle `admin` à un utilisateur, utilisez les [custom claims](https://firebase.google.com/docs/auth/admin/custom-claims)
via l’Admin SDK :

```js
admin.auth().setCustomUserClaims(uid, { role: 'admin' });
```

## Statistiques

Des triggers Firestore agrègent les données quotidiennement dans la collection `analytics_daily` :

* Lorsqu’un document est créé dans `documents`, la clé `type` (`uploaded` ou `generated`) est utilisée pour
  incrémenter les compteurs `uploads` ou `generations` du jour correspondant.
* Lorsqu’une demande (`requests`) est créée ou que son statut change, le compteur `pending`,
  `approved` ou `rejected` est incrémenté dans le document d’agrégation du jour de la mise à jour.

Ces données permettent de constituer des séries temporelles à moindre coût pour l’API `/admin/stats`.

## Alertes

La fonction `scheduledAlertCheck` est déclenchée quotidiennement et recherche les demandes dont le statut
reste `pending` au‑delà d’un seuil configurable (variable d’environnement `ALERT_SLA_DAYS`, par défaut 7 jours).
Pour chaque demande concernée, une entrée est enregistrée dans la collection `alerts` avec un message
indiquant l’identifiant de la demande et la durée de dépassement.

## Tests

L’intégration est couverte par des tests Jest/Supertest (dossiers `tests/`), illustrant comment
simuler les appels et valider les réponses. Lancez les tests avec :

```bash
npm test
```

## Notes d’intégration Frontend

Pour consommer ces API depuis le frontend (React ou autre), utilisez vos hooks de fetch habituels :

* Les tableaux de bord se basent sur `/admin/stats` pour afficher les totaux et les graphiques.
* L’historique des actions utilise `/admin/logs` avec pagination et filtres.
* Les alertes sont exposées dans Firestore sous la collection `alerts` et peuvent déclencher
  des notifications visuelles ou par e‑mail selon vos besoins.