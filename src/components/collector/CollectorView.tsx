import React, { useState, useEffect, useRef } from 'react';
import {
  Truck,
  MapPin,
  Camera,
  CheckCircle2,
  Clock,
  Navigation,
  Scale,
  Power,
  AlertCircle,
  Calendar,
  Phone,
  ShieldCheck,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PickupTask, DetectionItem } from '../../types';
import { WasteScanner } from '../resident/WasteScanner';
import { LeafletMap, MapMarker } from '../common/LeafletMap';

export const CollectorView: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'assignments' | 'scan' | 'map' | 'profile'>('dashboard');
  const [onDuty, setOnDuty] = useState<boolean>(true);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: 21.1465,
    lng: 79.0875,
  });
  const [pickups, setPickups] = useState<PickupTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPickup, setSelectedPickup] = useState<PickupTask | null>(null);

  // Scan & Confirmation Flow State
  const [scannedItem, setScannedItem] = useState<DetectionItem | null>(null);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [weightKg, setWeightKg] = useState<string>('2.5');
  const [confirming, setConfirming] = useState<boolean>(false);
  const [confirmSuccess, setConfirmSuccess] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);

  // Fetch Assigned Pickups
  const fetchPickups = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/collector/pickups?collectorId=${user?.id || 'USR-COL-001'}`);
      const data = await res.json();
      if (data.success && data.pickups) {
        setPickups(data.pickups);
        if (!selectedPickup && data.pickups.length > 0) {
          setSelectedPickup(data.pickups[0]);
        }
      }
    } catch (e) {
      console.error('Failed to fetch pickups:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickups();
  }, [user]);

  // Live GPS Tracking with navigator.geolocation
  useEffect(() => {
    if (!onDuty) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCurrentCoords({ lat, lng });

          // Send to backend POST /api/collector/location
          fetch('/api/collector/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              collectorId: user?.id || 'USR-COL-001',
              latitude: lat,
              longitude: lng,
              isOnline: true,
              status: 'ON_DUTY',
              currentHouseId: selectedPickup?.houseId,
            }),
          }).catch((err) => console.warn('Failed to update live GPS to backend:', err));
        },
        (err) => {
          console.warn('GPS location tracking error:', err);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [onDuty, selectedPickup, user]);

  const toggleDuty = async () => {
    const nextState = !onDuty;
    setOnDuty(nextState);
    try {
      await fetch('/api/collector/duty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectorId: user?.id || 'USR-COL-001',
          onDuty: nextState,
          latitude: currentCoords.lat,
          longitude: currentCoords.lng,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Collector Scan Result Callback
  const handleCollectorScan = (item: DetectionItem, image: string) => {
    setScannedItem(item);
    setScannedImage(image);
  };

  // Confirm Collection Action
  const handleConfirmCollection = async () => {
    if (!selectedPickup) return;

    try {
      setConfirming(true);
      const res = await fetch('/api/collector/confirm-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupId: selectedPickup.id,
          houseId: selectedPickup.houseId,
          collectorId: user?.id || 'USR-COL-001',
          weightKg: parseFloat(weightKg) || 2.5,
          wasteCategory: scannedItem?.category || 'Plastic Bottle',
          wasteType: scannedItem?.wasteType || 'Dry Waste',
          image: scannedImage || '',
          latitude: currentCoords.lat,
          longitude: currentCoords.lng,
          detectionConfidence: scannedItem?.confidence || 0.95,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setConfirmSuccess(`Collection completed for ${selectedPickup.houseNumber}!`);
        // Refresh pickups
        fetchPickups();
        setTimeout(() => {
          setConfirmSuccess(null);
          setScannedItem(null);
          setScannedImage(null);
          setActiveTab('dashboard');
        }, 1500);
      }
    } catch (e) {
      console.error('Failed to confirm collection:', e);
    } finally {
      setConfirming(false);
    }
  };

  // Prepare map markers
  const mapMarkers: MapMarker[] = [
    {
      id: 'COLLECTOR_CURRENT',
      latitude: currentCoords.lat,
      longitude: currentCoords.lng,
      title: `${user?.name || 'Collector'} (Live GPS)`,
      subtitle: onDuty ? 'ON DUTY • Active Truck' : 'OFF DUTY',
      type: 'COLLECTOR',
      status: onDuty ? 'ON DUTY' : 'IDLE',
    },
    ...pickups.map((p) => ({
      id: p.id,
      latitude: p.latitude,
      longitude: p.longitude,
      title: `${p.houseNumber} (${p.residentName})`,
      subtitle: `${p.address} • ${p.scheduledTime}`,
      type: 'HOUSE' as const,
      status: p.status,
      onClick: () => setSelectedPickup(p),
    })),
  ];

  // Route Polyline from current location to pickup points
  const routePolyline: [number, number][] = [
    [currentCoords.lat, currentCoords.lng],
    ...pickups
      .filter((p) => p.status !== 'COMPLETED')
      .map((p) => [p.latitude, p.longitude] as [number, number]),
  ];

  const pendingPickups = pickups.filter((p) => p.status !== 'COMPLETED');
  const completedPickups = pickups.filter((p) => p.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-[#F4FFF8] pb-24 sm:pb-12">
      {/* Sub-Header Tabs for Desktop */}
      <div className="bg-white border-b border-emerald-100 hidden sm:block sticky top-[57px] z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-4 h-4" />
              Duty Dashboard
            </button>

            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'assignments'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Assigned Houses ({pendingPickups.length})
            </button>

            <button
              onClick={() => setActiveTab('scan')}
              className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'scan'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-4 h-4 text-emerald-600" />
              Scan Garbage
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'map'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Navigation className="w-4 h-4" />
              Live Route Map
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              Vehicle & Profile
            </button>
          </div>

          {/* Duty Switch Button */}
          <button
            onClick={toggleDuty}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs ${
              onDuty
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {onDuty ? 'ON DUTY (Tracking)' : 'START DUTY'}
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* ========================================================= */}
        {/* TAB 1: COLLECTOR DASHBOARD                                */}
        {/* ========================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Duty Banner */}
            <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-emerald-900 rounded-3xl p-6 sm:p-7 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                      onDuty
                        ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                        : 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        onDuty ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'
                      }`}
                    ></span>
                    {onDuty ? 'LIVE GPS DUTY ACTIVE' : 'DUTY PAUSED'}
                  </span>
                  <span className="text-xs text-amber-200/80">
                    Vehicle: Tata Ace EV (MH-31-EQ-4421)
                  </span>
                </div>

                <h2 className="text-2xl font-black tracking-tight">
                  Collector Dispatch: {user?.name || 'Rajesh Kumar'}
                </h2>
                <p className="text-xs text-amber-100 max-w-lg">
                  GPS position is automatically synced every few seconds with municipal admin and households.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  onClick={toggleDuty}
                  className={`py-3 px-6 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md ${
                    onDuty
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  {onDuty ? 'STOP DUTY' : 'START DUTY'}
                </button>

                <button
                  onClick={() => setActiveTab('scan')}
                  className="py-3 px-5 bg-white text-slate-800 hover:bg-slate-50 font-bold text-xs sm:text-sm rounded-2xl shadow-md flex items-center gap-2"
                >
                  <Camera className="w-4 h-4 text-[#00A86B]" />
                  Scan Garbage
                </button>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Today</span>
                <span className="text-2xl font-black text-slate-800 mt-1 block">{pickups.length}</span>
                <span className="text-[11px] text-slate-500">Scheduled houses</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending</span>
                <span className="text-2xl font-black text-amber-600 mt-1 block">{pendingPickups.length}</span>
                <span className="text-[11px] text-amber-600/80 font-medium">To be collected</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-teal-100 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
                <span className="text-2xl font-black text-teal-700 mt-1 block">{completedPickups.length}</span>
                <span className="text-[11px] text-teal-600/80 font-medium">Pickups verified</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Waste Collected</span>
                <span className="text-2xl font-black text-blue-700 mt-1 block">42.5 kg</span>
                <span className="text-[11px] text-blue-600/80 font-medium">Recorded weight</span>
              </div>
            </div>

            {/* Today's Assigned Houses List */}
            <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#064E3B]">Today's Assigned Houses</h3>
                  <p className="text-xs text-slate-500">Pickups along your municipal route</p>
                </div>
                <button
                  onClick={() => setActiveTab('map')}
                  className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  View Route Map
                </button>
              </div>

              <div className="space-y-3">
                {pickups.map((pickup) => {
                  const isDone = pickup.status === 'COMPLETED';
                  return (
                    <div
                      key={pickup.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        isDone
                          ? 'bg-slate-50/60 border-slate-200 opacity-80'
                          : 'bg-white border-emerald-200/80 hover:border-emerald-400 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {pickup.houseNumber.replace('House #', 'H')}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-800">{pickup.houseNumber}</span>
                            <span className="text-xs text-slate-600 font-semibold">• {pickup.residentName}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isDone
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {pickup.status}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            {pickup.address}
                          </div>

                          <div className="text-[10px] text-slate-400 flex items-center gap-3 mt-1">
                            <span>Time: {pickup.scheduledTime}</span>
                            <span>Stream: {pickup.wasteType}</span>
                            <span>Distance: ~{pickup.distanceKm} km</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto">
                        {!isDone && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedPickup(pickup);
                                setActiveTab('map');
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              Navigate
                            </button>

                            <button
                              onClick={() => {
                                setSelectedPickup(pickup);
                                setActiveTab('scan');
                              }}
                              className="px-3.5 py-1.5 bg-[#00A86B] hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              Scan & Collect
                            </button>
                          </>
                        )}
                        {isDone && (
                          <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Collected ({pickup.weightKg} kg)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ASSIGNED HOUSES                                    */}
        {/* ========================================================= */}
        {activeTab === 'assignments' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#064E3B]">Scheduled Household Pickups</h3>
                <p className="text-xs text-slate-500">Pickups allocated for your current shift</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-800 rounded-full">
                {pendingPickups.length} pending
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {pickups.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-extrabold text-slate-800">{p.houseNumber}</div>
                      <div className="text-xs text-slate-600 font-medium">{p.residentName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{p.address}</div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Scheduled:</span>
                      <span className="font-semibold text-slate-700">{p.scheduledTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Waste Type:</span>
                      <span className="font-semibold text-slate-700">{p.wasteType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phone:</span>
                      <span className="font-semibold text-slate-700">{p.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedPickup(p);
                        setActiveTab('map');
                      }}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Map
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPickup(p);
                        setActiveTab('scan');
                      }}
                      className="flex-1 py-2 bg-[#00A86B] hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Scan & Collect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: COLLECTOR WASTE SCANNER & CONFIRM COLLECTION       */}
        {/* ========================================================= */}
        {activeTab === 'scan' && (
          <div className="space-y-4 max-w-xl mx-auto">
            {/* Target House Indicator */}
            {selectedPickup && (
              <div className="bg-[#E8F8EF] p-4 rounded-2xl border border-[#B7E4C7] flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Collecting From:</div>
                  <div className="text-sm font-extrabold text-[#064E3B]">{selectedPickup.houseNumber} ({selectedPickup.residentName})</div>
                  <div className="text-xs text-slate-600">{selectedPickup.address}</div>
                </div>
                <button
                  onClick={() => setActiveTab('assignments')}
                  className="text-xs font-bold text-[#00A86B] hover:underline"
                >
                  Change House
                </button>
              </div>
            )}

            {/* Waste Scanner */}
            <WasteScanner
              collectorMode={true}
              onCollectorScanResult={handleCollectorScan}
            />

            {/* Confirmation & Weight Input Card (Once item is scanned) */}
            {scannedItem && (
              <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-md space-y-4 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  Collection Verification Details
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Detected Item</span>
                    <span className="font-bold text-slate-800">{scannedItem.object}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Stream</span>
                    <span className="font-bold text-emerald-700">{scannedItem.wasteType}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enter Measured Waste Weight (kg) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="e.g. 2.5"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A86B]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      KG
                    </span>
                  </div>
                </div>

                {confirmSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {confirmSuccess}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleConfirmCollection}
                  disabled={confirming}
                  className="w-full py-3 px-4 bg-[#00A86B] hover:bg-emerald-600 text-white font-extrabold text-sm rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {confirming ? 'Recording Collection...' : 'CONFIRM COLLECTION'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: ROUTE MAP & LIVE GPS                               */}
        {/* ========================================================= */}
        {activeTab === 'map' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-[#064E3B]">Live Collector Route Map</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    GPS Active
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Your truck position and assigned pickup waypoints
                </p>
              </div>

              {selectedPickup && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPickup.latitude},${selectedPickup.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  NAVIGATE TO {selectedPickup.houseNumber}
                </a>
              )}
            </div>

            {/* Next Pickup Info Bar */}
            {selectedPickup && (
              <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Next Stop</span>
                  <span className="text-xs font-extrabold text-slate-800">{selectedPickup.houseNumber} ({selectedPickup.residentName})</span>
                  <span className="text-[11px] text-slate-500 block">{selectedPickup.address}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-700 block">~{selectedPickup.distanceKm || 0.4} km away</span>
                  <span className="text-[10px] text-slate-400">ETA ~3 mins</span>
                </div>
              </div>
            )}

            {/* Leaflet Map */}
            <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-sm">
              <LeafletMap
                center={[currentCoords.lat, currentCoords.lng]}
                zoom={15}
                markers={mapMarkers}
                routePolyline={routePolyline}
                height="420px"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: VEHICLE & COLLECTOR PROFILE                        */}
        {/* ========================================================= */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm text-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 to-emerald-600 text-white font-extrabold text-2xl mx-auto flex items-center justify-center shadow-lg shadow-amber-600/20">
                {user?.name?.charAt(0) || 'C'}
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#064E3B]">{user?.name}</h3>
                <p className="text-xs text-slate-500">{user?.email}</p>
                <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  Certified Municipal Waste Collector
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Assigned Vehicle Fleet Details
              </h4>
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Tata Ace EV Green (100% Electric)</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px]">
                    ACTIVE
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-1">
                  <div>Registration Number: <span className="font-mono font-bold">MH-31-EQ-4421</span></div>
                  <div>Payload Capacity: <span className="font-bold">1200 kg</span></div>
                  <div>Maintenance Status: <span className="text-emerald-700 font-bold">Inspected & Cleared</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-emerald-100 shadow-lg px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center p-1.5 text-[10px] font-bold transition-colors ${
            activeTab === 'dashboard' ? 'text-amber-700' : 'text-slate-400'
          }`}
        >
          <Truck className="w-5 h-5 mb-0.5" />
          Duty
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex flex-col items-center p-1.5 text-[10px] font-bold transition-colors ${
            activeTab === 'assignments' ? 'text-amber-700' : 'text-slate-400'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          Houses
        </button>

        {/* Central Scan Highlight */}
        <button
          onClick={() => setActiveTab('scan')}
          className="flex flex-col items-center -mt-5"
        >
          <div className="w-12 h-12 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/40 border-2 border-white">
            <Camera className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-extrabold text-amber-700 mt-0.5">Scan</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center p-1.5 text-[10px] font-bold transition-colors ${
            activeTab === 'map' ? 'text-amber-700' : 'text-slate-400'
          }`}
        >
          <Navigation className="w-5 h-5 mb-0.5" />
          Route
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center p-1.5 text-[10px] font-bold transition-colors ${
            activeTab === 'profile' ? 'text-amber-700' : 'text-slate-400'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          Profile
        </button>
      </nav>
    </div>
  );
};
