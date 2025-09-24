const admin = require('firebase-admin');

console.log('🚀 Démarrage du script de test...');

// Configuration pour l'émulateur
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.GCLOUD_PROJECT = 'walid-backend';

console.log('🔧 Configuration émulateur:', process.env.FIRESTORE_EMULATOR_HOST);

try {
  admin.initializeApp({
    projectId: 'walid-backend'
  });
  console.log('✅ Firebase Admin initialisé');
  
  const db = admin.firestore();
  
  // Test simple
  db.collection('test').doc('test1').set({
    message: 'Hello from test script',
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    console.log('✅ Document de test créé avec succès');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Erreur lors de la création du document de test:', error);
    process.exit(1);
  });
  
} catch (error) {
  console.error('❌ Erreur lors de l\'initialisation:', error);
  process.exit(1);
}
