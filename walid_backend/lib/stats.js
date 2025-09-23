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
exports.onRequestWriteForAnalytics = exports.onDocumentCreated = void 0;
exports.requireAdmin = requireAdmin;
exports.getStatsHandler = getStatsHandler;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
/**
 * Middleware that verifies the user is authenticated and has an admin role. The role is
 * expected to be stored as a custom claim on the Firebase auth token. If the user is
 * not authenticated or does not have role 'admin', a 403 is returned.
 */
function requireAdmin(req, res, next) {
    const user = req.user;
    if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'forbidden' });
    }
    return next();
}
/**
 * Express handler for GET /admin/stats. Calculates totals and time series for the admin
 * dashboard. Totals are computed by querying the `documents` and `requests` collections
 * directly. The time series uses the `analytics_daily` collection built via triggers.
 */
async function getStatsHandler(req, res) {
    try {
        const db = admin.firestore();
        // Compute totals for documents
        const [uploadedSnap, generatedSnap] = await Promise.all([
            db.collection('documents').where('type', '==', 'uploaded').get(),
            db.collection('documents').where('type', '==', 'generated').get()
        ]);
        // Compute totals for requests by status
        const [pendingSnap, approvedSnap, rejectedSnap] = await Promise.all([
            db.collection('requests').where('status', '==', 'pending').get(),
            db.collection('requests').where('status', '==', 'approved').get(),
            db.collection('requests').where('status', '==', 'rejected').get()
        ]);
        const totals = {
            uploadedDocuments: uploadedSnap.size,
            generatedDocuments: generatedSnap.size,
            pendingRequests: pendingSnap.size,
            approvedRequests: approvedSnap.size,
            rejectedRequests: rejectedSnap.size
        };
        // Build time series for the last 30 days using analytics_daily
        const today = new Date();
        const start = new Date(today.getTime());
        start.setUTCDate(start.getUTCDate() - 29);
        start.setUTCHours(0, 0, 0, 0);
        const startStr = start.toISOString().substring(0, 10);
        const seriesSnap = await db
            .collection('analytics_daily')
            .where('date', '>=', startStr)
            .orderBy('date', 'asc')
            .get();
        const trends = seriesSnap.docs.map(doc => doc.data());
        return res.json({ totals, trends });
    }
    catch (err) {
        console.error('Error computing stats', err);
        return res.status(500).json({ error: 'internal server error' });
    }
}
/**
 * Firestore trigger to update analytics when a document is created. It increments
 * the appropriate counters (uploads or generations) for the day of creation.
 */
exports.onDocumentCreated = functions.firestore
    .document('documents/{docId}')
    .onCreate(async (snapshot) => {
    const data = snapshot.data() || {};
    const type = data.type;
    if (type !== 'uploaded' && type !== 'generated') {
        return null;
    }
    const date = snapshot.createTime.toDate();
    const dateStr = date.toISOString().substring(0, 10);
    const ref = admin.firestore().collection('analytics_daily').doc(dateStr);
    const incrementUpload = type === 'uploaded' ? 1 : 0;
    const incrementGen = type === 'generated' ? 1 : 0;
    await ref.set({
        date: dateStr,
        uploads: admin.firestore.FieldValue.increment(incrementUpload),
        generations: admin.firestore.FieldValue.increment(incrementGen),
        pending: admin.firestore.FieldValue.increment(0),
        approved: admin.firestore.FieldValue.increment(0),
        rejected: admin.firestore.FieldValue.increment(0)
    }, { merge: true });
    return null;
});
/**
 * Firestore trigger to update analytics when a request is created or its status changes.
 * The trigger determines the status before and after the write and increments the
 * appropriate counters for the day of the change.
 */
exports.onRequestWriteForAnalytics = functions.firestore
    .document('requests/{requestId}')
    .onWrite(async (change, context) => {
    const beforeStatus = change.before.exists ? change.before.get('status') : null;
    const afterStatus = change.after.exists ? change.after.get('status') : null;
    // We only care about statuses pending, approved, rejected
    const statuses = ['pending', 'approved', 'rejected'];
    if (afterStatus && !statuses.includes(afterStatus)) {
        return null;
    }
    // Determine if we need to increment counts (on create or status change)
    if (!afterStatus || afterStatus === beforeStatus) {
        return null;
    }
    // Use the timestamp of change.after as event date
    const date = change.after.updateTime
        ? change.after.updateTime.toDate()
        : new Date();
    const dateStr = date.toISOString().substring(0, 10);
    const ref = admin.firestore().collection('analytics_daily').doc(dateStr);
    const updates = { date: dateStr };
    if (statuses.includes(afterStatus)) {
        updates[afterStatus] = admin.firestore.FieldValue.increment(1);
    }
    await ref.set(updates, { merge: true });
    return null;
});
//# sourceMappingURL=stats.js.map