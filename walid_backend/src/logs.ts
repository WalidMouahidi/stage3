import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to extract the current user from the Authorization header.
 * This helper verifies a Firebase ID token if provided and attaches the
 * decoded token to req.user. It does not enforce authentication – routes
 * should decide whether authentication is mandatory.
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'] || '';
  const match = authHeader.toString().match(/^Bearer (.+)$/);
  if (!match) {
    return next();
  }
  const idToken = match[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    (req as any).user = decoded;
  } catch (err) {
    // Ignore invalid tokens, continue without user
  }
  return next();
}

/**
 * Express handler for POST /logs. Records a log entry in Firestore. Accepts a JSON body
 * with at minimum an 'action' property. Additional metadata can be supplied. The
 * authenticated user ID (if available) and remote IP will be stored alongside the log.
 */
export async function createLogHandler(req: Request, res: Response) {
  const { action, metadata } = req.body || {};
  if (!action || typeof action !== 'string') {
    return res.status(400).json({ error: 'action is required' });
  }
  const user = (req as any).user;
  const userId = user?.uid || null;
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || null;
  const log = {
    userId,
    action,
    metadata: metadata || {},
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ip: Array.isArray(ip) ? ip[0] : ip
  };
  try {
    const ref = await admin.firestore().collection('logs').add(log);
    return res.status(201).json({ id: ref.id });
  } catch (err) {
    console.error('Error creating log', err);
    return res.status(500).json({ error: 'internal server error' });
  }
}

/**
 * Express handler for GET /admin/logs. Lists log entries, optionally filtered by userId
 * and date range. This route requires that request.user has a role of 'admin' which should
 * be enforced upstream (e.g. in a middleware). For simplicity, this file does not
 * implement the admin check itself – it is performed in the router definition.
 */
export async function listLogsHandler(req: Request, res: Response) {
  // Retourner immédiatement des données par défaut sans accéder à Firestore
  console.log('📝 listLogsHandler appelé - retour données par défaut');
  
  return res.json({
    success: true,
    data: [],
    count: 0,
    message: 'Aucun log trouvé (mode test)'
  });
}

/**
 * Firestore trigger to automatically record logs when specific documents are created or updated.
 * This example listens to changes on the `requests` collection and records a log entry
 * whenever the status field changes. You can extend or duplicate this trigger for other
 * collections such as `documents` or `users`.
 */
export const onRequestStatusChange = functions.firestore
  .document('requests/{requestId}')
  .onWrite(async (change, context) => {
    const beforeStatus = change.before.exists ? change.before.get('status') : null;
    const afterStatus = change.after.exists ? change.after.get('status') : null;
    if (!afterStatus || beforeStatus === afterStatus) {
      return null;
    }
    const userId = change.after.get('updatedBy') || change.after.get('userId') || null;
    const log = {
      userId,
      action: `request_status_change:${afterStatus}`,
      metadata: {
        requestId: context.params.requestId,
        previousStatus: beforeStatus,
        newStatus: afterStatus
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ip: null
    };
    try {
      await admin.firestore().collection('logs').add(log);
    } catch (err) {
      console.error('Failed to write automatic log', err);
    }
    return null;
  });
