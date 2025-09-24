const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

// Middleware CORS pour toutes les origines
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Données de test
const testData = {
  logs: [
    {
      id: '1',
      action: 'USER_LOGIN',
      user_id: 'user123',
      details: 'Connexion réussie',
      timestamp: new Date().toISOString()
    },
    {
      id: '2',
      action: 'DOCUMENT_CREATED',
      user_id: 'user456',
      details: 'Document créé avec succès',
      timestamp: new Date().toISOString()
    }
  ],
  stats: {
    totalUsers: 245,
    activeUsers: 89,
    documentsCreated: 1234,
    requestsToday: 567,
    successRate: 98.5,
    systemUptime: '99.9%'
  },
  alerts: [
    {
      id: '1',
      message: 'Système de sauvegarde terminé avec succès',
      type: 'success',
      priorite: 'normale',
      user_id: 'system',
      timestamp: new Date().toISOString()
    },
    {
      id: '2',
      message: 'Attention: Espace disque faible sur serveur principal',
      type: 'warning',
      priorite: 'haute',
      user_id: 'system',
      timestamp: new Date().toISOString()
    }
  ]
};

// Routes de test
app.get('/api/test', (req, res) => {
  res.json({ 
    message: '✅ API Backend fonctionne parfaitement!', 
    timestamp: new Date().toISOString(),
    status: 'success'
  });
});

app.get('/api/admin/logs', (req, res) => {
  res.json({
    success: true,
    data: testData.logs,
    count: testData.logs.length
  });
});

app.get('/api/admin/stats', (req, res) => {
  res.json({
    success: true,
    data: testData.stats,
    generatedAt: new Date().toISOString()
  });
});

app.get('/api/admin/alerts', (req, res) => {
  res.json({
    success: true,
    data: testData.alerts,
    count: testData.alerts.length
  });
});

app.post('/api/logs', (req, res) => {
  const newLog = {
    id: (testData.logs.length + 1).toString(),
    ...req.body,
    timestamp: new Date().toISOString()
  };
  testData.logs.push(newLog);
  res.json({ success: true, data: newLog });
});

// Démarrage du serveur
app.listen(port, () => {
  console.log('🚀 Serveur de test démarré sur http://localhost:' + port);
  console.log('📊 Endpoints disponibles:');
  console.log('  - GET  /api/test');
  console.log('  - GET  /api/admin/logs');
  console.log('  - GET  /api/admin/stats');
  console.log('  - GET  /api/admin/alerts');
  console.log('  - POST /api/logs');
});
