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
app.use(express.json());
app.use(authMiddleware);

// Route: POST /logs - record manual log entries
app.post('/logs', createLogHandler);

// Route: GET /admin/logs - list log entries (admin only)
app.get('/admin/logs', requireAdmin, listLogsHandler);

// Route: GET /admin/stats - return aggregated stats (admin only)
app.get('/admin/stats', requireAdmin, getStatsHandler);

// Route: GET /admin/alerts - list alert documents (admin only)
app.get('/admin/alerts', requireAdmin, getAlertsHandler);

// Export Express app as HTTPS function
export const api = functions.https.onRequest(app);

// Export triggers so they are deployed
export const logRequestStatusChange = onRequestStatusChange;
export const documentAnalytics = onDocumentCreated;
export const requestAnalytics = onRequestWriteForAnalytics;
export const alertChecker = scheduledAlertCheck;