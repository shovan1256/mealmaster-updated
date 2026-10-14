/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Member,
  DayMealEntry,
  BazarExpense,
  Deposit,
  FixedCost,
  MessNotice,
  Role,
  Mess,
} from './types';
import {
  getMembers,
  saveMembers,
  getMealEntries,
  saveMealEntries,
  getBazars,
  saveBazars,
  getDeposits,
  saveDeposits,
  getFixedCosts,
  saveFixedCosts,
  getNotices,
  saveNotices,
  resetAllData,
  getMesses,
  saveMesses,
  getActiveMessId,
  setActiveMessId,
  DEFAULT_MESS,
} from './utils/storage';
import {
  calculateMonthlySummary,
  getCurrentMonthString,
} from './utils/calculations';
import { Header } from './components/Header';
import { UserPortal } from './components/UserPortal';
import { ManagerPortal } from './components/ManagerPortal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PhoneAuthModal } from './components/PhoneAuthModal';
import { LoginScreen } from './components/LoginScreen';
import { WaitingApprovalScreen } from './components/WaitingApprovalScreen';
import { ProfileEditModal } from './components/ProfileEditModal';
import { MessSwitcherModal } from './components/MessSwitcherModal';
import { MonthlyStatementModal } from './components/MonthlyStatementModal';
import { useOnlineStatus } from './hooks/usePWAInstall';
import { WifiOff, ShieldCheck, User as UserIcon, ShieldAlert } from 'lucide-react';
import {
  FirestoreUserDoc,
  saveMealEntryToFirestore,
  batchSaveMealEntriesToFirestore,
  saveBazarToFirestore,
  deleteBazarFromFirestore,
  saveDepositToFirestore,
  deleteDepositFromFirestore,
  saveNoticeToFirestore,
  deleteNoticeFromFirestore,
  saveUserToFirestore,
  updateUserInFirestore,
  subscribeToUsers,
  subscribeToAllMeals,
  subscribeToUserMeals,
  subscribeToBazars,
  subscribeToDeposits,
  subscribeToFixedCosts,
  subscribeToNotices,
} from './services/firestoreService';
import { logoutFirebaseUser } from './services/firebaseAuth';
import { initUserDatabase } from './firebase';

