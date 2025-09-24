# 📁 Structure du Projet

Ce projet contient 2 dossiers principaux :

## 📂 `frontend/`
**Frontend fourni par les collègues**
- Framework : React 18
- Design : Interface utilisateur avec thème YNOV (#4ECDC4)
- Pages : Dashboard, Alertes, Demandes, Documents, etc.
- Configuration : Prêt à l'emploi avec routing et authentification

## 📂 `walid_backend/`
**Backend Firebase développé**
- Framework : Firebase Functions + TypeScript
- Base de données : Firestore
- Fonctionnalités principales :
  - 📝 **Journalisation** : Système de logs complet
  - 📊 **Statistiques** : Calculs et métriques automatiques
  - 🚨 **Alertes** : Système de notifications
  - 🔧 **Triggers** : Fonctions déclenchées par événements

## 🚀 Démarrage

### Backend (Terminal 1)
```bash
cd walid_backend
npm start
```
**Serveur sur :** http://127.0.0.1:5002

### Frontend (Terminal 2)
```bash
cd frontend
npm start
```
**Application sur :** http://localhost:3000

## 📋 Pages de test
- `/stats` - Statistiques avec backend intégré
- `/logs` - Journal des actions avec backend intégré  
- `/alertes` - Système d'alertes avec backend intégré
- `/test-walid-backend` - Page de test des endpoints backend

## ⚙️ Configuration
- Backend Firebase configuré sur port 5002
- Frontend React configuré sur port 3000
- API service centralisé dans `frontend/src/services/api.js`
- Base de données Firestore émulée localement

Le projet intègre le frontend fourni avec le backend développé pour créer une application complète de gestion administrative.
