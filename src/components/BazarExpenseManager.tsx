import React, { useState } from 'react';
import { Member, BazarExpense, ExpenseCategory } from '../types';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  Tag,
  DollarSign,
  TrendingUp,
  Receipt,
  Check,
  X,
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

interface BazarExpenseManagerProps {
  members: Member[];
  bazars: BazarExpense[];
  onAddBazar: (bazar: BazarExpense) => void;
  onDeleteBazar: (id: string) => void;
  selectedMonth: string;
  currentUser: Member;
}

export const BazarExpenseManager: React.FC<BazarExpenseManagerProps> = ({
  members,
  bazars,
  onAddBazar,
  onDeleteBazar,
  selectedMonth,
  currentUser,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Form State
  const [formDate, setFormDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [formMemberId, setFormMemberId] = useState<string>(currentUser.id);
  const [formTitle, setFormTitle] = useState('');
  const [formItems, setFormItems] = useState('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('fish_meat');
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formPaymentMethod, setFormPaymentMethod] = useState<'cash' | 'bkash' | 'nagad'>('cash');

  // Filter bazars for the month
  const monthBazars = bazars.filter((b) => b.date.startsWith(selectedMonth));

  // Filter by search & category
  const filteredBazars = monthBazars.filter((b) => {
    const matchesCategory = selectedCategory === 'all' || b.category === selectedCategory;
    const matchesSearch =
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.items.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.memberName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalMonthBazar = monthBazars.reduce((acc, curr) => acc + curr.amount, 0);

  // Category breakdown
  const categoryTotals: Record<ExpenseCategory, number> = {
    fish_meat: 0,
    vegetables: 0,
    grocery_spices: 0,
    oil_rice: 0,
    gas_fuel: 0,
    others: 0,
  };

  monthBazars.forEach((b) => {
    if (categoryTotals[b.category] !== undefined) {
      categoryTotals[b.category] += b.amount;
    }
  });

  const getCategoryLabel = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'fish_meat':
        return 'মাছ ও মাংস';
      case 'vegetables':
        return 'শাকসবজি ও সালাদ';
      case 'grocery_spices':
        return 'মসলা ও দৈনন্দিন';
      case 'oil_rice':
        return 'চাল, ডাল ও তেল';
      case 'gas_fuel':
        return 'গ্যাস ও জ্বালানি';
      case 'others':
        return 'অন্যান্য';
      default:
        return cat;
    }
  };

  const getCategoryColor = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'fish_meat':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'vegetables':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'oil_rice':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'grocery_spices':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formAmount || Number(formAmount) <= 0) {
      alert('বাজারের বিবরণ ও সঠিক টাকার পরিমাণ দিন');
      return;
    }

    const member = members.find((m) => m.id === formMemberId) || currentUser;

    const newBazar: BazarExpense = {
      id: `bazar-${Date.now()}`,
      date: formDate,
      memberId: member.id,
      memberName: member.name,
      title: formTitle,
      items: formItems || formTitle,
      category: formCategory,
      amount: Number(formAmount),
      paymentMethod: formPaymentMethod,
    };

    onAddBazar(newBazar);
    setIsModalOpen(false);

    // Reset Form
    setFormTitle('');
    setFormItems('');
    setFormAmount('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
              দৈনিক বাজার ও খরচ খাতা (Bazar Expenses)
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              মোট: {formatCurrency(totalMonthBazar)}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            কে কত টাকার বাজার করলো তার দৈনিক হিসাব ও ক্যাটাগরিভিত্তিক তালিকা
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          নতুন বাজার এন্ট্রি করুন (Add Bazar)
        </button>
      </div>

      {/* Category Cost Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-400 block font-medium">মাছ ও মাংস</span>
          <span className="text-base font-bold text-rose-400">
            {formatCurrency(categoryTotals.fish_meat)}
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-400 block font-medium">শাকসবজি ও সালাদ</span>
          <span className="text-base font-bold text-emerald-400">
            {formatCurrency(categoryTotals.vegetables)}
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-400 block font-medium">চাল, ডাল ও তেল</span>
          <span className="text-base font-bold text-amber-400">
            {formatCurrency(categoryTotals.oil_rice)}
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-400 block font-medium">মসলা ও অন্যান্য</span>
          <span className="text-base font-bold text-indigo-400">
            {formatCurrency(categoryTotals.grocery_spices + categoryTotals.gas_fuel + categoryTotals.others)}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="বাজারের নাম, মেম্বারের নাম বা পণ্য খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">সব ক্যাটাগরি</option>
            <option value="fish_meat">মাছ ও মাংস</option>
            <option value="vegetables">শাকসবজি</option>
            <option value="oil_rice">চাল, তেল ও ডাল</option>
            <option value="grocery_spices">মসলা ও খুচরা</option>
            <option value="gas_fuel">গ্যাস ও সিলিন্ডার</option>
            <option value="others">অন্যান্য</option>
          </select>
        </div>
      </div>

      {/* Bazar Expense List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            চলতি মাসের বাজার খরচের রেকর্ড ({filteredBazars.length} টি)
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            সর্বমোট: {formatCurrency(filteredBazars.reduce((a, b) => a + b.amount, 0))}
          </span>
        </div>

        {filteredBazars.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ShoppingCart className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <div className="text-white font-bold text-sm mb-1">কোনো বাজার খরচের রেকর্ড নেই (০ টাকা)</div>
            <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
              ম্যানেজার হিসেবে সরাসরি বাজার খরচ ইনপুট করুন। ইনপুট করার সাথে সাথে লাইভ মিল রেট হিসাব হয়ে যাবে।
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              নতুন বাজার খরচ এন্ট্রি করুন (Add Bazar)
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredBazars.map((bazar) => (
              <div
                key={bazar.id}
                className="p-4 sm:p-4.5 hover:bg-slate-850 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center shrink-0 text-slate-300">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {bazar.date.split('-')[1]}/{bazar.date.split('-')[2]}
                    </span>
                    <ShoppingCart className="w-3.5 h-3.5 text-emerald-400 mt-0.5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm sm:text-base text-white">
                        {bazar.title}
                      </h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getCategoryColor(
                          bazar.category
                        )}`}
                      >
                        {getCategoryLabel(bazar.category)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1">
                      {bazar.items}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5 flex-wrap">
                      <span>
                        🛍️ বাজার করেছে: <strong className="text-slate-200">{bazar.memberName}</strong>
                      </span>
                      <span>•</span>
                      <span>পদ্ধতি: {bazar.paymentMethod}</span>
                      <span>•</span>
                      <span>তারিখ: {bazar.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-slate-800">
                  <div className="text-left sm:text-right">
                    <span className="text-base sm:text-lg font-bold text-emerald-400">
                      {formatCurrency(bazar.amount)}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`'${bazar.title}' খরচটি ডিলিট করতে চান?`)) {
                        onDeleteBazar(bazar.id);
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
                    title="ডিলিট করুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Bazar Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">নতুন বাজার এন্ট্রি</h3>
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
                  বাজারের তারিখ (Date)
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
                  কে বাজার করেছে? (Shopper Member)
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
                  বাজারের শিরোনাম (Title)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: রুই মাছ ও তাজা সবজি"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  পণ্যের বিস্তারিত তালিকা (Items description)
                </label>
                <textarea
                  rows={2}
                  placeholder="যেমন: রুই মাছ ৩ কেজি, আলু ৫ কেজি, কাঁচামরিচ, ধনেপাতা..."
                  value={formItems}
                  onChange={(e) => setFormItems(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ক্যাটাগরি
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="fish_meat">মাছ ও মাংস</option>
                    <option value="vegetables">শাকসবজি</option>
                    <option value="oil_rice">চাল, ডাল ও তেল</option>
                    <option value="grocery_spices">মসলা ও খুচরা</option>
                    <option value="gas_fuel">গ্যাস সিলিন্ডার</option>
                    <option value="others">অন্যান্য</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    মোট টাকা (Amount ৳)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="৳ টাকার পরিমাণ"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  টাকা পরিশোধ মাধ্যম (Payment Method)
                </label>
                <select
                  value={formPaymentMethod}
                  onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="cash">নগদ ক্যাশ (Cash)</option>
                  <option value="bkash">বিকাশ (bKash)</option>
                  <option value="nagad">নগদ (Nagad)</option>
                </select>
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
                  বাজার সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
