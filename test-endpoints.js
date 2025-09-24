// Script simple pour tester les endpoints du backend
const http = require('http');

function testEndpoint(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 5002,
      path: `/walid-backend/us-central1/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function runTests() {
  console.log('🔥 Test des endpoints Firebase Functions...\n');

  const endpoints = [
    '/admin/stats',
    '/admin/logs', 
    '/admin/alerts'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📞 Test de ${endpoint}...`);
      const result = await testEndpoint(endpoint);
      console.log(`   Status: ${result.status}`);
      console.log(`   Data: ${result.data.substring(0, 200)}${result.data.length > 200 ? '...' : ''}`);
      console.log('   ✅ OK\n');
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}\n`);
    }
  }
}

runTests();
