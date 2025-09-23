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
exports.scheduledAlertCheck = void 0;
exports.getAlertsHandler = getAlertsHandler;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
/**
 * Scheduled Cloud Function that runs once per day (configurable) to detect
 * requests that have been pending longer than a configured SLA. When such a
 * request is found, an alert document is created in the `alerts` collection.
 * The SLA in days can be configured via the environment variable ALERT_SLA_DAYS
 * or defaults to 7 days.
 */
exports.scheduledAlertCheck = functions.pubsub
    .schedule('every 24 hours')
    .onRun(async () => {
    const slaDaysEnv = process.env.ALERT_SLA_DAYS;
    const slaDays = slaDaysEnv ? parseInt(slaDaysEnv, 10) : 7;
    const thresholdDate = new Date(Date.now() - slaDays * 24 * 60 * 60 * 1000);
    const db = admin.firestore();
    const pendingRequestsSnap = await db
        .collection('requests')
        .where('status', '==', 'pending')
        .where('createdAt', '<=', thresholdDate)
        .get();
    if (pendingRequestsSnap.empty) {
        console.log('No pending requests beyond SLA');
        return null;
    }
    const batch = db.batch();
    pendingRequestsSnap.forEach(doc => {
        const requestId = doc.id;
        const alertRef = db.collection('alerts').doc();
        const alertData = {
            requestId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            message: `La demande ${requestId} est en attente depuis plus de ${slaDays} jours`,
            status: 'pending'
        };
        batch.set(alertRef, alertData, { merge: true });
    });
    await batch.commit();
    console.log(`Generated ${pendingRequestsSnap.size} alerts for pending requests`);
    return null;
});
/**
 * Express handler to list alert documents. This function retrieves all
 * documents from the `alerts` collection and returns them as JSON.
 * Only administrators should be allowed to call this endpoint; the
 * route definition in index.ts should wrap it with requireAdmin.
 */
async function getAlertsHandler(req, res) {
    try {
        const snap = await admin
            .firestore()
            .collection('alerts')
            .orderBy('createdAt', 'desc')
            .get();
        const alerts = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(alerts);
    }
    catch (err) {
        console.error('Error fetching alerts', err);
        res.status(500).json({ error: 'internal server error' });
    }
}
//# sourceMappingURL=alerts.js.map