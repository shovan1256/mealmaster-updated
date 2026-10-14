import React, { useState } from 'react';
import {
  X,
  KeyRound,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Send,
  HelpCircle,
} from 'lucide-react';
import { formatPhoneNumber, sendOtpToPhone, verifyOtpCode } from '../services/firebaseAuth';
import { getUserByUsernameOrPhone, updateUserInFirestore } from '../services/firestoreService';
import { Member } from '../types';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onPasswordResetSuccess?: (phoneOrUsername: string, updatedMember: Member) => void;
}

type ResetStep = 'identify' | 'method' | 'otp_verify' | 'new_password' | 'success';

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  members,
  onPasswordResetSuccess,
}) => {
  const [step, setStep] = useState<ResetStep>('identify');
  const [identifier, setIdentifier] = useState('');
  const [foundUser, setFoundUser] = useState<Member | null>(null);

  // OTP flow
  const [otpCode, setOtpCode] = useState('');

  // New Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleResetState = () => {
    setStep('identify');
    setIdentifier('');
    setFoundUser(null);
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(false);
    onClose();
  };

  // 1. Identify User
  const handleFindUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!identifier.trim()) {
      setErrorMsg('মোবাইল নম্বর বা ইউজারনেম দিন');
      return;
    }

    setLoading(true);
    try {
      // Look in local members first
      const clean = identifier.trim().toLowerCase();
      const cleanNoSpaces = clean.replace(/[\s-+]/g, '');

      let matched = members.find((m) => {
        const uPhone = (m.phone || '').replace(/[\s-+]/g, '').toLowerCase();
        const uUser = (m.username || '').trim().toLowerCase();
        const uName = (m.name || '').trim().toLowerCase();
        return (
          uUser === clean ||
          uName === clean ||
          (clean.length > 2 && uName.includes(clean)) ||
          (cleanNoSpaces.length > 5 && (
            uPhone === cleanNoSpaces ||
            uPhone.endsWith(cleanNoSpaces) ||
            cleanNoSpaces.endsWith(uPhone)
          ))
        );
      });

      // If not in local, look in Firestore
      if (!matched) {
        const remote = await getUserByUsernameOrPhone(identifier.trim());
        if (remote) {
          matched = {
            id: remote.uid,
            name: remote.name,
            phone: remote.phone,
            username: remote.username,
            password: remote.password,
            room: remote.room || '101',
            role: remote.role || 'user',
            status: remote.status || (remote.approved ? 'approved' : 'pending'),
            approved: remote.approved ?? false,
            department: remote.department || '',
            batch: remote.batch || '',
            active: remote.active ?? true,
            mealActive: remote.mealActive ?? true,
            avatarColor: remote.avatarColor || 'bg-emerald-600',
            carryOverDue: remote.carryOverDue || 0,
            joinDate: remote.createdAt ? remote.createdAt.split('T')[0] : '2026-10-01',
          };
        }
      }

      if (!matched) {
        setErrorMsg('এই ইউজারনেম বা নম্বরের সাথে কোনো সদস্য অ্যাকাউন্ট পাওয়া যায়নি!');
        return;
      }

      setFoundUser(matched);
      setStep('method');
    } catch (err: any) {
      setErrorMsg(err.message || 'অ্যাকাউন্ট খুঁজতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  // 2. Send OTP
  const handleSendOtp = async () => {
    if (!foundUser || !foundUser.phone) {
      setErrorMsg('ইউজারের সাথে কোনো মোবাইল নম্বর যুক্ত নেই');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const formatted = formatPhoneNumber(foundUser.phone);
      const res = await sendOtpToPhone(formatted, 'recaptcha-reset-container');
      if (res.success) {
        setSuccessMsg(`আপনার ${foundUser.phone} নম্বরে ৬ সংখ্যার ভেরিফিকেশন কোড পাঠানো হয়েছে।`);
        setStep('otp_verify');
      } else {
        // In case phone auth quota or recaptcha isn't configured, offer fallback
        setErrorMsg(res.error || 'ওটিপি পাঠাতে সমস্যা হয়েছে। তাৎক্ষণিক রিসেট বা ম্যানেজারের সহায়তা নিন।');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'ওটিপি পাঠাতে ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setErrorMsg('সঠিক ৬ সংখ্যার ওটিপি কোড দিন');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await verifyOtpCode(otpCode.trim());
      if (res.success) {
        setSuccessMsg('ওটিপি যাচাই সম্পন্ন হয়েছে! এখন নতুন পাসওয়ার্ড সেট করুন।');
        setStep('new_password');
      } else {
        setErrorMsg(res.error || 'ভুল ওটিপি কোড!');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'যাচাইকরণ ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  // 4. Set New Password
  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedPass = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedPass || trimmedPass.length < 4) {
      setErrorMsg('পাসওয়ার্ড ন্যূনতম ৪ অক্ষরের হতে হবে');
      return;
    }
    if (trimmedPass !== trimmedConfirm) {
      setErrorMsg('উভয় পাসওয়ার্ড একই হতে হবে');
      return;
    }
    if (!foundUser) {
      setErrorMsg('ইউজার খুঁজে পাওয়া যায়নি');
      return;
    }

    setLoading(true);
    try {
      const updatedUser: Member = {
        ...foundUser,
        password: trimmedPass,
      };

      // 1. Immediately persist to localStorage
      try {
        const { getMembers, saveMembers } = await import('../utils/storage');
        const localList = getMembers();
        const nextList = localList.map((m) =>
          m.id === foundUser.id || m.phone === foundUser.phone || m.username === foundUser.username
            ? { ...m, password: trimmedPass }
            : m
        );
        if (!nextList.some((m) => m.id === foundUser.id || m.phone === foundUser.phone || m.username === foundUser.username)) {
          nextList.push(updatedUser);
        }
        saveMembers(nextList);
      } catch (storageErr) {
        console.warn('LocalStorage save error:', storageErr);
      }

      // 2. Notify parent state callback immediately
      if (onPasswordResetSuccess) {
        onPasswordResetSuccess(foundUser.phone || foundUser.username || foundUser.id, updatedUser);
      }

      // 3. Sync to Firestore in background with a 2.5-second timeout race so UI NEVER hangs
      try {
        await Promise.race([
          updateUserInFirestore(foundUser.id, {
            password: trimmedPass,
          }),
          new Promise((resolve) => setTimeout(resolve, 2500)),
        ]);
      } catch (fsErr) {
        console.warn('Firestore password sync warning:', fsErr);
      }

      setSuccessMsg('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!');
      setStep('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'পাসওয়ার্ড সংরক্ষণ করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={handleResetState}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">পাসওয়ার্ড রিসেট করুন</h2>
            <p className="text-xs text-slate-400">
              {step === 'identify' && 'অ্যাকাউন্ট ভেরিফিকেশন'}
              {step === 'method' && 'ভেরিফিকেশন পদ্ধতি পছন্দ'}
              {step === 'otp_verify' && 'ওটিপি কোড যাচাই'}
              {step === 'new_password' && 'নতুন পাসওয়ার্ড প্রদান'}
              {step === 'success' && 'পাসওয়ার্ড আপডেট সম্পন্ন'}
            </p>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{successMsg}</div>
          </div>
        )}

        {/* STEP 1: Identify Account */}
        {step === 'identify' && (
          <form onSubmit={handleFindUser} className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              আপনার নিবন্ধিত মোবাইল নম্বর বা ইউজারনেম দিন। সিস্টেম আপনার অ্যাকাউন্ট শনাক্ত করবে।
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                মোবাইল নম্বর বা ইউজারনেম
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="যেমন: 01712345678 বা shuvo"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                  autoFocus
                />
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-amber-600/20"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>অ্যাকাউন্ট খোঁজা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <span>পরবর্তী ধাপ</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Choose Verification Method */}
        {step === 'method' && foundUser && (
          <div className="space-y-4">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-xs">
              <div className="text-slate-400 text-[11px] mb-1">শনাক্তকৃত অ্যাকাউন্ট:</div>
              <div className="font-bold text-sm text-white">{foundUser.name}</div>
              <div className="text-slate-400 mt-0.5">
                রুম: <span className="text-emerald-400">{foundUser.room}</span> • রোল:{' '}
                <span className="text-amber-400 uppercase font-semibold">{foundUser.role}</span>
              </div>
              <div className="text-slate-500 font-mono mt-0.5 text-[11px]">
                ফোন: {foundUser.phone || 'যুক্ত নেই'}
              </div>
            </div>

            <p className="text-xs text-slate-300">
              পাসওয়ার্ড রিসেটের জন্য নিচের যেকোনো একটি মাধ্যম বেছে নিন:
            </p>

            <div className="space-y-2.5">
              {/* Option 1: Direct Quick Reset without OTP */}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setStep('new_password');
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/50 hover:border-emerald-400 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition flex items-center gap-1.5">
                      <span>তাৎক্ষণিক নতুন পাসওয়ার্ড সেট করুন (সুপার ফাস্ট)</span>
                      <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded font-normal">
                        ঝামেলামুক্ত
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      কোনো এসএমএস বা ওটিপি ছাড়াই সরাসরি নতুন পাসওয়ার্ড নির্ধারণ করুন
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400 transition shrink-0 ml-2" />
              </button>

              {/* Option 2: Phone OTP (Optional) */}
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full text-left p-3.5 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                      মোবাইল নম্বরে এসএমএস ওটিপি পাঠান
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ফোন নম্বরে ৬-সংখ্যার এসএমএস কোড ভেরিফিকেশন
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition shrink-0 ml-2" />
              </button>
            </div>

            {/* Manager Contact Notice */}
            <div className="bg-indigo-950/40 border border-indigo-700/30 rounded-xl p-3 text-[11px] text-indigo-300 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong>সহায়তা:</strong> আপনার মেস ম্যানেজার বা আইটি এডমিনও তাদের এডমিন প্যানেল (Members Manager) থেকে সরাসরি আপনার পাসওয়ার্ড পরিবর্তন করে দিতে পারবেন।
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep('identify')}
              className="w-full text-center text-xs text-slate-400 hover:text-white transition py-1 cursor-pointer"
            >
              ← অন্য অ্যাকাউন্ট খুঁজুন
            </button>
          </div>
        )}

        {/* STEP 3: OTP Verify */}
        {step === 'otp_verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-xs text-slate-300">
              আপনার ফোনে পাঠানো ৬-সংখ্যার ওটিপি কোডটি নিচে দিন:
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                ৬-সংখ্যার ওটিপি কোড
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="যেমন: 123456"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 pl-10 text-center tracking-widest text-lg font-mono text-white focus:outline-none focus:border-amber-500 transition"
                  autoFocus
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>ওটিপি যাচাই করা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ওটিপি যাচাই করুন</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="text-amber-400 hover:underline cursor-pointer"
              >
                কোড পাননি? পুনরায় পাঠান
              </button>
              <button
                type="button"
                onClick={() => setStep('method')}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                পদ্ধতি পরিবর্তন
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Set New Password */}
        {step === 'new_password' && foundUser && (
          <form onSubmit={handleSaveNewPassword} className="space-y-3.5">
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-850 text-xs text-slate-300">
              অ্যাকাউন্ট: <strong className="text-white">{foundUser.name}</strong> ({foundUser.username || foundUser.phone})
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                নতুন পাসওয়ার্ড (New Password) *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="ন্যূনতম ৪ অক্ষরের নতুন পাসওয়ার্ড"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  autoFocus
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                নতুন পাসওয়ার্ড নিশ্চিত করুন (Confirm Password) *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="একই পাসওয়ার্ড পুনরায় লিখুন"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>সংরক্ষণ করা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>পাসওয়ার্ড পরিবর্তন ও সংরক্ষণ করুন</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 5: Success */}
        {step === 'success' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!</h3>
              <p className="text-xs text-slate-400 mt-1">
                আপনার নতুন পাসওয়ার্ড দিয়ে এখন সরাসরি লগইন করতে পারবেন।
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetState}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition cursor-pointer"
            >
              লগইন পেজে যান
            </button>
          </div>
        )}

        {/* Hidden reCAPTCHA container for password reset */}
        <div id="recaptcha-reset-container" className="flex justify-center mt-2" />
      </div>
    </div>
  );
};
