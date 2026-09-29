import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Truck,
  Home,
  Navigation,
  AlertTriangle,
  BarChart3,
  Settings,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  MapPin,
  Recycle,
  Sparkles,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Scale,
} from 'lucide-react';
import { AdminStats, House, Vehicle, GarbageReport, CollectorLocation } from '../../types';
import { LeafletMap, MapMarker } from '../common/LeafletMap';

export const AdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'tracking' | 'residents' | 'collectors' | 'houses' | 'vehicles' | 'reports' | 'analytics'
  >('dashboard');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [collectorLocations, setCollectorLocations] = useState<CollectorLocation[]>([]);
  const [selectedCollector, setSelectedCollector] = useState<CollectorLocation | null>(null);
  const [residents, setResidents] = useState<any[]>([]);
  const [collectors, setCollectors] = useState<any[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reports, setReports] = useState<GarbageReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddResidentModal, setShowAddResidentModal] = useState(false);
  const [showAddCollectorModal, setShowAddCollectorModal] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTargetHouse, setAssignTargetHouse] = useState<House | null>(null);
  const [selectedCollectorForAssign, setSelectedCollectorForAssign] = useState<string>('');

  // Form states
  const [newResName, setNewResName] = useState('');
  const [newResEmail, setNewResEmail] = useState('');
  const [newResPhone, setNewResPhone] = useState('');
  const [newResAddress, setNewResAddress] = useState('');

  const [newColName, setNewColName] = useState('');
  const [newColEmail, setNewColEmail] = useState('');
  const [newColPhone, setNewColPhone] = useState('');
  const [newColVehicle, setNewColVehicle] = useState('VEH-01');

  const [newVehReg, setNewVehReg] = useState('');
  const [newVehType, setNewVehType] = useState('Electric Tipper Truck');
  const [newVehCap, setNewVehCap] = useState('1200');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, locsRes, resRes, colRes, housesRes, vehRes, repRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/collector/locations'),
        fetch('/api/admin/residents'),
        fetch('/api/admin/collectors'),
        fetch('/api/admin/houses'),
        fetch('/api/admin/vehicles'),
        fetch('/api/reports'),
      ]);

      const [statsData, locsData, resData, colData, housesData, vehData, repData] = await Promise.all([
        statsRes.json(),
        locsRes.json(),
        resRes.json(),
        colRes.json(),
        housesRes.json(),
        vehRes.json(),
        repRes.json(),
      ]);

      if (statsData.success) setStats(statsData.stats);
      if (locsData.success) {
        setCollectorLocations(locsData.locations);
        if (locsData.locations.length > 0 && !selectedCollector) {
          setSelectedCollector(locsData.locations[0]);
        }
      }
      if (resData.success) setResidents(resData.residents);
      if (colData.success) setCollectors(colData.collectors);
      if (housesData.success) setHouses(housesData.houses);
      if (vehData.success) setVehicles(vehData.vehicles);
      if (repData.success) setReports(repData.reports);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 12000);
    return () => clearInterval(interval);
  }, []);

  // Add Resident
  const handleAddResident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/residents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newResName,
          email: newResEmail,
          phone: newResPhone,
          address: newResAddress,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddResidentModal(false);
        setNewResName('');
        setNewResEmail('');
        setNewResPhone('');
        setNewResAddress('');
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add Collector
  const handleAddCollector = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/collectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newColName,
          email: newColEmail,
          phone: newColPhone,
          vehicleId: newColVehicle,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddCollectorModal(false);
        setNewColName('');
        setNewColEmail('');
        setNewColPhone('');
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add Vehicle
  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationNumber: newVehReg,
          vehicleType: newVehType,
          capacityKg: newVehCap,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddVehicleModal(false);
        setNewVehReg('');
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Assign Collector to House
  const handleAssignCollector = async () => {
    if (!assignTargetHouse || !selectedCollectorForAssign) return;
    try {
      const res = await fetch('/api/admin/houses/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          houseId: assignTargetHouse.id,
          collectorId: selectedCollectorForAssign,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAssignModal(false);
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle user active status
  const handleToggleResidentStatus = async (resident: any) => {
    const nextStatus = resident.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await fetch(`/api/admin/residents/${resident.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  // Live Tracking Map Markers
  const trackingMarkers: MapMarker[] = [
    ...collectorLocations.map((c) => ({
      id: c.collectorId,
      latitude: c.latitude,
      longitude: c.longitude,
      title: `${c.collectorName} (${c.collectorId})`,
      subtitle: `Status: ${c.status} • Completed: ${c.completedPickupsToday}`,
      type: 'COLLECTOR' as const,
      status: c.status,
      onClick: () => setSelectedCollector(c),
    })),
    ...houses.map((h) => ({
      id: h.id,
      latitude: h.latitude,
      longitude: h.longitude,
      title: h.houseNumber,
      subtitle: `${h.residentName} • ${h.address}`,
      type: 'HOUSE' as const,
      status: h.pickupStatus,
    })),
  ];

  return (
    <div className="min-h-screen bg-[#F4FFF8] pb-16">
      {/* Admin Horizontal Sub-Nav */}
      <div className="bg-white border-b border-emerald-100 sticky top-[57px] z-20 shadow-2xs overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center space-x-1 py-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'tracking', label: 'Live Tracking', icon: <Navigation className="w-4 h-4" /> },
            { id: 'residents', label: 'Residents', icon: <Users className="w-4 h-4" /> },
            { id: 'collectors', label: 'Collectors', icon: <Truck className="w-4 h-4" /> },
            { id: 'houses', label: 'Houses', icon: <Home className="w-4 h-4" /> },
            { id: 'vehicles', label: 'Vehicles', icon: <ShieldCheck className="w-4 h-4" /> },
            { id: 'reports', label: 'Reports', icon: <AlertTriangle className="w-4 h-4" /> },
            { id: 'analytics', label: 'Waste Analytics', icon: <Recycle className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2.5 text-xs font-bold transition-all border-b-2 shrink-0 flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* ========================================================= */}
        {/* TAB 1: ADMIN DASHBOARD (ANALYTICS & KPI METRICS)          */}
        {/* ========================================================= */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            {/* Top Admin Banner */}
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-emerald-900 rounded-3xl p-6 sm:p-7 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/30 text-purple-200 text-xs font-bold border border-purple-400/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
                  MUNICIPAL COMMAND CENTER
                </div>
                <h2 className="text-2xl font-black tracking-tight">EcoScan Admin Operations</h2>
                <p className="text-xs text-purple-200/90 max-w-lg">
                  Real-time citywide oversight of households, collector fleet, segregation ratio, and waste diversion.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('tracking')}
                  className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  Open Live GPS Radar
                </button>
                <button
                  onClick={fetchAdminData}
                  className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                  title="Refresh Data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Residents</span>
                <span className="text-2xl font-black text-slate-800 mt-1 block">{stats.totalResidents}</span>
                <span className="text-[10px] text-emerald-600 font-semibold">Registered users</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Collectors</span>
                <span className="text-2xl font-black text-amber-700 mt-1 block">{stats.totalCollectors}</span>
                <span className="text-[10px] text-amber-600 font-semibold">{stats.activeCollectors} on duty</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-teal-100 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Houses</span>
                <span className="text-2xl font-black text-teal-800 mt-1 block">{stats.totalHouses}</span>
                <span className="text-[10px] text-teal-600 font-semibold">Allocated</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Vehicles</span>
                <span className="text-2xl font-black text-indigo-800 mt-1 block">{stats.totalVehicles}</span>
                <span className="text-[10px] text-indigo-600 font-semibold">Tipper & EVs</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Waste Collected</span>
                <span className="text-2xl font-black text-blue-700 mt-1 block">{stats.totalWasteCollectedKg} kg</span>
                <span className="text-[10px] text-blue-600 font-semibold">Total diverted</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pickups Completed</span>
                <span className="text-2xl font-black text-emerald-700 mt-1 block">{stats.completedPickups}</span>
                <span className="text-[10px] text-emerald-600 font-semibold">{stats.pendingPickups} pending</span>
              </div>
            </div>

            {/* Dry vs Wet Visual Ratio Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-[#064E3B]">Dry vs. Wet Waste Ratio</h3>
                  <span className="text-xs font-bold text-slate-400">Total: {stats.totalWasteCollectedKg} kg</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-blue-700">Dry Recyclables ({stats.dryWasteKg} kg)</span>
                      <span className="text-blue-700">58%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: '58%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-emerald-700">Wet Organic Waste ({stats.wetWasteKg} kg)</span>
                      <span className="text-emerald-700">42%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-[#00A86B] rounded-full" style={{ width: '42%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-2xl text-[11px] text-[#064E3B] leading-relaxed">
                  ✓ Segregation adherence is currently at <span className="font-extrabold">92.4%</span> across Sector 4 & 5. Contamination rate reduced by 18%.
                </div>
              </div>

              {/* Material Breakdown */}
              <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-3">
                <h3 className="text-sm font-extrabold text-[#064E3B]">Category Breakdown (Scans & Recyclables)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  {Object.entries(stats.categoryBreakdown).slice(0, 6).map(([cat, count]) => (
                    <div key={cat} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{cat}</span>
                      <span className="text-base font-black text-slate-800">{count} items</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ADMIN LIVE TRACKING RADAR                          */}
        {/* ========================================================= */}
        {activeTab === 'tracking' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-[#064E3B]">Citywide Live GPS Tracking</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Live Telemetry
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Real-time GPS positions of municipal collector vehicles and assigned household pins
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">
                  Active Collectors: <span className="text-emerald-700 font-bold">{collectorLocations.filter((c) => c.isOnline).length}</span>
                </span>
              </div>
            </div>

            {/* Selected Collector Drawer / Info Card */}
            {selectedCollector && (
              <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-800 font-extrabold flex items-center justify-center text-sm">
                    🚚
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800">{selectedCollector.collectorName}</span>
                      <span className="text-[10px] font-mono text-slate-500">({selectedCollector.collectorId})</span>
                      <span className="text-[10px] font-bold px-2 py-0.2 bg-emerald-100 text-emerald-800 rounded-full">
                        {selectedCollector.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Vehicle: <span className="font-semibold text-slate-700">{selectedCollector.vehicleId || 'VEH-01'}</span> • Last update: {new Date(selectedCollector.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Completed</span>
                    <span className="font-bold text-emerald-700">{selectedCollector.completedPickupsToday} houses</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Pending</span>
                    <span className="font-bold text-amber-700">{selectedCollector.pendingPickupsToday} houses</span>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Leaflet Map */}
            <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-sm">
              <LeafletMap
                center={[21.147, 79.089]}
                zoom={14}
                markers={trackingMarkers}
                height="460px"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: RESIDENTS MANAGEMENT                               */}
        {/* ========================================================= */}
        {activeTab === 'residents' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#064E3B]">Resident Households</h3>
                <p className="text-xs text-slate-500">Manage registered residents and household profiles</p>
              </div>

              <button
                onClick={() => setShowAddResidentModal(true)}
                className="px-4 py-2 bg-[#00A86B] hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Resident
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-black tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="p-4">Resident</th>
                      <th className="p-4">House ID & Address</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {residents.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{r.name}</div>
                          <div className="text-[11px] text-slate-400">{r.email}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-700">{r.house?.houseNumber || r.houseId}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{r.house?.address || 'Sector 4, Nagpur'}</div>
                        </td>
                        <td className="p-4 font-mono text-slate-600">{r.phone}</td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleToggleResidentStatus(r)}
                            className="text-xs font-semibold text-slate-600 hover:text-emerald-700 underline"
                          >
                            {r.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: COLLECTORS MANAGEMENT                              */}
        {/* ========================================================= */}
        {activeTab === 'collectors' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#064E3B]">Municipal Collectors</h3>
                <p className="text-xs text-slate-500">Approve and configure authorized collection personnel</p>
              </div>

              <button
                onClick={() => setShowAddCollectorModal(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Collector
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {collectors.map((c) => (
                <div key={c.id} className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-extrabold flex items-center justify-center text-sm">
                        🚚
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-800">{c.name}</div>
                        <div className="text-[11px] text-slate-400">{c.email} • {c.phone}</div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {c.status}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Vehicle</span>
                      <span className="font-bold text-slate-700">{c.vehicle?.registrationNumber || 'Tata Ace (MH-31-EQ-4421)'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Status</span>
                      <span className="font-semibold text-emerald-700">{c.liveLocation?.status || 'ON_DUTY'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: HOUSES MANAGEMENT & COLLECTOR ASSIGNMENT           */}
        {/* ========================================================= */}
        {activeTab === 'houses' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#064E3B]">Household Ward Directory</h3>
                <p className="text-xs text-slate-500">Assign dedicated collectors to household pickup stops</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {houses.map((h) => (
                <div key={h.id} className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-extrabold text-slate-800">{h.houseNumber}</div>
                      <div className="text-xs text-slate-600">{h.residentName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{h.address}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {h.pickupStatus}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Assigned Collector</span>
                      <span className="font-bold text-slate-800">{h.assignedCollectorName || 'Unassigned'}</span>
                    </div>
                    <button
                      onClick={() => {
                        setAssignTargetHouse(h);
                        setSelectedCollectorForAssign(h.assignedCollectorId || 'USR-COL-001');
                        setShowAssignModal(true);
                      }}
                      className="px-3 py-1.5 bg-[#00A86B] hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-2xs"
                    >
                      Reassign
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: VEHICLE FLEET MANAGEMENT                           */}
        {/* ========================================================= */}
        {activeTab === 'vehicles' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#064E3B]">Vehicle Fleet Management</h3>
                <p className="text-xs text-slate-500">Track electric tippers, compactor trucks, and payload status</p>
              </div>

              <button
                onClick={() => setShowAddVehicleModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Vehicle
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {vehicles.map((v) => (
                <div key={v.id} className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-mono font-extrabold text-slate-800">{v.registrationNumber}</div>
                      <div className="text-[11px] text-slate-500">{v.vehicleType}</div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        v.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Capacity:</span>
                      <span className="font-bold text-slate-800">{v.capacityKg} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assigned To:</span>
                      <span className="font-semibold text-slate-700">{v.assignedCollectorName || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: GARBAGE REPORTS MANAGEMENT                         */}
        {/* ========================================================= */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#064E3B]">Garbage & Street Litter Incidents</h3>
                <p className="text-xs text-slate-500">Citizen reported waste piles requiring cleanup</p>
              </div>
            </div>

            <div className="space-y-3">
              {reports.map((rep) => (
                <div key={rep.id} className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-mono font-bold text-slate-400">REPORT #{rep.id}</div>
                      <div className="text-xs font-black text-slate-800 mt-0.5">{rep.description}</div>
                      <div className="text-[11px] text-slate-500 mt-1">{rep.address}</div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rep.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rep.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span>Filed by {rep.residentName} on {rep.date}</span>
                    <span className="font-bold text-emerald-700">Assigned: {rep.assignedCollectorName || 'Rajesh Kumar'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: WASTE ANALYTICS                                    */}
        {/* ========================================================= */}
        {activeTab === 'analytics' && stats && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm">
              <h3 className="text-base font-extrabold text-[#064E3B]">Citywide Diversion & Material Segregation</h3>
              <p className="text-xs text-slate-500">Comprehensive breakdown of waste streams processed</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.categoryBreakdown).map(([category, count]) => (
                <div key={category} className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-800">{category}</span>
                    <span className="text-[#00A86B]">{count} scans</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-[#00A86B] rounded-full"
                      style={{ width: `${Math.min(count * 2, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: ADD RESIDENT */}
      {showAddResidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-800 mb-3">Add New Resident Household</h3>
            <form onSubmit={handleAddResident} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newResName}
                  onChange={(e) => setNewResName(e.target.value)}
                  placeholder="e.g. Sunil Verma"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newResEmail}
                  onChange={(e) => setNewResEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={newResPhone}
                  onChange={(e) => setNewResPhone(e.target.value)}
                  placeholder="+91 98000 00000"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={newResAddress}
                  onChange={(e) => setNewResAddress(e.target.value)}
                  placeholder="e.g. Greenwood Villa #105, Sector 4"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddResidentModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#00A86B] text-white hover:bg-emerald-600 rounded-xl"
                >
                  Create Resident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD COLLECTOR */}
      {showAddCollectorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-800 mb-3">Add Municipal Collector</h3>
            <form onSubmit={handleAddCollector} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Collector Name</label>
                <input
                  type="text"
                  required
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="e.g. Ramesh Patil"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newColEmail}
                  onChange={(e) => setNewColEmail(e.target.value)}
                  placeholder="ramesh@ecoscan.org"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={newColPhone}
                  onChange={(e) => setNewColPhone(e.target.value)}
                  placeholder="+91 94000 00000"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assign Initial Vehicle</label>
                <select
                  value={newColVehicle}
                  onChange={(e) => setNewColVehicle(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="VEH-01">VEH-01 (Tata Ace EV Green)</option>
                  <option value="VEH-02">VEH-02 (Compactor Waste Van)</option>
                  <option value="VEH-03">VEH-03 (Rapid Collection Trike)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCollectorModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 rounded-xl"
                >
                  Add Collector
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD VEHICLE */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-800 mb-3">Add Fleet Vehicle</h3>
            <form onSubmit={handleAddVehicle} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Registration Number</label>
                <input
                  type="text"
                  required
                  value={newVehReg}
                  onChange={(e) => setNewVehReg(e.target.value)}
                  placeholder="e.g. MH-31-EQ-9900"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Type</label>
                <input
                  type="text"
                  value={newVehType}
                  onChange={(e) => setNewVehType(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payload Capacity (kg)</label>
                <input
                  type="number"
                  value={newVehCap}
                  onChange={(e) => setNewVehCap(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN COLLECTOR TO HOUSE */}
      {showAssignModal && assignTargetHouse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-800">
              Assign Collector to {assignTargetHouse.houseNumber}
            </h3>
            <p className="text-xs text-slate-500">{assignTargetHouse.address}</p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Collector</label>
              <select
                value={selectedCollectorForAssign}
                onChange={(e) => setSelectedCollectorForAssign(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                {collectors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignCollector}
                className="px-4 py-2 text-xs font-bold bg-[#00A86B] text-white hover:bg-emerald-600 rounded-xl"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
