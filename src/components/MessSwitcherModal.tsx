import React, { useState } from 'react';
import { X, Building2, Plus, LogIn, Check, Copy, Shield, Users } from 'lucide-react';
import { Mess, Member } from '../types';

interface MessSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  messes: Mess[];
  activeMessId: string;
  onSelectMess: (messId: string) => void;
  onCreateMess: (name: string, address: string) => void;
  onJoinMess: (code: string) => void;
  currentUser: Member;
}

export const MessSwitcherModal: React.FC<MessSwitcherModalProps> = ({
  isOpen,
  onClose,
  messes,
  activeMessId,
  onSelectMess,
  onCreateMess,
  onJoinMess,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'join'>('list');
  const [newMessName, setNewMessName] = useState('');
  const [newMessAddress, setNewMessAddress] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const currentMess = messes.find((m) => m.id === activeMessId) || messes[0];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessName.trim()) {
      setErrorMsg('মেসের নাম আবশ্যক');
      return;
    }
    onCreateMess(newMessName.trim(), newMessAddress.trim());
    setNewMessName('');
    setNewMessAddress('');
    setActiveTab('list');
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setErrorMsg('মেস জয়েন কোড আবশ্যক');
      return;
    }
    onJoinMess(joinCode.trim().toUpperCase());
    setJoinCode('');
    setActiveTab('list');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-semibold">মেস নিয়ন্ত্রণ ও নির্বাচন</h2>
              <p className="text-xs text-slate-300">মাল্টি-মেস প্ল্যাটফর্ম</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2">
          <button
            onClick={() => {
              setActiveTab('list');
              setErrorMsg('');
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'list'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            আমার মেসসমূহ
          </button>
          <button
            onClick={() => {
              setActiveTab('create');
              setErrorMsg('');
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'create'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            + নতুন মেস খুলুন
          </button>
          <button
            onClick={() => {
              setActiveTab('join');
              setErrorMsg('');
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'join'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            মেসে যুক্ত হোন
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="space-y-2">
                {messes.map((mess) => {
                  const isCurrent = mess.id === activeMessId;
                  return (
                    <div
                      key={mess.id}
                      onClick={() => {
                        onSelectMess(mess.id);
                        onClose();
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isCurrent
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                            isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {mess.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">{mess.name}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span>কোড: <strong className="font-mono text-slate-700">{mess.code}</strong></span>
                            {mess.address && <span>· {mess.address}</span>}
                          </div>
                        </div>
                      </div>

                      {isCurrent && (
                        <div className="flex items-center gap-1 text-xs font-semibold text-indigo-700">
                          <Check className="w-4 h-4" />
                          <span>বর্তমান</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Share current mess code */}
              {currentMess && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase">
                        মেসের আমন্ত্রণ কোড (সদস্যদের যুক্ত করতে)
                      </span>
                      <div className="text-base font-bold font-mono text-slate-900 tracking-wider mt-0.5">
                        {currentMess.code}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyCode(currentMess.code)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 transition"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  মেসের নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: গ্রিনভিউ ছাত্রাবাস, ঢাকা"
                  value={newMessName}
                  onChange={(e) => setNewMessName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ঠিকানা বা এলাকা
                </label>
                <input
                  type="text"
                  placeholder="যেমন: মিরপুর-১০, ঢাকা"
                  value={newMessAddress}
                  onChange={(e) => setNewMessAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs transition"
                >
                  মেস তৈরি করুন
                </button>
              </div>
            </form>
          )}

          {activeTab === 'join' && (
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  মেসের ৬ ডিজিটের কোড লিখুন *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: MM-1001"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full px-3 py-2.5 text-base font-mono uppercase text-center rounded-xl border border-slate-300 tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  মেসের ম্যানেজার বা অ্যাডমিনের কাছ থেকে ৬ ডিজিটের কোডটি সংগ্রহ করুন।
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs transition"
                >
                  মেসে যোগ দিন
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
