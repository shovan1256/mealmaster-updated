import React, { useState } from 'react';
import { Member } from '../types';
import {
  X,
  User,
  Building,
  GraduationCap,
  Home,
  Phone,
  Camera,
  Check,
  Palette,
} from 'lucide-react';

interface ProfileEditModalProps {
  currentUser: Member;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedUser: Member) => void;
}

const AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-indigo-600',
  'bg-blue-600',
  'bg-teal-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-purple-600',
  'bg-cyan-600',
];

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(currentUser.name || '');
  const [department, setDepartment] = useState(currentUser.department || '');
  const [batch, setBatch] = useState(currentUser.batch || '');
  const [room, setRoom] = useState(currentUser.room || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [photoUrl, setPhotoUrl] = useState(currentUser.photoUrl || '');
  const [avatarColor, setAvatarColor] = useState(currentUser.avatarColor || 'bg-indigo-600');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('নাম দেওয়া আবশ্যক');
      return;
    }

    setSaving(true);
    const updated: Member = {
      ...currentUser,
      name: name.trim(),
      department: department.trim(),
      batch: batch.trim(),
      room: room.trim() || '101',
      phone: phone.trim(),
      photoUrl: photoUrl.trim(),
      avatarColor,
    };

    onSave(updated);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">প্রোফাইল আপডেট করুন</h3>
              <p className="text-[11px] text-slate-400">নাম, বিভাগ, ব্যাচ ও ছবি পরিবর্তন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Avatar Color / Photo URL Preview */}
          <div className="flex items-center gap-4 bg-slate-950 p-3.5 rounded-2xl border border-slate-850">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Profile"
                className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow"
                onError={() => setPhotoUrl('')}
              />
            ) : (
              <div
                className={`w-14 h-14 rounded-2xl ${avatarColor} text-white flex items-center justify-center text-xl font-black shadow`}
              >
                {name.charAt(0) || 'U'}
              </div>
            )}

            <div className="flex-1">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                প্রোফাইল থিম ও ব্যাকগ্রাউন্ড কালার
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AVATAR_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setAvatarColor(col)}
                    className={`w-6 h-6 rounded-lg ${col} transition cursor-pointer flex items-center justify-center ${
                      avatarColor === col ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    {avatarColor === col && <Check className="w-3 h-3 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Photo URL Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              প্রোফাইল ছবির লিংক (Photo URL - ঐচ্ছিক)
            </label>
            <div className="relative">
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <Camera className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              পুরো নাম (Full Name) *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="আপনার নাম"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Dept & Batch */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                বিভাগ (Department)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="যেমন: CSE, EEE"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <Building className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ব্যাচ (Batch Number)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  placeholder="যেমন: 20th Batch"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <GraduationCap className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Room & Phone */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                রুম / সিট নং (Room No.)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="যেমন: 302"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <Home className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                মোবাইল নম্বর
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01712-345678"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>সংরক্ষণ করুন (Save Profile)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
