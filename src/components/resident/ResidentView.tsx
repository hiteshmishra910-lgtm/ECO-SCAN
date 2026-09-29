import React, { useState, useEffect } from 'react';
import {
  Home,
  Camera,
  AlertTriangle,
  History,
  User,
  Recycle,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  Truck,
  Leaf,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { WasteScan, GarbageReport } from '../../types';
import { WasteScanner } from './WasteScanner';
import { MyHouseView } from './MyHouseView';
import { GarbageReportModal } from './GarbageReportModal';

export const ResidentView: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'home' | 'house' | 'scanner' | 'reports' | 'history' | 'profile'>('home');
  const [showReportModal, setShowReportModal] = useState(false);
  const [scans, setScans] = useState<WasteScan[]>([]);
  const [reports, setReports] = useState<GarbageReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [scansRes, reportsRes] = await Promise.all([
        fetch(`/api/scans?residentId=${user?.id || 'USR-RES-001'}`),
        fetch(`/api/reports?residentId=${user?.id || 'USR-RES-001'}`),
      ]);

      const scansData = await scansRes.json();
      const reportsData = await reportsRes.json();

      if (scansData.success && scansData.scans) {
        setScans(scansData.scans);
      }
      if (reportsData.success && reportsData.reports) {
        setReports(reportsData.reports);
      }
    } catch (e) {
      console.error('Failed to load resident data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Derived statistics
  const totalScans = scans.length;
  const dryScansCount = scans.filter((s) => s.wasteType === 'Dry Waste').length;
  const wetScansCount = scans.filter((s) => s.wasteType === 'Wet Waste').length;
  const completedPickupsCount = 8; // Baseline historical pickups
  const pendingPickupsCount = 1;

  const handleScanConfirmed = (newScan: WasteScan) => {
    setScans((prev) => [newScan, ...prev]);
    setActiveTab('history');
  };

  const handleReportSubmitted = (newReport: GarbageReport) => {
    setReports((prev) => [newReport, ...prev]);
    setActiveTab('reports');
  };

  return (
    <div className="min-h-screen bg-[#F4FFF8] pb-24 sm:pb-12">
      {/* Sub-Header Navigation Tabs for Desktop */}
      <div className="bg-white border-b border-emerald-100 hidden sm:block sticky top-[57px] z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'home'
                  ? 'border-[#00A86B] text-[#00A86B]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Home className="w-4 h-4" />
              Home
            </button>

            <button
              onClick={() => setActiveTab('house')}
              className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'house'
                  ? 'border-[#00A86B] text-[#00A86B]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-4 h-4" />
              My House
            </button>

            <button
              onClick={() => setActiveTab('scanner')}
              className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'scanner'
                  ? 'border-[#00A86B] text-[#00A86B]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-4 h-4 text-[#00A86B]" />
              Scan Waste
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'reports'
                  ? 'border-[#00A86B] text-[#00A86B]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Report Garbage
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'border-[#00A86B] text-[#00A86B]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              Collection History
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'border-[#00A86B] text-[#00A86B]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              Profile
            </button>
          </div>

          <button
            onClick={() => setShowReportModal(true)}
            className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-rose-200"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Report Litter
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* ========================================================= */}
        {/* TAB 1: RESIDENT HOME DASHBOARD                            */}
        {/* ========================================================= */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Top Greeting & Action Card */}
            <div className="bg-gradient-to-r from-[#064E3B] to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center">
                <Leaf className="w-72 h-72 translate-x-12" />
              </div>

              <div className="relative z-10 max-w-xl space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-bold border border-emerald-400/30">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  House #101 • Eco Champion
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Welcome, {user?.name || 'Resident'}
                </h2>
                <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed">
                  Sort your household waste into Dry and Wet streams to earn eco-credits and help collectors recycle efficiently.
                </p>

                {/* BIG PRIMARY SCAN WASTE BUTTON */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setActiveTab('scanner')}
                    className="py-3.5 px-7 bg-[#00A86B] hover:bg-emerald-500 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-emerald-950/30 flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Camera className="w-5 h-5" />
                    SCAN WASTE NOW
                  </button>

                  <button
                    onClick={() => setShowReportModal(true)}
                    className="py-3.5 px-5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-2xl backdrop-blur-xs transition-colors flex items-center gap-2 border border-white/20"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-300" />
                    Report Garbage
                  </button>
                </div>
              </div>
            </div>

            {/* Dashboard Cards: Required Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {/* Total Waste Scanned */}
              <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Scanned</span>
                  <Camera className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-black text-slate-800">{totalScans}</span>
                  <span className="text-xs text-slate-500 block">household items</span>
                </div>
              </div>

              {/* Dry Waste */}
              <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-blue-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dry Waste</span>
                  <Recycle className="w-4 h-4" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-black text-blue-700">{dryScansCount}</span>
                  <span className="text-xs text-blue-600/80 block font-medium">Plastic, paper, cans</span>
                </div>
              </div>

              {/* Wet Waste */}
              <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-emerald-600">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Wet Waste</span>
                  <Leaf className="w-4 h-4" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-700">{wetScansCount}</span>
                  <span className="text-xs text-emerald-600/80 block font-medium">Food & peels</span>
                </div>
              </div>

              {/* Completed Pickups */}
              <div className="bg-white p-4 rounded-2xl border border-teal-100 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-teal-600">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed Pickups</span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-black text-teal-800">{completedPickupsCount}</span>
                  <span className="text-xs text-teal-600/80 block font-medium">This month</span>
                </div>
              </div>

              {/* Pending Pickup */}
              <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-amber-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Pickup</span>
                  <Clock className="w-4 h-4" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-black text-amber-600">{pendingPickupsCount}</span>
                  <span className="text-xs text-amber-700/80 block font-medium">Today 10:00 AM</span>
                </div>
              </div>
            </div>

            {/* Quick Status Bar: Assigned Collector & Next Pickup */}
            <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-800">Collector On Route</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Live GPS Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Rajesh Kumar (Vehicle MH-31-EQ-4421) is 0.4 km away from your house.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-auto">
                <button
                  onClick={() => setActiveTab('house')}
                  className="px-4 py-2 bg-[#E8F8EF] hover:bg-emerald-100 text-[#064E3B] font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#00A86B]" />
                  View House Location
                </button>
              </div>
            </div>

            {/* Recent Scans Overview */}
            <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#064E3B]">Recent Waste Scans</h3>
                  <p className="text-xs text-slate-500">Verified household items</p>
                </div>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-xs font-bold text-[#00A86B] hover:underline flex items-center gap-1"
                >
                  View All Scans
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {scans.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl">
                  No waste scanned yet. Tap "SCAN WASTE NOW" to classify your first item!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {scans.slice(0, 4).map((scan) => (
                    <div
                      key={scan.id}
                      className="p-3.5 rounded-2xl bg-[#E8F8EF]/50 border border-[#B7E4C7]/60 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-lg shrink-0">
                          {scan.wasteType === 'Dry Waste' ? '📦' : '🥗'}
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-slate-800">{scan.detectedObject}</div>
                          <div className="text-[11px] text-slate-500">{scan.category} • {scan.date}</div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0 ${
                          scan.wasteType === 'Dry Waste'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {scan.wasteType}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: MY HOUSE VIEW                                      */}
        {/* ========================================================= */}
        {activeTab === 'house' && <MyHouseView residentId={user?.id} />}

        {/* ========================================================= */}
        {/* TAB 3: SCAN WASTE                                         */}
        {/* ========================================================= */}
        {activeTab === 'scanner' && (
          <div className="py-2">
            <WasteScanner onScanConfirmed={handleScanConfirmed} />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: GARBAGE REPORTS                                    */}
        {/* ========================================================= */}
        {activeTab === 'reports' && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="flex items-center justify-between bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm">
              <div>
                <h3 className="text-base font-extrabold text-[#064E3B]">Garbage & Litter Reports</h3>
                <p className="text-xs text-slate-500">Track status of municipal cleanups you reported</p>
              </div>

              <button
                onClick={() => setShowReportModal(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                File New Report
              </button>
            </div>

            {reports.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center text-slate-400 text-xs border border-emerald-100">
                No garbage reports filed yet. If you see uncollected garbage in your area, submit a report!
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-mono font-bold text-slate-400">REPORT #{report.id}</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">{report.description}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          {report.address}
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0 uppercase tracking-wider ${
                          report.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : report.status === 'COLLECTOR ON THE WAY'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <span>Reported on {report.date} at {report.time}</span>
                      {report.assignedCollectorName && (
                        <span className="font-semibold text-emerald-700">
                          Assigned to: {report.assignedCollectorName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: COLLECTION & SCAN HISTORY                          */}
        {/* ========================================================= */}
        {activeTab === 'history' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#064E3B]">Household Waste History</h3>
                <p className="text-xs text-slate-500">Record of verified scans and collections</p>
              </div>
              <button
                onClick={() => setActiveTab('scanner')}
                className="px-3.5 py-1.5 bg-[#00A86B] text-white font-bold text-xs rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                Scan New Item
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                {scans.map((scan) => (
                  <div key={scan.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#E8F8EF] border border-[#B7E4C7] flex items-center justify-center text-xl shrink-0">
                        {scan.wasteType === 'Dry Waste' ? '📦' : '🥗'}
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-800">{scan.detectedObject}</div>
                        <div className="text-[11px] text-slate-500">
                          {scan.category} • Confidence: {Math.round(scan.confidence * 100)}%
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                          Bin: {scan.recommendedBin}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:text-right">
                      <div className="text-[11px] text-slate-500">
                        <div>{scan.date}</div>
                        <div className="text-[10px] text-slate-400">{scan.time}</div>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                          scan.wasteType === 'Dry Waste'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {scan.wasteType}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: PROFILE & REWARDS                                  */}
        {/* ========================================================= */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm text-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#00A86B] to-emerald-400 text-white font-extrabold text-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-600/20">
                {user?.name?.charAt(0) || 'R'}
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#064E3B]">{user?.name}</h3>
                <p className="text-xs text-slate-500">{user?.email}</p>
                <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Verified Household Resident
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Environmental Impact
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Plastic Recycled</span>
                  <span className="text-xl font-black text-[#00A86B]">14.8 kg</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">CO2 Offset</span>
                  <span className="text-xl font-black text-blue-700">32.4 kg</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Modal for Reporting Garbage */}
      {showReportModal && (
        <GarbageReportModal
          onClose={() => setShowReportModal(false)}
          onReportSubmitted={handleReportSubmitted}
        />
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-emerald-100 shadow-lg px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center p-1.5 text-[10px] font-bold transition-colors ${
            activeTab === 'home' ? 'text-[#00A86B]' : 'text-slate-400'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          Home
        </button>

        <button
          onClick={() => setActiveTab('house')}
          className={`flex flex-col items-center p-1.5 text-[10px] font-bold transition-colors ${
            activeTab === 'house' ? 'text-[#00A86B]' : 'text-slate-400'
          }`}
        >
          <MapPin className="w-5 h-5 mb-0.5" />
          House
        </button>

        {/* Central Scan Waste Highlight Button */}
        <button
          onClick={() => setActiveTab('scanner')}
          className="flex flex-col items-center -mt-5"
        >
          <div className="w-12 h-12 rounded-full bg-[#00A86B] text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 border-2 border-white">
            <Camera className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-extrabold text-[#00A86B] mt-0.5">Scan</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center p-1.5 text-[10px] font-bold transition-colors ${
            activeTab === 'reports' ? 'text-[#00A86B]' : 'text-slate-400'
          }`}
        >
          <AlertTriangle className="w-5 h-5 mb-0.5" />
          Reports
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center p-1.5 text-[10px] font-bold transition-colors ${
            activeTab === 'history' ? 'text-[#00A86B]' : 'text-slate-400'
          }`}
        >
          <History className="w-5 h-5 mb-0.5" />
          History
        </button>
      </nav>
    </div>
  );
};
