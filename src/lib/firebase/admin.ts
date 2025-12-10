import { initializeApp, getApps, App, type AppOptions } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { credential } from 'firebase-admin';

// Use a lazy-initialized holder for Firebase Admin
let firebaseAdmin: { db: Firestore; auth: Auth; app: App } | null = null;

// Helper function to initialize Firebase Admin on first use
export function getFirebaseAdmin() {
  if (!firebaseAdmin) {
    try {
      if (getApps().length) {
        const app = getApps()[0];
        const db = getFirestore(app);
        const auth = getAuth(app);
        firebaseAdmin = { db, auth, app };
      } else {
        // This is the most explicit way to initialize.
        // It forces firebase-admin to use the environment's
        // built-in service account (Application Default Credentials).
        const app = initializeApp();
        const db = getFirestore(app);
        const auth = getAuth(app);
        firebaseAdmin = { db, auth, app };
      }
    } catch (e: any) {
      console.error('CRITICAL: Firebase Admin SDK initialization failed.', {
        errorMessage: e.message,
        errorStack: e.stack,
      });
      // This will cause a server crash, but it's better to fail loudly
      // than to have silent failures.
      throw new Error(`Firebase Admin SDK failed to initialize: ${e.message}`);
    }
  }
  return firebaseAdmin;
}
