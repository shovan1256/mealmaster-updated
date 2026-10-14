import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInAnonymously,
} from 'firebase/auth';
import { auth } from '../firebase';
import {
  getUserFromFirestore,
  saveUserToFirestore,
  FirestoreUserDoc,
  getUserByPhone,
  countTotalUsersInFirestore,
} from './firestoreService';
import { Role, UserStatus } from '../types';

let currentConfirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

export function initRecaptchaVerifier(containerId: string = 'recaptcha-container'): RecaptchaVerifier {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (e) {
      // ignore
    }
    recaptchaVerifier = null;
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('reCAPTCHA verified');
    },
    'expired-callback': () => {
      console.warn('reCAPTCHA expired, please try again');
    },
  });

  return recaptchaVerifier;
}

export function formatPhoneNumber(rawPhone: string): string {
  let cleaned = rawPhone.trim().replace(/[\s-]/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('01')) {
      cleaned = '+88' + cleaned;
    } else if (cleaned.startsWith('880')) {
      cleaned = '+' + cleaned;
    } else {
      cleaned = '+880' + cleaned.replace(/^0+/, '');
    }
  }
  return cleaned;
}

export interface SendOtpResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function sendOtpToPhone(
  phoneNumber: string,
  containerId: string = 'recaptcha-container'
): Promise<SendOtpResult> {
  const formattedPhone = formatPhoneNumber(phoneNumber);

  try {
    const verifier = initRecaptchaVerifier(containerId);
    const confirmation = await signInWithPhoneNumber(auth, formattedPhone, verifier);
    currentConfirmationResult = confirmation;
    return {
      success: true,
      message: 'আপনার ফোনে ৬-সংখ্যার ওটিপি কোড পাঠানো হয়েছে',
    };
  } catch (err: any) {
    console.error('Firebase signInWithPhoneNumber error:', err);
    return {
      success: false,
      error:
        err.code === 'auth/operation-not-allowed'
          ? 'ফায়ারবেস কনসোলে Phone Provider সক্রিয় করা নেই। অনুগ্রহ করে Firebase Console -> Authentication -> Sign-in method -> Phone Enable করুন।'
          : err.code === 'auth/quota-exceeded'
          ? 'আজকের জন্য ফ্রি SMS কোটা শেষ হয়েছে। অনুগ্রহ করে পাসওয়ার্ড দিয়ে প্রবেশ করুন অথবা ফায়ারবেসে টেস্ট নম্বর যোগ করুন।'
          : err.code === 'auth/invalid-phone-number'
          ? 'ভুল মোবাইল নম্বর ফরম্যাট। অনুগ্রহ করে সঠিক নম্বর লিখুন (যেমন: 01712345678)।'
          : err.message || 'ওটিপি পাঠাতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।',
    };
  }
}

export interface VerifyOtpResult {
  success: boolean;
  user?: FirestoreUserDoc;
  isNewUser?: boolean;
  error?: string;
}

export async function verifyOtpCode(
  otpCode: string,
  phoneNumber?: string,
  newUserData?: {
    name?: string;
    department?: string;
    batch?: string;
    room?: string;
    photoUrl?: string;
    username?: string;
    password?: string;
    messId?: string;
    role?: Role;
  }
): Promise<VerifyOtpResult> {
  const formattedPhone = phoneNumber ? formatPhoneNumber(phoneNumber) : '';
  const cleanOtp = otpCode.trim();

  if (!currentConfirmationResult) {
    return { success: false, error: 'ওটিপি সেশন পাওয়া যায়নি। অনুগ্রহ করে পুনরায় ওটিপি পাঠান।' };
  }

  try {
    const cred = await currentConfirmationResult.confirm(cleanOtp);
    const fbUser = cred.user;
    const uid = fbUser.uid;

    let existingUser = await getUserFromFirestore(uid);
    if (!existingUser) {
      existingUser = await getUserByPhone(formattedPhone);
    }

    if (existingUser) {
      // If user is verifying or updating password
      if (newUserData?.password && newUserData.password.trim()) {
        existingUser.password = newUserData.password.trim();
        await saveUserToFirestore(existingUser);
      }
      return { success: true, user: existingUser, isNewUser: false };
    }

    // Determine role: First user registered is IT Admin (auto approved)
    const cleanP = formattedPhone.replace(/[\s-+]/g, '');
    const isOwner =
      cleanP.endsWith('01700801665') ||
      (newUserData?.username || '').toLowerCase() === 'shovan' ||
      (newUserData?.name || '').toLowerCase().includes('shovan');

    const totalUsers = await countTotalUsersInFirestore();
    const isFirstUser = totalUsers === 0 || isOwner;

    const targetRole: Role = newUserData?.role || (isFirstUser ? 'it_admin' : 'user');
    const isApproved: boolean = true;
    const initialStatus: UserStatus = 'approved';

    const newUserDoc: FirestoreUserDoc = {
      uid,
      phone: formattedPhone,
      name: newUserData?.name || fbUser.displayName || 'বোর্ডার ' + formattedPhone.slice(-4),
      username: newUserData?.username || formattedPhone,
      password: newUserData?.password || '',
      role: targetRole,
      status: initialStatus,
      approved: isApproved,
      room: newUserData?.room || '101',
      department: newUserData?.department || 'General',
      batch: newUserData?.batch || '2026',
      photoUrl: newUserData?.photoUrl || '',
      active: true,
      mealActive: true,
      avatarColor: isFirstUser ? 'bg-amber-600' : 'bg-emerald-600',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveUserToFirestore(newUserDoc);
    return { success: true, user: newUserDoc, isNewUser: true };
  } catch (err: any) {
    console.error('Confirmation error:', err);
    return {
      success: false,
      error:
        err.code === 'auth/invalid-verification-code'
          ? 'ভুল ওটিপি কোড প্রদান করা হয়েছে।'
          : err.code === 'auth/code-expired'
          ? 'ওটিপি কোডের মেয়াদ শেষ হয়েছে। পুনরায় কোড পাঠান।'
          : err.message || 'যাচাইকরণ ব্যর্থ হয়েছে।',
    };
  }
}

export async function logoutFirebaseUser(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuthState(
  callback: (user: FirebaseUser | null) => void
) {
  return onAuthStateChanged(auth, callback);
}
