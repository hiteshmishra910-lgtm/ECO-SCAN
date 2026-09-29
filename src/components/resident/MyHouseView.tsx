import React, { useState, useEffect } from 'react';
import {
  Home,
  MapPin,
  User,
  Phone,
  Truck,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit2,
  Save,
  Navigation,
} from 'lucide-react';
import { House } from '../../types';
import { LeafletMap } from '../common/LeafletMap';

interface MyHouseViewProps {
  residentId?: string;
}

export const MyHouseView: React.FC<MyHouseViewProps> = ({ residentId = 'USR-RES-001' }) => {
  const [house, setHouse] = useState<House | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAddress, setEditedAddress] = useState('');
  const [editedPhone, setEditedPhone] = useState('');

  const fetchHouse = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/resident/house/${residentId}`);
      const data = await res.json();
      if (data.success && data.house) {
        setHouse(data.house);
        setEditedAddress(data.house.address);
        setEditedPhone(data.house.phone);
      }
    } catch (e) {
      console.error('Failed to load house:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouse();
  }, [residentId]);

  const handleSave = async () => {
    if (!house) return;
    try {
      const res = await fetch(`/api/resident/house/${house.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: editedAddress,
          phone: editedPhone,
        }),
      });
      const data = await res.json();
      if (data.success && data.house) {
        setHouse(data.house);
        setIsEditing(false);
      }
    } catch (e) {
      console.error('Failed to update house:', e);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        Loading household profile...
      </div>
    );
  }

  if (!house) {
    return (
      <div className="p-6 text-center text-slate-500 text-xs">
        Household details not found.
      </div>
    );
  }

  const pickupBadgeColor =
    house.pickupStatus === 'COMPLETED'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
      : house.pickupStatus === 'COLLECTOR_ON_WAY'
      ? 'bg-blue-100 text-blue-800 border-blue-300'
      : 'bg-amber-100 text-amber-800 border-amber-300';

  const markers = [
    {
      id: house.id,
      latitude: house.latitude,
      longitude: house.longitude,
      title: house.houseNumber,
      subtitle: house.address,
      type: 'HOUSE' as const,
      status: house.pickupStatus,
    },
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00A86B] to-emerald-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#064E3B]">
                {house.houseNumber}
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pickupBadgeColor}`}>
                {house.pickupStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Household ID: <span className="font-mono font-semibold text-slate-700">{house.id}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (isEditing) handleSave();
            else setIsEditing(true);
          }}
          className="self-start sm:self-auto px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#00A86B] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-emerald-200"
        >
          {isEditing ? (
            <>
              <Save className="w-3.5 h-3.5" />
              Save Details
            </>
          ) : (
            <>
              <Edit2 className="w-3.5 h-3.5" />
              Edit Details
            </>
          )}
        </button>
      </div>

      {/* House Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Resident & Address Information */}
        <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-4">
          <h3 className="text-xs font-black tracking-wider uppercase text-slate-400">
            Household Details
          </h3>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Resident Name</span>
                <span className="text-xs font-bold text-slate-800">{house.residentName}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-[11px] font-medium text-slate-400 block">Contact Phone</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedPhone}
                    onChange={(e) => setEditedPhone(e.target.value)}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg mt-0.5"
                  />
                ) : (
                  <span className="text-xs font-bold text-slate-800">{house.phone}</span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-[11px] font-medium text-slate-400 block">Street Address</span>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={editedAddress}
                    onChange={(e) => setEditedAddress(e.target.value)}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg mt-0.5"
                  />
                ) : (
                  <span className="text-xs font-semibold text-slate-700 leading-snug block">
                    {house.address}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Navigation className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">GPS Coordinates</span>
                <span className="text-xs font-mono font-semibold text-slate-600">
                  {house.latitude.toFixed(4)}° N, {house.longitude.toFixed(4)}° E
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Collector & Next Pickup */}
        <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-4">
          <h3 className="text-xs font-black tracking-wider uppercase text-slate-400">
            Collection & Logistics
          </h3>

          <div className="p-3.5 bg-[#E8F8EF] rounded-2xl border border-[#B7E4C7] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#064E3B] flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#00A86B]" />
                Assigned Collector
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                ACTIVE
              </span>
            </div>
            <div className="text-sm font-extrabold text-slate-800">
              {house.assignedCollectorName || 'Rajesh Kumar'}
            </div>
            <div className="text-[11px] text-slate-600 flex items-center gap-2">
              <span>Vehicle: Tata Ace EV (MH-31-EQ-4421)</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-[10px] font-medium text-slate-400 block uppercase">Next Scheduled Pickup</span>
                  <span className="text-xs font-bold text-slate-800">{house.nextPickupDate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-[10px] font-medium text-slate-400 block uppercase">Last Pickup Recorded</span>
                  <span className="text-xs font-semibold text-slate-700">{house.lastPickupDate || 'Yesterday at 10:45 AM'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* House Location on Interactive Map */}
      <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-[#064E3B]">House Map Location</h3>
            <p className="text-xs text-slate-500">Live GPS pin used by municipal collectors</p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-[#00A86B] rounded-full border border-emerald-200">
            OpenStreetMap Verified
          </span>
        </div>

        <LeafletMap
          center={[house.latitude, house.longitude]}
          zoom={16}
          markers={markers}
          height="280px"
        />
      </div>
    </div>
  );
};
