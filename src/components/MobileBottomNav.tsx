import React from 'react';
import {
  Utensils,
  Receipt,
  Eye,
  Bell,
  Calendar,
  ShoppingCart,
  Wallet,
  Calculator,
  ShieldCheck,
  User,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { Role } from '../types';

interface MobileBottomNavProps {
  portalMode: 'user' | 'manager';
  userRole: Role; // 'it_admin' | 'manager' | 'user'
  onSelectPortalMode: (mode: 'user' | 'manager') => void;
  activeUserTab: string;
  onSelectUserTab: (tab: any) => void;
  activeManagerTab: string;
  onSelectManagerTab: (tab: any) => void;
  unreadNoticesCount: number;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  portalMode,
  userRole,
  onSelectPortalMode,
  activeUserTab,
  onSelectUserTab,
  activeManagerTab,
  onSelectManagerTab,
  unreadNoticesCount,
  onLogout,
}) => {
  const isPrivileged = userRole === 'it_admin' || userRole === 'manager';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800/90 backdrop-blur-md md:hidden shadow-2xl safe-area-pb">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-center px-1">
        
        {portalMode === 'user' ? (
          <>
            {/* 1. My Meal */}
            <button
              onClick={() => onSelectUserTab('my_meals')}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition cursor-pointer ${
                activeUserTab === 'my_meals' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Utensils className="w-5 h-5 mb-1" />
              <span className="text-[10px] truncate">মিল অন/অফ</span>
            </button>

            {/* 2. My Account */}
            <button
              onClick={() => onSelectUserTab('my_account')}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition cursor-pointer ${
                activeUserTab === 'my_account' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Receipt className="w-5 h-5 mb-1" />
              <span className="text-[10px] truncate">হিসাব-স্লিপ</span>
            </button>

            {/* 3. Today Cook */}
            <button
              onClick={() => onSelectUserTab('today_cook')}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition cursor-pointer ${
                activeUserTab === 'today_cook' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-5 h-5 mb-1" />
              <span className="text-[10px] truncate">রান্না অবস্থা</span>
            </button>

            {/* 4. Notice Board */}
            <button
              onClick={() => onSelectUserTab('notices')}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] relative transition cursor-pointer ${
                activeUserTab === 'notices' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bell className="w-5 h-5 mb-1" />
              <span className="text-[10px] truncate">নোটিশ</span>
              {unreadNoticesCount > 0 && (
                <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>

            {/* 5. Either Manager Switch or Logout */}
            {isPrivileged ? (
              <button
                onClick={() => onSelectPortalMode('manager')}
                className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                title="ম্যানেজার প্যানেল"
              >
                <ShieldCheck className="w-5 h-5 mb-1 text-indigo-400" />
                <span className="text-[10px] truncate font-semibold">ম্যানেজার</span>
              </button>
            ) : (
              <button
                onClick={onLogout}
                className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] text-rose-400 hover:text-rose-300 transition cursor-pointer"
                title="লগআউট"
              >
                <LogOut className="w-5 h-5 mb-1 text-rose-400" />
                <span className="text-[10px] truncate font-medium">লগআউট</span>
              </button>
            )}
          </>
        ) : (
          <>
            {/* Manager 1: Cook Sheet */}
            <button
              onClick={() => onSelectManagerTab('cook_sheet')}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition cursor-pointer ${
                activeManagerTab === 'cook_sheet' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-5 h-5 mb-1" />
              <span className="text-[10px] truncate">রান্নার শিট</span>
            </button>

            {/* Manager 3: Bazar */}
            <button
              onClick={() => onSelectManagerTab('bazar')}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition cursor-pointer ${
                activeManagerTab === 'bazar' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingCart className="w-5 h-5 mb-1" />
              <span className="text-[10px] truncate">বাজার</span>
            </button>

            {/* Manager 4: Deposits */}
            <button
              onClick={() => onSelectManagerTab('deposits')}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition cursor-pointer ${
                activeManagerTab === 'deposits' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wallet className="w-5 h-5 mb-1" />
              <span className="text-[10px] truncate">জমা</span>
            </button>

            {/* Manager 5: Monthly Calc */}
            <button
              onClick={() => onSelectManagerTab('monthly_calc')}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition cursor-pointer ${
                activeManagerTab === 'monthly_calc' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calculator className="w-5 h-5 mb-1" />
              <span className="text-[10px] truncate">হিসাব</span>
            </button>

            {/* Manager 5: Member Switch */}
            <button
              onClick={() => onSelectPortalMode('user')}
              className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
            >
              <User className="w-5 h-5 mb-1" />
              <span className="text-[10px] truncate font-semibold">মেম্বার ভিউ</span>
            </button>
          </>
        )}

      </div>
    </div>
  );
};
