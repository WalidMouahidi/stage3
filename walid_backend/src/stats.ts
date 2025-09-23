import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware that verifies the user is authenticated and has an admin role. The role is
 * expected to be stored as a custom claim on the Firebase auth token. If the user is
 * not authenticated or does not have role 'admin', a 403 is returned.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
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
export async function getStatsHandler(req: Request, res: Response) {
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
  } catch (err) {
    console.error('Error computing stats', err);
    return res.status(500).json({ error: 'internal server error' });
  }
}

/**
 * Firestore trigger to update analytics when a document is created. It increments
 * the appropriate counters (uploads or generations) for the day of creation.
 */
export const onDocumentCreated = functions.firestore
  .document('documents/{docId}')
  .onCreate(async snapshot => {
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
    await ref.set(
      {
        date: dateStr,
        uploads: admin.firestore.FieldValue.increment(incrementUpload),
        generations: admin.firestore.FieldValue.increment(incrementGen),
        pending: admin.firestore.FieldValue.increment(0),
        approved: admin.firestore.FieldValue.increment(0),
        rejected: admin.firestore.FieldValue.increment(0)
      },
      { merge: true }
    );
    return null;
  });

/**
 * Firestore trigger to update analytics when a request is created or its status changes.
 * The trigger determines the status before and after the write and increments the
 * appropriate counters for the day of the change.
 */
export const onRequestWriteForAnalytics = functions.firestore
  .document('requests/{requestId}')
  .onWrite(async (change, context) => {
    const beforeStatus: string | null = change.before.exists ? change.before.get('status') : null;
    const afterStatus: string | null = change.after.exists ? change.after.get('status') : null;
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
    const updates: Record<string, any> = { date: dateStr };
    if (statuses.includes(afterStatus)) {
      updates[afterStatus] = admin.firestore.FieldValue.increment(1);
    }
    await ref.set(updates, { merge: true });
    return null;
  });