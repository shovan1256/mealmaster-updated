import React, { useState } from 'react';
import { Member, Deposit } from '../types';
import {
  Wallet,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  User,
  Filter,
  CheckCircle2,
  X,
  ArrowDownLeft,
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

interface DepositManagerProps {
  members: Member[];
  deposits: Deposit[];
  onAddDeposit: (deposit: Deposit) => void;
  onDeleteDeposit: (id: string) => void;
  selectedMonth: string;
  currentUser: Member;
  messName?: string;
}

export const DepositManager: React.FC<DepositManagerProps> = ({
  members,
  deposits,
  onAddDeposit,
  onDeleteDeposit,
  selectedMonth,
  currentUser,
  messName,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('all');

  // Form State
  const [formDate, setFormDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [formMemberId, setFormMemberId] = useState<string>(currentUser.id);
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formPaymentMethod, setFormPaymentMethod] = useState<'cash' | 'bkash' | 'nagad' | 'bank'>('bkash');
  const [formNote, setFormNote] = useState('');

  const monthDeposits = deposits.filter((d) => d.date.startsWith(selectedMonth));

  const filteredDeposits = monthDeposits.filter((d) => {
    return selectedMemberFilter === 'all' || d.memberId === selectedMemberFilter;
  });

  const totalMonthDeposits = monthDeposits.reduce((acc, curr) => acc + curr.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || Number(formAmount) <= 0) {
      alert('সঠিক জমার পরিমাণ দিন');
      return;
    }

    const member = members.find((m) => m.id === formMemberId) || currentUser;

    const newDep: Deposit = {
      id: `dep-${Date.now()}`,
      date: formDate,
      memberId: member.id,
      memberName: member.name,
      amount: Number(formAmount),
      paymentMethod: formPaymentMethod,
      note: formNote || 'সাধারণ ডিপোজিট জমা',
    };

    onAddDeposit(newDep);
    setIsModalOpen(false);

    // Reset Form
    setFormAmount('');
    setFormNote('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-400" />
              মেম্বারদের টাকা জমা খাতা (Member Deposits)
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              মোট জমা: {formatCurrency(totalMonthDeposits)}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            মেসের ফান্ডে মেম্বাররা কে কত টাকা জমা দিয়েছে তার বিশদ খাতা
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          টাকা জমা এন্ট্রি করুন (Add Deposit)
        </button>
      </div>

      {/* Member Deposit Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {members.map((m) => {
          const mDeposits = monthDeposits
            .filter((d) => d.memberId === m.id)
            .reduce((s, d) => s + d.amount, 0);

          return (
            <div
              key={m.id}
              onClick={() => setSelectedMemberFilter(selectedMemberFilter === m.id ? 'all' : m.id)}
              className={`p-3 rounded-xl border cursor-pointer transition ${
                selectedMemberFilter === m.id
                  ? 'bg-emerald-950/40 border-emerald-500/60'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-5 h-5 rounded-full ${m.avatarColor} text-white flex items-center justify-center text-[10px] font-bold`}>
                  {m.name.charAt(0)}
                </div>
                <span className="text-xs font-semibold text-white truncate">{m.name}</span>
              </div>
              <span className="text-sm font-bold text-emerald-400 block">
                {formatCurrency(mDeposits)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <span>ফিল্টার: {selectedMemberFilter === 'all' ? 'সকল সদস্যের জমা' : 'নির্বাচিত সদস্য'}</span>
        {selectedMemberFilter !== 'all' && (
          <button
            onClick={() => setSelectedMemberFilter('all')}
            className="text-emerald-400 hover:underline"
          >
            সব দেখুন
          </button>
        )}
      </div>

      {/* Deposit List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            চলতি মাসের জমার তালিকা ({filteredDeposits.length} টি)
          </h3>
        </div>

        {filteredDeposits.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs sm:text-sm">
            এই মাসে এখনও কোনো জমা রেকর্ড পাওয়া যায়নি।
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredDeposits.map((dep) => (
              <div
                key={dep.id}
                className="p-4 hover:bg-slate-850 transition flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{dep.memberName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {dep.paymentMethod}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {dep.note}
                    </p>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      তারিখ: {dep.date}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
                    +{formatCurrency(dep.amount)}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`এই জমাটি ডিলিট করতে চান?`)) {
                        onDeleteDeposit(dep.id);
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
                    title="ডিলিট"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Deposit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">টাকা জমা এন্ট্রি</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  জমা প্রদানের তারিখ (Date)
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  কোন সদস্য জমা দিয়েছেন? (Member)
                </label>
                <select
                  value={formMemberId}
                  onChange={(e) => setFormMemberId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (রুম {m.room})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  জমার পরিমাণ (Amount ৳)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="যেমন: ৩০০০"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  পেমেন্ট মাধ্যম (Payment Method)
                </label>
                <select
                  value={formPaymentMethod}
                  onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="bkash">বিকাশ (bKash)</option>
                  <option value="nagad">নগদ (Nagad)</option>
                  <option value="cash">নগদ ক্যাশ (Cash)</option>
                  <option value="bank">ব্যাংক ট্রান্সফার (Bank)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  নোট বা মন্তব্য (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: বিকাশ লাস্ট ৪ ডিজিট বা মাসের ১ম কিস্তি"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 border border-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-700/20"
                >
                  জমা সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
