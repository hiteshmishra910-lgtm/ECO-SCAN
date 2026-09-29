import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { Header } from './components/common/Header';
import { ResidentView } from './components/resident/ResidentView';
import { CollectorView } from './components/collector/CollectorView';
import { AdminView } from './components/admin/AdminView';
import { Leaf, Loader2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4FFF8] flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00A86B] to-emerald-400 flex items-center justify-center text-white shadow-xl shadow-emerald-600/30 animate-pulse">
          <Leaf className="w-8 h-8" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-base font-extrabold text-[#064E3B] tracking-tight">ECOSCAN</h2>
          <p className="text-xs text-slate-500 font-medium">Smart Waste Management Platform</p>
        </div>
        <Loader2 className="w-5 h-5 text-[#00A86B] animate-spin mt-2" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-[#F4FFF8] flex flex-col">
      <Header />
      <div className="flex-1">
        {user.role === 'RESIDENT' && <ResidentView />}
        {user.role === 'COLLECTOR' && <CollectorView />}
        {user.role === 'ADMIN' && <AdminView />}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
