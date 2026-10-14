import React, { useState, useEffect } from 'react';
import { Member, Role, UserStatus, MessNotice, DayMealEntry } from '../types';
import {
  Users,
  Plus,
  Phone,
  DoorClosed,
  ShieldCheck,
  UserCheck,
  UserX,
  X,
  Edit2,
  CheckCircle2,
  Clock,
  Shield,
  Briefcase,
  GraduationCap,
  Building,
  AlertCircle,
  Megaphone,
  Trash2,
  Send,
} from 'lucide-react';
import {
  updateUserApprovalStatus,
  updateUserRole,
  saveNoticeToFirestore,
  deleteNoticeFromFirestore,
} from '../services/firestoreService';

interface MembersManagerProps {
  members: Member[];
  onAddMember: (member: Member) => void;
  onUpdateMember: (member: Member) => void;
  currentUser: Member;
  notices?: MessNotice[];
  onAddNotice?: (notice: MessNotice) => void;
  onDeleteNotice?: (id: string) => void;
  mealEntries?: DayMealEntry[];
}

export const MembersManager: React.FC<MembersManagerProps> = ({
  members,
  onAddMember,
  onUpdateMember,
  currentUser,
  notices,
  onAddNotice,
  onDeleteNotice,
  mealEntries,
}) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'pending'>('directory');
  const [roleFilter, setRoleFilter] = useState<'all' | 'it_admin' | 'manager' | 'user'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRoom, setFormRoom] = useState('');
  const [formDepartment, setFormDepartment] = useState('CSE');
  const [formBatch, setFormBatch] = useState('2026');
  const [formRole, setFormRole] = useState<Role>('user');

  const isITAdmin = currentUser.role === 'it_admin';

  // Visible Notice Section State
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeText, setNoticeText] = useState('');
  const [isFeastDropdown, setIsFeastDropdown] = useState(false);
  const [feastChoices, setFeastChoices] = useState('');
  const [noticeDeadline, setNoticeDeadline] = useState('22:00');
  const [noticeToast, setNoticeToast] = useState<string | null>(null);
  const [isPublishingNotice, setIsPublishingNotice] = useState(false);

  // Local state for notices to update UI instantly upon add/delete
  const [localNotices, setLocalNotices] = useState<MessNotice[]>(notices || []);

  useEffect(() => {
    if (notices) {
      setLocalNotices(notices);
    }
  }, [notices]);

  // Notice feast choices live tally helper
  const getNoticeTally = (notice: MessNotice) => {
    if (!notice.enableMealChoice || !mealEntries) return {};
    const counts: Record<string, number> = {};
    mealEntries
      .filter((e) => (notice.date ? e.date === notice.date : true) && e.mealOn && e.customMealChoice)
      .forEach((e) => {
        const choice = e.customMealChoice!.trim();
        counts[choice] = (counts[choice] || 0) + 1;
      });
    return counts;
  };

  const handlePublishNotice = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!noticeTitle.trim() || !noticeText.trim()) {
      alert('নোটিশের শিরোনাম এবং বিস্তারিত বার্তা লিখুন');
      return;
    }

    const choices = isFeastDropdown
      ? feastChoices
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean)
      : undefined;

    setIsPublishingNotice(true);
    const newNotice: MessNotice = {
      id: `notice-${Date.now()}`,
      messId: currentUser.messId,
      date: new Date().toISOString().split('T')[0],
      title: noticeTitle.trim(),
      content: noticeText.trim(),
      author: `${currentUser.name} (${currentUser.role === 'it_admin' ? 'IT Admin' : currentUser.role === 'manager' ? 'Manager' : 'User'})`,
      priority: 'important',
      enableMealChoice: isFeastDropdown,
      mealChoices: choices && choices.length > 0 ? choices : undefined,
      deadline: isFeastDropdown && noticeDeadline.trim() ? noticeDeadline.trim() : undefined,
    };

    try {
      setLocalNotices((prev) => [newNotice, ...prev]);
      if (onAddNotice) {
        onAddNotice(newNotice);
      }
      await saveNoticeToFirestore(newNotice);

      setNoticeTitle('');
      setNoticeText('');
      setIsFeastDropdown(false);
      setFeastChoices('');
      setNoticeDeadline('22:00');
      setNoticeToast('নোটিশ সফলভাবে প্রকাশ করা হয়েছে!');
      setTimeout(() => setNoticeToast(null), 3500);
    } catch (err) {
      console.error('Error publishing notice:', err);
    } finally {
      setIsPublishingNotice(false);
    }
  };

  // Delete notice handler with immediate local state filtering & Firestore deletion
  const handleDeleteNotice = async (noticeId: string, noticeTitle: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const confirmed = window.confirm(
      `আপনি কি নিশ্চিত যে "${noticeTitle}" নোটিশটি মুছে ফেলতে চান?`
    );
    if (!confirmed) return;

    // Immediately filter out the deleted notice from local state so the UI updates instantly
    setLocalNotices((prev) => prev.filter((n) => n.id !== noticeId));

    if (onDeleteNotice) {
      onDeleteNotice(noticeId);
    }

    try {
      await deleteNoticeFromFirestore(noticeId);
      setNoticeToast('নোটিশ সফলভাবে মুছে ফেলা হয়েছে!');
      setTimeout(() => setNoticeToast(null), 3000);
    } catch (err) {
      console.error('Firestore notice deletion error:', err);
      alert('নোটিশ মুছে ফেলতে সমস্যা হয়েছে, আবার চেষ্টা করুন।');
    }
  };

  // Pending users count
  const pendingMembers = members.filter((m) => !m.approved || m.status === 'pending');
  const approvedMembers = members.filter((m) => m.approved && m.status === 'approved');

  // Approve member handler
  const handleApprove = async (member: Member) => {
    const updated: Member = {
      ...member,
      approved: true,
      status: 'approved',
    };
    onUpdateMember(updated);
    await updateUserApprovalStatus(member.id, true, 'approved');
  };

  // Reject member handler
  const handleReject = async (member: Member) => {
    if (!confirm(`'${member.name}'-এর আবেদনটি বাতিল করতে চান?`)) return;
    const updated: Member = {
      ...member,
      approved: false,
      status: 'rejected',
    };
    onUpdateMember(updated);
    await updateUserApprovalStatus(member.id, false, 'rejected');
  };

  // Role Change Handler (Permanent IT Admin privilege)
  const handleChangeRole = async (member: Member, newRole: Role) => {
    if (!isITAdmin) {
      alert('রোল পরিবর্তন করার বিশেষ অধিকার শুধুমাত্র IT Admin-এর রয়েছে।');
      return;
    }
    const updated: Member = {
      ...member,
      role: newRole,
      avatarColor:
        newRole === 'it_admin'
          ? 'bg-amber-600'
          : newRole === 'manager'
          ? 'bg-indigo-600'
          : 'bg-emerald-600',
    };
    onUpdateMember(updated);
    await updateUserRole(member.id, newRole);
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formRoom) {
      alert('সদস্যের নাম ও রুম নম্বর দিন');
      return;
    }

    const newMem: Member = {
      id: `m-${Date.now()}`,
      name: formName,
      phone: formPhone || '01700-000000',
      room: formRoom,
      department: formDepartment,
      batch: formBatch,
      role: formRole,
      status: 'approved',
      approved: true,
      avatarColor: formRole === 'it_admin' ? 'bg-amber-600' : formRole === 'manager' ? 'bg-indigo-600' : 'bg-emerald-600',
      active: true,
      mealActive: true,
      carryOverDue: 0,
      joinDate: new Date().toISOString().split('T')[0],
    };

    onAddMember(newMem);
    setIsAddModalOpen(false);
    setFormName('');
    setFormPhone('');
    setFormRoom('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    onUpdateMember(editingMember);
    setEditingMember(null);
  };

  // Filter approved members
  const displayedApprovedMembers = approvedMembers.filter((m) => {
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      m.name.toLowerCase().includes(q) ||
      m.room.toLowerCase().includes(q) ||
      (m.department && m.department.toLowerCase().includes(q)) ||
      (m.batch && m.batch.toLowerCase().includes(q)) ||
      m.phone.includes(q);
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              মেসের সদস্য ও রোল ম্যানেজমেন্ট (Directory & Roles)
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              মোট: {members.length} জন
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            আইটি এডমিন, ম্যানেজার ও বোর্ডারদের প্রোফাইল ও অনুমোদন নিয়ন্ত্রণ
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 transition cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          নতুন সদস্য যুক্ত করুন
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* VISIBLE NOTICE & FEAST CONTROL SECTION                        */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Megaphone className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>নোটিশ ও ভোজ কন্ট্রোল (Notice & Feast Announcement)</span>
              </h3>
              <p className="text-xs text-slate-400">
                সদস্যদের জন্য নতুন নোটিশ প্রকাশ করুন বা সক্রিয় নোটিশ পরিচালনা করুন
              </p>
            </div>
          </div>

          {localNotices.length > 0 && (
            <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 self-start sm:self-auto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{localNotices.length}টি নোটিশ রয়েছে</span>
            </span>
          )}
        </div>

        {noticeToast && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{noticeToast}</span>
          </div>
        )}

        {/* Notice List: Display All Notices with individual delete buttons */}
        {localNotices.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>প্রকাশিত সকল নোটিশ ({localNotices.length})</span>
            </h4>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {localNotices.map((notice) => {
                const tally = getNoticeTally(notice);
                return (
                  <div
                    key={notice.id}
                    className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-xs space-y-2 hover:border-slate-700/80 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-amber-300 text-sm">📢 {notice.title}</span>
                          {notice.enableMealChoice && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                              বিশেষ ভোজ (Feast)
                            </span>
                          )}
                          {notice.deadline && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              সময়সীমা: {notice.deadline}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {notice.date} {notice.author ? `• ${notice.author}` : ''}
                        </div>
                      </div>

                      {/* Red Trash2 (🗑️) icon button on the right side - only trash icon, no text */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleDeleteNotice(notice.id, notice.title, e);
                        }}
                        className="p-2 rounded-xl text-rose-500 hover:text-white hover:bg-rose-600 active:scale-95 transition cursor-pointer shrink-0 border border-rose-500/20 hover:border-rose-600"
                        title="নোটিশ মুছে ফেলুন"
                        aria-label="Delete notice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{notice.content}</p>

                    {notice.enableMealChoice && (
                      <div className="pt-2 border-t border-slate-800 space-y-1.5">
                        {notice.mealChoices && notice.mealChoices.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-amber-400 font-semibold text-[11px]">ভোজ মেনু অপশন:</span>
                            {notice.mealChoices.map((choice, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30 text-[10px] font-medium"
                              >
                                {choice}
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Live Count Summary Tally */}
                        {Object.keys(tally).length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            <span className="text-emerald-400 font-bold text-[11px]">ভোজ লাইভ কাউন্ট সামারি:</span>
                            {Object.entries(tally).map(([choice, count]) => (
                              <span
                                key={choice}
                                className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black"
                              >
                                {choice}: {count} জন
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] block">(এখনো কোনো ভোট পড়েনি)</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl p-4 text-center text-xs text-slate-500">
            কোনো নোটিশ নেই
          </div>
        )}

        {/* Form: Inputs for Notice Title and Text */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              নোটিশের শিরোনাম (Notice Title) *
            </label>
            <input
              type="text"
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
              placeholder="যেমন: শুক্রবারের বিশেষ ভোজ ও ডাইনিং পরিবেশন"
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              নোটিশের বিস্তারিত বার্তা (Notice Text) *
            </label>
            <textarea
              rows={3}
              value={noticeText}
              onChange={(e) => setNoticeText(e.target.value)}
              placeholder="নোটিশের বিস্তারিত বার্তা লিখুন..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition resize-none"
            />
          </div>

          {/* Checkbox "Feast Dropdown" -> if checked, show input for choices and deadline */}
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-200 select-none">
              <input
                type="checkbox"
                checked={isFeastDropdown}
                onChange={(e) => setIsFeastDropdown(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 cursor-pointer"
              />
              <span>Feast Dropdown (ভোজ মিল চয়েস ড্রপডাউন সক্রিয় করুন)</span>
            </label>

            {isFeastDropdown && (
              <div className="pt-1 animate-in fade-in grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-amber-300">
                    মেনু পছন্দসমূহ (কমা দিয়ে লিখুন, যেমন: Beef, Mutton):
                  </label>
                  <input
                    type="text"
                    value={feastChoices}
                    onChange={(e) => setFeastChoices(e.target.value)}
                    placeholder="যেমন: Beef, Mutton"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-amber-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>ডেডলাইন / সময়সীমা (Deadline):</span>
                  </label>
                  <input
                    type="time"
                    value={noticeDeadline}
                    onChange={(e) => setNoticeDeadline(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Buttons: "Publish" */}
          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => handlePublishNotice()}
              disabled={isPublishingNotice || !noticeTitle.trim() || !noticeText.trim()}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-900/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isPublishingNotice ? 'প্রকাশ হচ্ছে...' : 'Publish'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation: Directory vs Pending Approvals */}
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'directory'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>সদস্য তালিকা ({approvedMembers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer relative ${
            activeTab === 'pending'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>ম্যানেজার অনুমোদনের অপেক্ষায় (Pending)</span>
          {pendingMembers.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
              {pendingMembers.length}
            </span>
          )}
        </button>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* TAB 1: PENDING APPROVALS LIST                                     */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'pending' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>অনুমোদন প্রত্যাশী নতুন রেজিস্ট্রেশনসমূহ ({pendingMembers.length} জন)</span>
            </h3>
            <span className="text-xs text-slate-400">
              ম্যানেজার বা IT Admin অনুমোদন দিলে ড্যাশবোর্ড চালু হবে
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {pendingMembers.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <span>কোনো অপেক্ষমাণ অনুমোদন নেই! সকল সদস্যের অ্যাকাউন্ট সক্রিয়।</span>
              </div>
            ) : (
              pendingMembers.map((m) => (
                <div
                  key={m.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-850/50 transition"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl ${
                        m.avatarColor || 'bg-slate-700'
                      } text-white flex items-center justify-center font-bold text-sm shadow`}
                    >
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        <span>{m.name}</span>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-semibold">
                          অপেক্ষমাণ (Pending)
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                        <span>মোবাইল: {m.phone || m.username}</span>
                        <span>• রুম: {m.room}</span>
                        {m.department && <span>• বিভাগ: {m.department}</span>}
                        {m.batch && <span>• ব্যাচ: {m.batch}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleReject(m)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-rose-300 border border-slate-700 text-xs font-bold transition cursor-pointer"
                    >
                      বাতিল (Reject)
                    </button>
                    <button
                      onClick={() => handleApprove(m)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-700/20 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>অনুমোদন করুন (Approve)</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* TAB 2: ACTIVE MEMBERS DIRECTORY WITH MULTI-ROLE SWITCHER          */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
            {/* Role Filter Buttons */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none">
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  roleFilter === 'all'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                সবাই ({approvedMembers.length})
              </button>
              <button
                onClick={() => setRoleFilter('it_admin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  roleFilter === 'it_admin'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                👑 IT Admin
              </button>
              <button
                onClick={() => setRoleFilter('manager')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  roleFilter === 'manager'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                💼 ম্যানেজার
              </button>
              <button
                onClick={() => setRoleFilter('user')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  roleFilter === 'user'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                👤 বোর্ডার (User)
              </button>
            </div>

            {/* Search Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="নাম, রুম, বিভাগ বা ব্যাচ খুঁজুন..."
              className="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedApprovedMembers.map((m) => {
              const isMe = m.id === currentUser.id;

              return (
                <div
                  key={m.id}
                  className={`rounded-2xl border p-4.5 bg-slate-900 flex flex-col justify-between transition ${
                    isMe
                      ? 'border-emerald-500/50 ring-1 ring-emerald-500/20'
                      : m.role === 'it_admin'
                      ? 'border-amber-500/40'
                      : m.role === 'manager'
                      ? 'border-indigo-500/40'
                      : 'border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl ${m.avatarColor} text-white flex items-center justify-center font-bold text-xs shadow`}
                        >
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-1.5">
                            <span>{m.name}</span>
                            {isMe && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-medium">
                                আপনি
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            রুম {m.room} • {m.department || 'General'}
                          </span>
                        </div>
                      </div>

                      {/* Current Role Badge */}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          m.role === 'it_admin'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : m.role === 'manager'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {m.role === 'it_admin'
                          ? '👑 IT Admin'
                          : m.role === 'manager'
                          ? '💼 Manager'
                          : '👤 User'}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">ফোন:</span>
                        <span className="font-mono">{m.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">ব্যাচ:</span>
                        <span>{m.batch || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">মিল স্ট্যাটাস:</span>
                        <span className={m.mealActive ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
                          {m.mealActive ? 'চালু (Active)' : 'বন্ধ (OFF)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* IT ADMIN EXCLUSIVE: ROLE CHANGER */}
                  {isITAdmin && (
                    <div className="mt-3.5 pt-3 border-t border-slate-800">
                      <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                        রোল পরিবর্তন (IT Admin Only):
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => handleChangeRole(m, 'user')}
                          className={`py-1 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                            m.role === 'user'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-950 text-slate-400 hover:text-white'
                          }`}
                        >
                          User
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChangeRole(m, 'manager')}
                          className={`py-1 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                            m.role === 'manager'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-950 text-slate-400 hover:text-white'
                          }`}
                        >
                          Manager
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChangeRole(m, 'it_admin')}
                          className={`py-1 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                            m.role === 'it_admin'
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-950 text-slate-400 hover:text-white'
                          }`}
                        >
                          IT Admin
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">নতুন সদস্য যুক্ত করুন</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  পুরো নাম *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="নাম"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="01712345678"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    রুম নং *
                  </label>
                  <input
                    type="text"
                    required
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    placeholder="301"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    বিভাগ (Department)
                  </label>
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
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
                    value={formBatch}
                    onChange={(e) => setFormBatch(e.target.value)}
                    placeholder="2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  রোল (Role)
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as Role)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="user">বোর্ডার (User)</option>
                  <option value="manager">মেস ম্যানেজার (Manager)</option>
                  <option value="it_admin">আইটি এডমিন (IT Admin)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
