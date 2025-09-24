// Test rapide de l'API
const testAPI = async () => {
  try {
    console.log('🔍 Test de l\'API backend...');
    
    // Test endpoint de base
    const testResponse = await fetch('http://127.0.0.1:5002/walid-backend/us-central1/api/test');
    console.log('✅ Test endpoint:', await testResponse.text());
    
    // Test logs
    const logsResponse = await fetch('http://127.0.0.1:5002/walid-backend/us-central1/api/admin/logs');
    console.log('📋 Logs:', await logsResponse.text());
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
};

testAPI();
