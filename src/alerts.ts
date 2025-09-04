import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Scheduled Cloud Function that runs once per day (configurable) to detect
 * requests that have been pending longer than a configured SLA. When such a
 * request is found, an alert document is created in the `alerts` collection.
 * The SLA in days can be configured via the environment variable ALERT_SLA_DAYS
 * or defaults to 7 days.
 */
export const scheduledAlertCheck = functions.pubsub
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