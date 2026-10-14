import React, { useState } from 'react';
import {
  Phone,
  KeyRound,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  User,
  CheckCircle2,
  AlertCircle,
  Home,
  RefreshCw,
  Sparkles,
  Building,
  GraduationCap,
} from 'lucide-react';
import {
  sendOtpToPhone,
  verifyOtpCode,
  formatPhoneNumber,
} from '../services/firebaseAuth';
import { FirestoreUserDoc } from '../services/firestoreService';

interface PhoneAuthModalProps {
  isOpen: boolean;
  onSuccess: (user: FirestoreUserDoc) => void;
  onClose?: () => void;
}

export const PhoneAuthModal: React.FC<PhoneAuthModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [room, setRoom] = useState('101');
  const [department, setDepartment] = useState('CSE');
  const [batch, setBatch] = useState('2026');

  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMsg('অনুগ্রহ করে সঠিক ১০-১১ সংখ্যার মোবাইল নম্বর দিন (যেমন: 01712345678)');
      return;
    }

    if (authMode === 'signup' && !name.trim()) {
      setErrorMsg('অনুগ্রহ করে আপনার পুরো নাম লিখুন');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtpToPhone(phone);
      if (res.success) {
        setOtpStep(true);
        setInfoMsg(res.message || 'ফোনে ওটিপি পাঠানো হয়েছে। কোড দিন।');
      } else {
        setErrorMsg(res.error || 'ওটিপি পাঠাতে ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!otpCode.trim() || otpCode.trim().length < 4) {
      setErrorMsg('অনুগ্রহ করে সঠিক ওটিপি কোড লিখুন');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtpCode(
        phone,
        otpCode,
        authMode === 'signup'
          ? {
              name: name.trim(),
              room: room.trim() || '101',
              department: department.trim(),
              batch: batch.trim(),
            }
          : undefined
      );

      if (res.success && res.user) {
        onSuccess(res.user);
      } else {
        setErrorMsg(res.error || 'ওটিপি যাচাইকরণ ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'যাচাইকরণে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
            <Phone className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-white">Firebase Phone OTP</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            মোবাইল নম্বর যাচাইকরণ ও একাউন্ট সংযোগ
          </p>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-4">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setOtpStep(false);
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              authMode === 'login'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            লগইন (Login)
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setOtpStep(false);
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              authMode === 'signup'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            নতুন সাইন-আপ (Sign Up)
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}

        {!otpStep ? (
          <form onSubmit={handleSendOtp} className="space-y-3.5">
            {authMode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    পুরো নাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="আপনার নাম"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      বিভাগ (Department)
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="CSE"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      ব্যাচ
                    </label>
                    <input
                      type="text"
                      value={batch}
                      onChange={(e) => setBatch(e.target.value)}
                      placeholder="2026"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    রুম নম্বর
                  </label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="301"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                মোবাইল নম্বর *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="যেমন: 01712345678"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>ওটিপি পাঠানো হচ্ছে...</span>
                </>
              ) : (
                <>
                  <span>ওটিপি পাঠান</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ৬-সংখ্যার ওটিপি কোড (OTP)
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-center font-mono text-lg font-bold text-white tracking-widest"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>যাচাই করে সম্পন্ন করুন</span>
            </button>
          </form>
        )}

        {onClose && (
          <div className="mt-4 pt-3 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              বন্ধ করুন (Close)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