export default function App() {
  // State Initialization from storage
  const [members, setMembers] = useState<Member[]>(() => getMembers());
  const [mealEntries, setMealEntries] = useState<DayMealEntry[]>(() => getMealEntries());
  const [bazars, setBazars] = useState<BazarExpense[]>(() => getBazars());
  const [deposits, setDeposits] = useState<Deposit[]>(() => getDeposits());
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>(() => getFixedCosts());
  const [notices, setNotices] = useState<MessNotice[]>(() => getNotices());

  // Multi-Mess Platform State
  const [messes, setMesses] = useState<Mess[]>(() => getMesses());
  const [activeMessId, setActiveMessIdState] = useState<string>(() => getActiveMessId());
  const [isMessSwitcherOpen, setIsMessSwitcherOpen] = useState(false);

  // Statement Modal State
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  // Phone Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Profile Edit Modal State
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);

  // Authentication & Login Screen State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const currentUserRef = React.useRef<Member | null>(null);
  currentUserRef.current = currentUser;

  // Selected Month (e.g. '2026-10')
  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    getCurrentMonthString()
  );

  // Distinct Dashboard Portal Mode: 'user' (UserDashboard) vs 'manager' (Admin/Manager Dashboard)
  const [portalMode, setPortalMode] = useState<'user' | 'manager'>('user');

  // Role Protection: Standard users CANNOT be in 'manager' portal mode
  useEffect(() => {
    if (currentUser && currentUser.role === 'user' && portalMode === 'manager') {
      setPortalMode('user');
    }
  }, [currentUser, portalMode]);

  // Controlled sub-tabs synchronized with mobile bottom nav
  const [userTab, setUserTab] = useState<'my_meals' | 'my_account' | 'today_cook' | 'notices'>('my_meals');
  const [managerTab, setManagerTab] = useState<
    'cook_sheet' | 'bazar' | 'deposits' | 'monthly_calc' | 'members' | 'notices'
  >('cook_sheet');

  const isOnline = useOnlineStatus();

  // 1. Users Collection Subscription (Always on so members and passwords stay live)
  useEffect(() => {
    const unsubUsers = subscribeToUsers((firestoreUsers) => {
      if (!firestoreUsers || firestoreUsers.length === 0) return;

      const map = new Map<string, Member>();
      firestoreUsers.forEach((u) => {
        map.set(u.uid, {
          id: u.uid,
          name: u.name,
          phone: u.phone,
          username: u.username,
          password: u.password,
          room: u.room || '101',
          role: u.role || 'user',
          status: u.status || (u.approved ? 'approved' : 'pending'),
          approved: u.approved ?? false,
          department: u.department || '',
          batch: u.batch || '',
          photoUrl: u.photoUrl || '',
          avatarColor: u.avatarColor || (u.role === 'it_admin' ? 'bg-amber-600' : u.role === 'manager' ? 'bg-indigo-600' : 'bg-emerald-600'),
          active: u.active ?? true,
          mealActive: u.mealActive ?? true,
          stoppedSinceDate: u.stoppedSinceDate,
          carryOverDue: u.carryOverDue || 0,
          joinDate: u.createdAt ? u.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        });
      });

      const updatedList = Array.from(map.values());
      setMembers(updatedList);

      // Keep currentUser state fresh without nested setState or render loops
      const curr = currentUserRef.current;
      if (curr) {
        const freshMe = updatedList.find((m) => m.id === curr.id);
        if (freshMe) {
          if (curr.role === 'it_admin') {
            freshMe.role = 'it_admin';
            freshMe.approved = true;
            freshMe.status = 'approved';
          }
          if (
            freshMe.role !== curr.role ||
            freshMe.status !== curr.status ||
            freshMe.approved !== curr.approved ||
            freshMe.mealActive !== curr.mealActive
          ) {
            setCurrentUser(freshMe);
          }
        }
      }
    });

    return () => {
      if (unsubUsers) unsubUsers();
    };
  }, []);

  // Operational Subscriptions for Logged In User
  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;

    // 2. Meal Entries Subscription
    let unsubMeals: (() => void) | undefined;
    if (currentUser.role === 'it_admin' || currentUser.role === 'manager') {
      unsubMeals = subscribeToAllMeals((meals) => {
        setMealEntries(meals || []);
      });
    } else {
      unsubMeals = subscribeToUserMeals(currentUser.id, (meals) => {
        setMealEntries(meals || []);
      });
    }

    // 3. Bazar Expenses Subscription (Manager/IT Admin only)
    let unsubBazars: (() => void) | undefined;
    if (currentUser.role === 'it_admin' || currentUser.role === 'manager') {
      unsubBazars = subscribeToBazars((bazarList) => {
        setBazars(bazarList || []);
      });
    } else {
      setBazars([]);
    }

    // 4. Deposits Subscription
    const unsubDeposits = subscribeToDeposits((depList) => {
      if (currentUser.role === 'it_admin' || currentUser.role === 'manager') {
        setDeposits(depList || []);
      } else {
        setDeposits((depList || []).filter((d) => d.memberId === currentUser.id));
      }
    });

    // 5. Fixed Costs Subscription
    let unsubFixed: (() => void) | undefined;
    if (currentUser.role === 'it_admin' || currentUser.role === 'manager') {
      unsubFixed = subscribeToFixedCosts((costs) => {
        setFixedCosts(costs || []);
      });
    }

    // 6. Mess Notices Subscription
    const unsubNotices = subscribeToNotices((noticeList) => {
      setNotices(noticeList || []);
    });

    return () => {
      if (unsubMeals) unsubMeals();
      if (unsubBazars) unsubBazars();
      if (unsubDeposits) unsubDeposits();
      if (unsubFixed) unsubFixed();
      if (unsubNotices) unsubNotices();
    };
  }, [isLoggedIn, currentUser?.id, currentUser?.role]);

  // Sync state changes to storage
  useEffect(() => {
    saveMembers(members);
  }, [members]);

  useEffect(() => {
    saveMealEntries(mealEntries);
  }, [mealEntries]);

  useEffect(() => {
    saveBazars(bazars);
  }, [bazars]);

  useEffect(() => {
    saveDeposits(deposits);
  }, [deposits]);

  useEffect(() => {
    saveFixedCosts(fixedCosts);
  }, [fixedCosts]);

  useEffect(() => {
    saveNotices(notices);
  }, [notices]);

  // Multi-Mess scoping
  const currentMess = useMemo(() => {
    return messes.find((m) => m.id === activeMessId) || messes[0] || DEFAULT_MESS;
  }, [messes, activeMessId]);

  const scopedMembers = useMemo(() => {
    return members.filter((m) => !m.messId || m.messId === activeMessId);
  }, [members, activeMessId]);

  const scopedMeals = useMemo(() => {
    return mealEntries.filter((m) => !m.messId || m.messId === activeMessId);
  }, [mealEntries, activeMessId]);

  const scopedBazars = useMemo(() => {
    return bazars.filter((b) => !b.messId || b.messId === activeMessId);
  }, [bazars, activeMessId]);

  const scopedDeposits = useMemo(() => {
    return deposits.filter((d) => !d.messId || d.messId === activeMessId);
  }, [deposits, activeMessId]);

  const scopedFixedCosts = useMemo(() => {
    return fixedCosts.filter((f) => !f.messId || f.messId === activeMessId);
  }, [fixedCosts, activeMessId]);

  const scopedNotices = useMemo(() => {
    return notices.filter((n) => !n.messId || n.messId === activeMessId);
  }, [notices, activeMessId]);


  // Automated Monthly Financials Calculation based on current mess
  const monthlyCalculations = useMemo(() => {
    return calculateMonthlySummary(
      scopedMembers,
      scopedMeals,
      scopedBazars,
      scopedDeposits,
      scopedFixedCosts,
      selectedMonth
    );
  }, [scopedMembers, scopedMeals, scopedBazars, scopedDeposits, scopedFixedCosts, selectedMonth]);

  // Current user's summary
  const currentUserSummary = useMemo(() => {
    if (!currentUser) return undefined;
    return monthlyCalculations.memberSummaries.find(
      (m) => m.memberId === currentUser.id
    );
  }, [monthlyCalculations, currentUser]);

  const userBalance = currentUserSummary?.balance ?? 0;

  // Mess Switcher Handlers
  const handleSelectMess = (messId: string) => {
    setActiveMessIdState(messId);
    setActiveMessId(messId);
  };

  const handleCreateMess = (name: string, address: string) => {
    const code = `MM-${Math.floor(1000 + Math.random() * 9000)}`;
    const newMess: Mess = {
      id: `mess_${Date.now()}`,
      name,
      code,
      address,
      adminId: currentUser?.id || 'admin',
      createdAt: new Date().toISOString(),
    };
    const nextMesses = [...messes, newMess];
    setMesses(nextMesses);
    saveMesses(nextMesses);
    handleSelectMess(newMess.id);
  };

  const handleJoinMess = (code: string) => {
    const matched = messes.find((m) => m.code.toUpperCase() === code.toUpperCase());
    if (matched) {
      handleSelectMess(matched.id);
      alert(`সফলভাবে ${matched.name}-এ যুক্ত হয়েছেন!`);
    } else {
      const externalMess: Mess = {
        id: `mess_${Date.now()}`,
        name: `মেস (${code})`,
        code,
        adminId: 'external',
        createdAt: new Date().toISOString(),
      };
      const nextMesses = [...messes, externalMess];
      setMesses(nextMesses);
      saveMesses(nextMesses);
      handleSelectMess(externalMess.id);
      alert(`মেস কোড ${code} অনুযায়ী যুক্ত হয়েছেন!`);
    }
  };


  // Master toggle for continuous meal active/stopped state
  const handleToggleUserMealStatus = async (memberId: string, setActive: boolean) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedMembers = members.map((m) => {
      if (m.id === memberId) {
        return {
          ...m,
          mealActive: setActive,
          stoppedSinceDate: setActive ? undefined : todayStr,
        };
      }
      return m;
    });
    setMembers(updatedMembers);

    const target = updatedMembers.find((m) => m.id === memberId);
    if (target) {
      if (currentUser && currentUser.id === memberId) {
        setCurrentUser(target);
      }
      saveUserToFirestore({
        uid: target.id,
        phone: target.phone,
        name: target.name,
        role: target.role,
        status: target.status,
        approved: target.approved,
        room: target.room,
        department: target.department,
        batch: target.batch,
        active: target.active,
        mealActive: target.mealActive,
        stoppedSinceDate: target.stoppedSinceDate,
        avatarColor: target.avatarColor,
        carryOverDue: target.carryOverDue,
      }).catch(console.warn);
    }
  };

  // Handlers for Meal Entry updates
  const handleUpdateMealEntry = (updatedEntry: DayMealEntry) => {
    const entryWithMess = { ...updatedEntry, messId: updatedEntry.messId || activeMessId };
    setMealEntries((prev) => {
      const idx = prev.findIndex(
        (e) => e.date === entryWithMess.date && e.memberId === entryWithMess.memberId
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = entryWithMess;
        return next;
      }
      return [...prev, entryWithMess];
    });
    saveMealEntryToFirestore(entryWithMess).catch(console.warn);
  };

  const handleBatchUpdateMeals = (entriesToUpdate: DayMealEntry[]) => {
    const scopedUpdates = entriesToUpdate.map((e) => ({ ...e, messId: e.messId || activeMessId }));
    setMealEntries((prev) => {
      const next = [...prev];
      scopedUpdates.forEach((up) => {
        const idx = next.findIndex(
          (e) => e.date === up.date && e.memberId === up.memberId
        );
        if (idx >= 0) {
          next[idx] = up;
        } else {
          next.push(up);
        }
      });
      return next;
    });
    batchSaveMealEntriesToFirestore(scopedUpdates).catch(console.warn);
  };

  // Handlers for Bazar
  const handleAddBazar = (newBazar: BazarExpense) => {
    const bazarWithMess = { ...newBazar, messId: activeMessId };
    setBazars((prev) => [bazarWithMess, ...prev]);
    saveBazarToFirestore(bazarWithMess).catch(console.warn);
  };

  const handleDeleteBazar = (id: string) => {
    setBazars((prev) => prev.filter((b) => b.id !== id));
    deleteBazarFromFirestore(id).catch(console.warn);
  };

  // Handlers for Deposit
  const handleAddDeposit = (newDeposit: Deposit) => {
    const depWithMess = { ...newDeposit, messId: activeMessId };
    setDeposits((prev) => [depWithMess, ...prev]);
    saveDepositToFirestore(depWithMess).catch(console.warn);
  };

  const handleDeleteDeposit = (id: string) => {
    setDeposits((prev) => prev.filter((d) => d.id !== id));
    deleteDepositFromFirestore(id).catch(console.warn);
  };

  // Handlers for Notices
  const handleAddNotice = (newNotice: MessNotice) => {
    const noticeWithMess = { ...newNotice, messId: activeMessId };
    setNotices((prev) => [noticeWithMess, ...prev]);
    saveNoticeToFirestore(noticeWithMess).catch(console.warn);
  };

  const handleDeleteNotice = (id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
    deleteNoticeFromFirestore(id).catch(console.warn);
  };

  // Handlers for Members
  const handleAddMember = (newMem: Member) => {
    const memWithMess = { ...newMem, messId: activeMessId };
    setMembers((prev) => [...prev, memWithMess]);
    const userDocData: FirestoreUserDoc = {
      uid: memWithMess.id,
      phone: memWithMess.phone,
      name: memWithMess.name,
      username: memWithMess.username,
      password: memWithMess.password,
      role: memWithMess.role,
      status: memWithMess.status,
      approved: memWithMess.approved,
      room: memWithMess.room,
      department: memWithMess.department,
      batch: memWithMess.batch,
      photoUrl: memWithMess.photoUrl,
      active: memWithMess.active,
      mealActive: memWithMess.mealActive,
      avatarColor: memWithMess.avatarColor,
      carryOverDue: memWithMess.carryOverDue || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    initUserDatabase(memWithMess.id, userDocData).catch(console.warn);
    saveUserToFirestore(userDocData).catch(console.warn);
  };

  const handleUpdateMember = (updatedMem: Member) => {
    const memWithMess = { ...updatedMem, messId: updatedMem.messId || activeMessId };
    setMembers((prev) => prev.map((m) => (m.id === memWithMess.id ? memWithMess : m)));
    if (currentUser && currentUser.id === memWithMess.id) {
      setCurrentUser(memWithMess);
    }
    saveUserToFirestore({
      uid: memWithMess.id,
      phone: memWithMess.phone,
      name: memWithMess.name,
      username: memWithMess.username,
      password: memWithMess.password,
      role: memWithMess.role,
      status: memWithMess.status,
      approved: memWithMess.approved,
      room: memWithMess.room,
      department: memWithMess.department,
      batch: memWithMess.batch,
      photoUrl: memWithMess.photoUrl,
      active: memWithMess.active,
      mealActive: memWithMess.mealActive,
      avatarColor: memWithMess.avatarColor,
      carryOverDue: memWithMess.carryOverDue || 0,
    }).catch(console.warn);
  };

  // Month-end calculation handler
  const handleMonthEndCalculated = (updates: { memberId: string; carryOverDue: number }[]) => {
    setMembers((prev) =>
      prev.map((m) => {
        const u = updates.find((item) => item.memberId === m.id);
        if (u) {
          return { ...m, carryOverDue: u.carryOverDue };
        }
        return m;
      })
    );
  };

  const handleResetData = () => {
    resetAllData();
    window.location.reload();
  };

  // Handler for Successful Login
  const handleLoginSuccess = (user: Member) => {
    // If logging in as Shovan Bhadra / 01700801665 or if no other approved IT Admin exists
    const cleanP = (user.phone || '').replace(/[\s-+]/g, '');
    const isOwner =
      cleanP.endsWith('01700801665') ||
      (user.username || '').toLowerCase() === 'shovan' ||
      user.name.toLowerCase().includes('shovan');

    let effectiveUser = user;
    if (isOwner || !members.some((m) => m.role === 'it_admin' && m.id !== user.id && m.approved)) {
      effectiveUser = {
        ...user,
        role: 'it_admin',
        approved: true,
        status: 'approved',
        avatarColor: 'bg-amber-600',
      };
      // Persist in background to Firestore
      updateUserInFirestore(effectiveUser.id, {
        role: 'it_admin',
        approved: true,
        status: 'approved',
        avatarColor: 'bg-amber-600',
      });
    }

    setMembers((prev) => {
      const idx = prev.findIndex((m) => m.id === effectiveUser.id || m.phone === effectiveUser.phone);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...effectiveUser };
        return next;
      }
      return [...prev, effectiveUser];
    });

    setCurrentUser(effectiveUser);
    setIsLoggedIn(true);

    if (effectiveUser.role === 'it_admin' || effectiveUser.role === 'manager') {
      setPortalMode('manager');
    } else {
      setPortalMode('user');
    }
  };

  const handleLogout = async () => {
    await logoutFirebaseUser();
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  // -------------------------------------------------------------------------
  // GATE 1: Strictly show only LoginScreen if unauthenticated
  // -------------------------------------------------------------------------
  if (!isLoggedIn || !currentUser) {
    return (
      <LoginScreen
        members={members}
        messes={messes}
        activeMessId={activeMessId}
        onLoginSuccess={handleLoginSuccess}
        onAddMember={handleAddMember}
        onUpdateMember={handleUpdateMember}
        onCreateMess={handleCreateMess}
      />
    );
  }

  // -------------------------------------------------------------------------
  // GATE 2: DEACTIVATED / REJECTED ACCOUNT NOTICE
  // Only explicitly rejected accounts are restricted from the dashboard
  // -------------------------------------------------------------------------
  if (currentUser.status === 'rejected') {
    return (
      <>
        <WaitingApprovalScreen
          currentUser={currentUser}
          onRefreshUser={(fresh) => {
            setCurrentUser(fresh);
            setMembers((prev) => prev.map((m) => (m.id === fresh.id ? fresh : m)));
            if (fresh.role === 'it_admin' || fresh.role === 'manager') {
              setPortalMode('manager');
            } else {
              setPortalMode('user');
            }
          }}
          onOpenEditProfile={() => setIsProfileEditOpen(true)}
          onLogout={handleLogout}
        />

        <ProfileEditModal
          currentUser={currentUser}
          isOpen={isProfileEditOpen}
          onClose={() => setIsProfileEditOpen(false)}
          onSave={handleUpdateMember}
        />
      </>
    );
  }

  // -------------------------------------------------------------------------
  // MAIN APP DASHBOARD (Approved Users)
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* PWA Mobile In-App Install Banner */}
      <PWAInstallBanner />

      {/* Profile Edit Modal */}
      <ProfileEditModal
        currentUser={currentUser}
        isOpen={isProfileEditOpen}
        onClose={() => setIsProfileEditOpen(false)}
        onSave={handleUpdateMember}
      />

      {/* Top Header with Multi-Role Isolation */}
      <Header
        members={members}
        currentUser={currentUser}
        currentMess={currentMess}
        onOpenMessSwitcher={() => setIsMessSwitcherOpen(true)}
        onSelectUser={(u) => {
          if (currentUser.role === 'it_admin') {
            setCurrentUser(u);
            if (u.role === 'it_admin' || u.role === 'manager') {
              setPortalMode('manager');
            } else {
              setPortalMode('user');
            }
          }
        }}
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
        userBalance={userBalance}
        currentMealRate={monthlyCalculations.mealRate}
        onResetData={handleResetData}
        portalMode={portalMode}
        onSelectPortalMode={(mode) => {
          if (mode === 'manager' && currentUser.role === 'user') {
            setPortalMode('user');
          } else {
            setPortalMode(mode);
          }
        }}
        onOpenPhoneAuth={() => setIsAuthModalOpen(true)}
        onOpenEditProfile={() => setIsProfileEditOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-28 md:pb-8">
        
        {/* PORTAL 1: USER / BOARDER DASHBOARD */}
        {portalMode === 'user' && (
          <UserPortal
            currentUser={currentUser}
            members={scopedMembers}
            mealEntries={scopedMeals}
            deposits={scopedDeposits}
            notices={scopedNotices}
            currentUserSummary={currentUserSummary}
            selectedMonth={selectedMonth}
            mealRate={monthlyCalculations.mealRate}
            onToggleUserMealStatus={handleToggleUserMealStatus}
            onUpdateMealEntry={handleUpdateMealEntry}
            onBatchUpdateMeals={handleBatchUpdateMeals}
            onAddNotice={handleAddNotice}
            onDeleteNotice={handleDeleteNotice}
            onOpenStatementModal={() => setIsStatementModalOpen(true)}
            activeTab={userTab}
            onSelectTab={setUserTab}
          />
        )}

        {/* PORTAL 2: ADMIN / MANAGER DASHBOARD */}
        {portalMode === 'manager' && (currentUser.role === 'it_admin' || currentUser.role === 'manager') && (
          <ManagerPortal
            currentUser={currentUser}
            currentMess={currentMess}
            members={scopedMembers}
            mealEntries={scopedMeals}
            bazars={scopedBazars}
            deposits={scopedDeposits}
            fixedCosts={scopedFixedCosts}
            notices={scopedNotices}
            memberSummaries={monthlyCalculations.memberSummaries}
            totalMeals={monthlyCalculations.totalMeals}
            totalBazarCost={monthlyCalculations.totalBazarCost}
            totalFixedCost={monthlyCalculations.totalFixedCost}
            mealRate={monthlyCalculations.mealRate}
            totalDeposited={monthlyCalculations.totalDeposited}
            totalCostOverall={monthlyCalculations.totalCostOverall}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            onUpdateMealEntry={handleUpdateMealEntry}
            onAddBazar={handleAddBazar}
            onDeleteBazar={handleDeleteBazar}
            onAddDeposit={handleAddDeposit}
            onDeleteDeposit={handleDeleteDeposit}
            onAddNotice={handleAddNotice}
            onDeleteNotice={handleDeleteNotice}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onMonthEndCalculated={handleMonthEndCalculated}
            onOpenStatementModal={() => setIsStatementModalOpen(true)}
            activeTab={managerTab}
            onSelectTab={setManagerTab}
          />
        )}

      </main>

      {/* Offline Mode Floating Indicator */}
      {!isOnline && (
        <div className="fixed bottom-20 left-4 z-50 flex items-center gap-2 bg-amber-600/95 text-white px-3.5 py-2 rounded-2xl text-xs font-semibold shadow-2xl border border-amber-400 animate-in fade-in">
          <WifiOff className="w-4 h-4" />
          <span>অফলাইন মোড — ক্যাশ ডাটা সংরক্ষিত</span>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        portalMode={portalMode}
        userRole={currentUser.role}
        onSelectPortalMode={setPortalMode}
        activeUserTab={userTab}
        onSelectUserTab={setUserTab}
        activeManagerTab={managerTab}
        onSelectManagerTab={setManagerTab}
        unreadNoticesCount={notices.length}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-5 text-center text-xs text-slate-500 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">MealMaster Dining</span>
            <span>•</span>
            <span>৫০০ বোর্ডার উপযোগী মাল্টি-রোল ও অ্যান্টি-থেফট সিস্টেম</span>
          </div>
          <div className="text-slate-400">
            লগইন:{' '}
            <strong className={currentUser.role === 'it_admin' ? 'text-amber-400' : currentUser.role === 'manager' ? 'text-indigo-400' : 'text-emerald-400'}>
              {currentUser.name} ({currentUser.role === 'it_admin' ? 'IT Admin' : currentUser.role === 'manager' ? 'Manager' : 'User'})
            </strong>
          </div>
        </div>
      </footer>

      {/* Multi-Mess Switcher Modal */}
      <MessSwitcherModal
        isOpen={isMessSwitcherOpen}
        onClose={() => setIsMessSwitcherOpen(false)}
        messes={messes}
        activeMessId={activeMessId}
        onSelectMess={handleSelectMess}
        onCreateMess={handleCreateMess}
        onJoinMess={handleJoinMess}
        currentUser={currentUser}
      />

      {/* Certified Monthly Statement Modal (PDF & Excel Export) */}
      <MonthlyStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        mess={currentMess}
        month={selectedMonth}
        totalMeals={monthlyCalculations.totalMeals}
        totalBazarCost={monthlyCalculations.totalBazarCost}
        totalFixedCost={monthlyCalculations.totalFixedCost}
        mealRate={monthlyCalculations.mealRate}
        summaries={monthlyCalculations.memberSummaries}
      />

    </div>
  );
}
