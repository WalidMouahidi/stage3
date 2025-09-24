/**
 * Script pour alimenter la base de données de test avec des données
 * pour démontrer les fonctionnalités développées
 */

const admin = require('firebase-admin');

// Configuration pour l'émulateur
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8090';
process.env.GCLOUD_PROJECT = 'walid-backend';

console.log('🔧 Configuration émulateur Firestore :', process.env.FIRESTORE_EMULATOR_HOST);

admin.initializeApp({
  projectId: 'walid-backend'
});

const db = admin.firestore();

async function populateTestData() {
  console.log('🌱 Alimentation de la base de données de test...');

  try {
    // 1. Créer des documents de test
    const documents = [
      {
        id: 'doc1',
        name: 'Dossier-Admission-Emma.pdf',
        type: 'uploaded',
        studentId: 'emma-dupont',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        size: 2048000
      },
      {
        id: 'doc2', 
        name: 'Contrat-Stage-Leo.docx',
        type: 'generated',
        studentId: 'leo-martin',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        size: 1024000
      },
      {
        id: 'doc3',
        name: 'Attestation-Claire.pdf',
        type: 'uploaded',
        studentId: 'claire-bernard',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        size: 512000
      }
    ];

    for (const doc of documents) {
      await db.collection('documents').doc(doc.id).set(doc);
    }
    console.log(`✅ ${documents.length} documents créés`);

    // 2. Créer des demandes de test
    const requests = [
      {
        id: 'req1',
        studentId: 'emma-dupont',
        type: 'transcript',
        status: 'pending',
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)), // 8 jours
        description: 'Demande de relevé de notes'
      },
      {
        id: 'req2',
        studentId: 'leo-martin',
        type: 'certificate',
        status: 'approved',
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)), // 3 jours
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        description: 'Certificat de scolarité'
      },
      {
        id: 'req3',
        studentId: 'claire-bernard',
        type: 'diploma',
        status: 'rejected',
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)), // 5 jours
        rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
        rejectionReason: 'Documents manquants'
      },
      {
        id: 'req4',
        studentId: 'alex-durand',
        type: 'transcript',
        status: 'pending',
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)), // 12 jours (trigger alert)
        description: 'Demande urgente de relevé'
      }
    ];

    for (const req of requests) {
      await db.collection('requests').doc(req.id).set(req);
    }
    console.log(`✅ ${requests.length} demandes créées`);

    // 3. Créer des logs de test
    const logs = [
      {
        userId: 'admin-test',
        action: 'document_upload',
        metadata: { documentId: 'doc1', studentId: 'emma-dupont' },
        timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)), // 2h
        ip: '192.168.1.100'
      },
      {
        userId: 'admin-test',
        action: 'request_status_change:approved',
        metadata: { requestId: 'req2', previousStatus: 'pending', newStatus: 'approved' },
        timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 1 * 60 * 60 * 1000)), // 1h
        ip: '192.168.1.100'
      },
      {
        userId: 'student-emma',
        action: 'login',
        metadata: { userAgent: 'Chrome/119.0' },
        timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 30 * 60 * 1000)), // 30min
        ip: '192.168.1.200'
      }
    ];

    for (const log of logs) {
      await db.collection('logs').add(log);
    }
    console.log(`✅ ${logs.length} logs créés`);

    // 4. Créer des alertes de test
    const alerts = [
      {
        id: 'alert1',
        requestId: 'req1',
        message: 'La demande req1 est en attente depuis plus de 7 jours',
        status: 'pending',
        type: 'urgent',
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)), // 1 jour
      },
      {
        id: 'alert2',
        requestId: 'req4',
        message: 'La demande req4 est en attente depuis plus de 7 jours',
        status: 'pending',
        type: 'warning',
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 60 * 1000)), // 5h
      },
      {
        id: 'alert3',
        message: 'Espace disque faible sur le serveur de documents',
        status: 'resolved',
        type: 'info',
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), // 2 jours
      }
    ];

    for (const alert of alerts) {
      await db.collection('alerts').doc(alert.id).set(alert);
    }
    console.log(`✅ ${alerts.length} alertes créées`);

    // 5. Créer des données analytiques quotidiennes
    const today = new Date();
    const analyticsData = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().substring(0, 10);
      
      analyticsData.push({
        date: dateStr,
        uploads: Math.floor(Math.random() * 20) + 5,
        generations: Math.floor(Math.random() * 15) + 2,
        pending: Math.floor(Math.random() * 8) + 1,
        approved: Math.floor(Math.random() * 12) + 3,
        rejected: Math.floor(Math.random() * 3) + 1
      });
    }

    for (const data of analyticsData) {
      await db.collection('analytics_daily').doc(data.date).set(data);
    }
    console.log(`✅ ${analyticsData.length} entrées analytiques créées`);

    console.log('\n🎉 Base de données de test alimentée avec succès !');
    console.log('\n📊 Données créées :');
    console.log(`   - ${documents.length} documents`);
    console.log(`   - ${requests.length} demandes`);
    console.log(`   - ${logs.length} logs`);
    console.log(`   - ${alerts.length} alertes`);
    console.log(`   - ${analyticsData.length} jours de données analytiques`);
    console.log('\n🔗 Accédez à l\'application : http://localhost:3001');
    console.log('🔗 Interface Firebase : http://localhost:4000');

  } catch (error) {
    console.error('❌ Erreur lors de l\'alimentation :', error);
  }
}

// Exécuter le script
populateTestData().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Erreur fatale :', error);
  process.exit(1);
});
