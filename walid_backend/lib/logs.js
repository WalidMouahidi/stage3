"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onRequestStatusChange = void 0;
exports.authMiddleware = authMiddleware;
exports.createLogHandler = createLogHandler;
exports.listLogsHandler = listLogsHandler;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
/**
 * Middleware to extract the current user from the Authorization header.
 * This helper verifies a Firebase ID token if provided and attaches the
 * decoded token to req.user. It does not enforce authentication – routes
 * should decide whether authentication is mandatory.
 */
async function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'] || '';
    const match = authHeader.toString().match(/^Bearer (.+)$/);
    if (!match) {
        return next();
    }
    const idToken = match[1];
    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        req.user = decoded;
    }
    catch (err) {
        // Ignore invalid tokens, continue without user
    }
    return next();
}
/**
 * Express handler for POST /logs. Records a log entry in Firestore. Accepts a JSON body
 * with at minimum an 'action' property. Additional metadata can be supplied. The
 * authenticated user ID (if available) and remote IP will be stored alongside the log.
 */
async function createLogHandler(req, res) {
    const { action, metadata } = req.body || {};
    if (!action || typeof action !== 'string') {
        return res.status(400).json({ error: 'action is required' });
    }
    const user = req.user;
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
    }
    catch (err) {
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
async function listLogsHandler(req, res) {
    const { userId, startDate, endDate } = req.query;
    let query = admin.firestore().collection('logs');
    if (userId && typeof userId === 'string') {
        query = query.where('userId', '==', userId);
    }
    if (startDate && typeof startDate === 'string') {
        query = query.where('timestamp', '>=', new Date(startDate));
    }
    if (endDate && typeof endDate === 'string') {
        query = query.where('timestamp', '<=', new Date(endDate));
    }
    query = query.orderBy('timestamp', 'desc');
    try {
        const snapshot = await query.get();
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.json(logs);
    }
    catch (err) {
        console.error('Error fetching logs', err);
        return res.status(500).json({ error: 'internal server error' });
    }
}
/**
 * Firestore trigger to automatically record logs when specific documents are created or updated.
 * This example listens to changes on the `requests` collection and records a log entry
 * whenever the status field changes. You can extend or duplicate this trigger for other
 * collections such as `documents` or `users`.
 */
exports.onRequestStatusChange = functions.firestore
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
    }
    catch (err) {
        console.error('Failed to write automatic log', err);
    }
    return null;
});
//# sourceMappingURL=logs.js.map