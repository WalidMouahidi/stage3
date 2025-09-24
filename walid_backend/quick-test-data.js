// Script rapide pour ajouter des données de test
const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8090';
admin.initializeApp({ projectId: 'walid-backend' });

const db = admin.firestore();

async function addTestData() {
  try {
    // Ajout de logs de test
    await db.collection('logs').add({
      id: 'log1',
      action: 'USER_LOGIN',
      user_id: 'user123',
      details: 'Connexion réussie',
      timestamp: new Date(),
      created_at: new Date()
    });

    // Ajout d'alertes de test
    await db.collection('alerts').add({
      id: 'alert1',
      message: 'Alerte de test',
      type: 'warning',
      priorite: 'haute',
      user_id: 'user123',
      created_at: new Date(),
      timestamp: new Date()
    });

    // Ajout de stats de test
    await db.collection('analytics_daily').add({
      date: new Date().toISOString().split('T')[0],
      total_requests: 150,
      successful_requests: 145,
      failed_requests: 5,
      total_users: 25,
      new_users: 3,
      created_at: new Date()
    });

    console.log('✅ Données de test ajoutées !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

addTestData();
