// Script simple pour tester l'ajout de données via les APIs
async function testAPIs() {
  const baseURL = 'http://127.0.0.1:5002/walid-backend/us-central1/api';
  
  console.log('🚀 Test des APIs du backend...\n');

  // Test 1: Obtenir les stats
  try {
    console.log('📊 Test des statistiques...');
    const statsResponse = await fetch(`${baseURL}/admin/stats`);
    const stats = await statsResponse.json();
    console.log('   Status:', statsResponse.status);
    console.log('   Stats:', stats);
    console.log('   ✅ Stats OK\n');
  } catch (error) {
    console.log('   ❌ Erreur stats:', error.message, '\n');
  }

  // Test 2: Obtenir les logs
  try {
    console.log('📝 Test des logs...');
    const logsResponse = await fetch(`${baseURL}/admin/logs`);
    const logs = await logsResponse.json();
    console.log('   Status:', logsResponse.status);
    console.log('   Logs:', logs);
    console.log('   ✅ Logs OK\n');
  } catch (error) {
    console.log('   ❌ Erreur logs:', error.message, '\n');
  }

  // Test 3: Obtenir les alertes
  try {
    console.log('🚨 Test des alertes...');
    const alertsResponse = await fetch(`${baseURL}/admin/alerts`);
    const alerts = await alertsResponse.json();
    console.log('   Status:', alertsResponse.status);
    console.log('   Alerts:', alerts);
    console.log('   ✅ Alerts OK\n');
  } catch (error) {
    console.log('   ❌ Erreur alerts:', error.message, '\n');
  }

  // Test 4: Créer un log
  try {
    console.log('➕ Test de création de log...');
    const createResponse = await fetch(`${baseURL}/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'TEST_ACTION',
        details: 'Test depuis le script de validation'
      })
    });
    const createResult = await createResponse.json();
    console.log('   Status:', createResponse.status);
    console.log('   Result:', createResult);
    console.log('   ✅ Création de log OK\n');
  } catch (error) {
    console.log('   ❌ Erreur création log:', error.message, '\n');
  }
}

testAPIs();
