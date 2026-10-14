import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Database ID হ্যান্ডেল করা
const dbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = dbId && dbId !== '(default)' ? getFirestore(app, dbId) : getFirestore(app);
export const auth = getAuth(app);

// Ensure user has auth session to prevent permission errors
export const ensureFirebaseAuth = async () => {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.warn('Anonymous auth sign in:', e);
    }
  }
  return auth.currentUser;
};

// অটোমেটিক ফার্স্ট ইউজার ডাটাবেজ পাথ ইনিশিয়ালাইজেশন
export const initUserDatabase = async (userId: string, data: any) => {
  try {
    const userDocRef = doc(db, 'Users', userId);
    await setDoc(userDocRef, data, { merge: true });
    console.log('Database synced successfully!');
  } catch (error) {
    console.error('Firebase Sync Error: ', error);
  }
};

// Test Firestore connection on boot as mandated by skill
async function testConnection() {
  try {
    await ensureFirebaseAuth();
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Standardized error handling as required by Firebase skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function isFirestoreQuotaError(error: unknown): boolean {
  if (!error) return false;
  const errStr = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code || '';
  return (
    errCode === 'resource-exhausted' ||
    errStr.includes('resource-exhausted') ||
    errStr.includes('Quota limit exceeded') ||
    errStr.includes('Quota exceeded')
  );
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  if (isFirestoreQuotaError(error)) {
    console.warn(`[Firestore Quota Reached] Operation ${operationType} on ${path}. Preserving changes locally.`);
    throw new Error(`Firestore quota exceeded. System operating in local offline cache mode.`);
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
