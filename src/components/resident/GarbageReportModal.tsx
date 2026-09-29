import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  MapPin,
  AlertTriangle,
  X,
  CheckCircle,
  Loader2,
  Navigation,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GarbageReport } from '../../types';

interface GarbageReportModalProps {
  onClose: () => void;
  onReportSubmitted?: (report: GarbageReport) => void;
}

export const GarbageReportModal: React.FC<GarbageReportModalProps> = ({
  onClose,
  onReportSubmitted,
}) => {
  const { user } = useAuth();

  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('Near Sector 4 Junction, Nagpur');
  const [latitude, setLatitude] = useState<number>(21.1462);
  const [longitude, setLongitude] = useState<number>(79.0888);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Capture GPS Location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocating(false);
        setError('Location permission denied or unavailable. Using default landmark coordinates.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a brief description of the garbage or overflow.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        residentId: user?.id || 'USR-RES-001',
        houseId: user?.houseId || 'H-101',
        image: image || '',
        latitude,
        longitude,
        description,
        address,
      };

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.report) {
        setSubmitted(true);
        if (onReportSubmitted) {
          onReportSubmitted(data.report);
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.message || 'Failed to submit report.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error while submitting report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl border border-emerald-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#064E3B]">Report Garbage</h3>
              <p className="text-[11px] text-slate-500">Alert municipality of litter or illegal dumping</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#00A86B] mx-auto flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="text-base font-extrabold text-[#064E3B]">Report Submitted!</h4>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Your report has been forwarded to the local collector fleet and municipal admin for rapid pickup.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {error}
              </div>
            )}

            {/* Photo Capture / Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Garbage Photo (Optional)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-emerald-200 rounded-2xl bg-emerald-50/40 hover:bg-emerald-50/80 cursor-pointer flex flex-col items-center justify-center transition-colors overflow-hidden"
              >
                {image ? (
                  <img src={image} alt="Report Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center space-y-1.5 text-slate-500">
                    <Camera className="w-6 h-6 text-[#00A86B]" />
                    <span className="text-xs font-semibold text-[#00A86B]">Take Photo / Upload Image</span>
                    <span className="text-[10px] text-slate-400">Tap to browse files or camera</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description / Type of Waste *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Overflowing garbage bin with cardboard boxes and plastic bags on corner of pavement."
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A86B]"
              />
            </div>

            {/* Location & GPS */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Location / Landmark *</label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={locating}
                  className="text-xs font-bold text-[#00A86B] hover:underline flex items-center gap-1"
                >
                  <Navigation className="w-3 h-3" />
                  {locating ? 'Acquiring GPS...' : 'Use Current GPS'}
                </button>
              </div>

              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address or nearby landmark"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A86B]"
              />

              <div className="mt-1 text-[10px] text-slate-400 font-mono">
                Coordinates: {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'SUBMIT REPORT'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
