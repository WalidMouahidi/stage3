// Script pour ajouter des données de test dans Firestore
const admin = require('firebase-admin');

// Configuration pour les émulateurs
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8090';

// Initialisation avec le projet de test
admin.initializeApp({
  projectId: 'walid-backend',
});

const db = admin.firestore();

async function addTestData() {
  console.log('🔥 Ajout de données de test dans Firestore...\n');

  try {
    // Ajout de logs de test
    console.log('📝 Ajout de logs...');
    await db.collection('logs').add({
      action: 'USER_LOGIN',
      user_id: 'admin123',
      details: 'Connexion administrateur réussie',
      timestamp: admin.firestore.Timestamp.now(),
      created_at: admin.firestore.Timestamp.now()
    });

    await db.collection('logs').add({
      action: 'VIEW_STATS',
      user_id: 'admin123', 
      details: 'Consultation des statistiques',
      timestamp: admin.firestore.Timestamp.now(),
      created_at: admin.firestore.Timestamp.now()
    });

    await db.collection('logs').add({
      action: 'EXPORT_DATA',
      user_id: 'user456',
      details: 'Export des données utilisateur',
      timestamp: admin.firestore.Timestamp.now(),
      created_at: admin.firestore.Timestamp.now()
    });

    console.log('✅ Logs ajoutés !');

    // Ajout de statistiques journalières de test
    console.log('📊 Ajout de statistiques...');
    const today = new Date().toISOString().split('T')[0];
    await db.collection('analytics_daily').doc(today).set({
      date: today,
      total_logs: 15,
      total_users: 8,
      total_requests: 42,
      total_errors: 2,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    });

    console.log('✅ Statistiques ajoutées !');

    // Ajout d'alertes de test
    console.log('🚨 Ajout d\'alertes...');
    await db.collection('alerts').add({
      message: 'Nombre élevé de connexions suspectes détecté',
      type: 'warning',
      priorite: 'haute',
      user_id: 'system',
      timestamp: admin.firestore.Timestamp.now(),
      created_at: admin.firestore.Timestamp.now(),
      resolved: false
    });

    await db.collection('alerts').add({
      message: 'Mise à jour du système programmée pour ce soir',
      type: 'info',
      priorite: 'moyenne',
      user_id: 'admin123',
      timestamp: admin.firestore.Timestamp.now(),
      created_at: admin.firestore.Timestamp.now(),
      resolved: false
    });

    await db.collection('alerts').add({
      message: 'Espace de stockage faible (< 10%)',
      type: 'error',
      priorite: 'critique',
      user_id: 'system',
      timestamp: admin.firestore.Timestamp.now(),
      created_at: admin.firestore.Timestamp.now(),
      resolved: false
    });

    console.log('✅ Alertes ajoutées !');

    console.log('\n🎉 Toutes les données de test ont été ajoutées avec succès !');
    console.log('📍 Vous pouvez maintenant tester les pages Stats, Logs et Alertes.');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des données:', error);
  } finally {
    process.exit(0);
  }
}

addTestData();
