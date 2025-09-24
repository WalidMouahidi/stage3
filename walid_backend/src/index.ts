import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';

// Initialise Firebase Admin if not already initialised
if (!admin.apps.length) {
  admin.initializeApp();
}

// Import handlers and middleware
import { authMiddleware, createLogHandler, listLogsHandler, onRequestStatusChange } from './logs';
import { requireAdmin, getStatsHandler, onDocumentCreated, onRequestWriteForAnalytics } from './stats';
import { scheduledAlertCheck, getAlertsHandler } from './alerts';

// Set up Express app
const app = express();

// Add CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json());
// app.use(authMiddleware); // Désactivé temporairement pour les tests

// Route de test
app.get('/test', (req, res) => {
  res.json({ 
    message: 'API fonctionne!', 
    timestamp: new Date().toISOString(),
    endpoints: ['/test', '/admin/stats', '/admin/logs', '/admin/alerts', '/logs'],
    status: 'ok'
  });
});

// Route de test simple pour stats
app.get('/admin/stats-simple', (req, res) => {
  res.json({
    success: true,
    totals: {
      uploadedDocuments: 0,
      generatedDocuments: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0
    },
    trends: [],
    message: 'Statistiques par défaut (test)'
  });
});

// Route de test simple pour logs
app.get('/admin/logs-simple', (req, res) => {
  res.json({
    success: true,
    data: [],
    count: 0,
    message: 'Aucun log trouvé (test)'
  });
});

// Route de test simple pour alerts
app.get('/admin/alerts-simple', (req, res) => {
  res.json({
    success: true,
    data: [],
    count: 0,
    message: 'Aucune alerte trouvée (test)'
  });
});

// Route: POST /logs - record manual log entries (sans auth pour test)
app.post('/logs', createLogHandler);

// Route: GET /admin/logs - list log entries (sans auth pour test)
app.get('/admin/logs', listLogsHandler);

// Route: GET /admin/stats - return aggregated stats (sans auth pour test) 
app.get('/admin/stats', getStatsHandler);

// Route: GET /admin/alerts - list alert documents (sans auth pour test)
app.get('/admin/alerts', getAlertsHandler);

// Export Express app as HTTPS function
export const api = functions.https.onRequest(app);

// Export triggers so they are deployed
export const logRequestStatusChange = onRequestStatusChange;
export const documentAnalytics = onDocumentCreated;
export const requestAnalytics = onRequestWriteForAnalytics;
export const alertChecker = scheduledAlertCheck;
