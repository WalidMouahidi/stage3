import request from 'supertest';
import * as admin from 'firebase-admin';
// Import the compiled cloud function via ts-node/register
import { api } from '../src/index';

// Initialize Firebase Admin SDK for tests
if (!admin.apps.length) {
  admin.initializeApp();
}

describe('POST /logs', () => {
  it('should return 400 when action is missing', async () => {
    const res = await request(api).post('/logs').send({});
    expect(res.status).toBe(400);
  });
});