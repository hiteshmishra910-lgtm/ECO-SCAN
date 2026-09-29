import React, { useState } from 'react';
import { Leaf, LogOut, ShieldCheck, Truck, Home, UserCheck, Smartphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from './NotificationBell';
import { AndroidExportModal } from './AndroidExportModal';
import { UserRole } from '../../types';

export const Header: React.FC = () => {
  const { user, logout, switchDemoRole } = useAuth();
  const [showAndroidModal, setShowAndroidModal] = useState(false);

  if (!user) return null;

  const roleBadgeConfig = {
    RESIDENT: {
      bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: <Home className="w-3.5 h-3.5" />,
      label: 'Resident',
    },
    COLLECTOR: {
      bg: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: <Truck className="w-3.5 h-3.5" />,
      label: 'Collector',
    },
    ADMIN: {
      bg: 'bg-purple-100 text-purple-800 border-purple-300',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      label: 'Admin',
    },
  };

  const currentRole = roleBadgeConfig[user.role] || roleBadgeConfig.RESIDENT;

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-600/30">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-emerald-950 text-base sm:text-lg">
                ECO<span className="text-emerald-600">SCAN</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100/70 text-emerald-800 hidden sm:inline-block">
                SMART WASTE
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-none hidden xs:block">
              Intelligent Segregation & Tracking
            </p>
          </div>
        </div>

        {/* Center / Role Switcher for seamless review */}
        <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl text-xs font-medium">
          <span className="text-[10px] text-slate-400 font-bold px-1 hidden md:inline">
            ROLE:
          </span>
          {(['RESIDENT', 'COLLECTOR', 'ADMIN'] as UserRole[]).map((r) => {
            const active = user.role === r;
            return (
              <button
                key={r}
                onClick={() => switchDemoRole(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-white'
                }`}
                title={`Switch view to ${r}`}
              >
                {r === 'RESIDENT' ? 'Resident' : r === 'COLLECTOR' ? 'Collector' : 'Admin'}
              </button>
            );
          })}
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-2">
          {/* Android APK Button */}
          <button
            onClick={() => setShowAndroidModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
            title="Download Native Android Studio (Kotlin + Jetpack Compose) Project"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden sm:inline">Android APK</span>
            <span className="sm:hidden">APK</span>
          </button>

          {/* Notifications */}
          <NotificationBell userId={user.id} />

          {/* User Profile Pill */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs border border-emerald-200">
              {user.name.charAt(0)}
            </div>
            <div className="text-left text-xs">
              <div className="font-bold text-slate-800 truncate max-w-[110px]">{user.name}</div>
              <div className="text-[10px] text-slate-500 truncate max-w-[110px]">{user.email}</div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AndroidExportModal
        isOpen={showAndroidModal}
        onClose={() => setShowAndroidModal(false)}
      />
    </header>
  );
};
