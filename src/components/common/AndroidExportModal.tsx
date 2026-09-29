import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  Code2,
  FileCode,
  FolderArchive,
  Terminal,
  ExternalLink,
  Layers,
  X,
  Sparkles,
} from 'lucide-react';

interface AndroidExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidExportModal: React.FC<AndroidExportModalProps> = ({ isOpen, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'build' | 'files' | 'report'>('build');

  if (!isOpen) return null;

  const handleDownloadZip = () => {
    setDownloading(true);
    const link = document.createElement('a');
    link.href = '/api/download-android-project';
    link.download = 'EcoScan-Android-Kotlin-Compose.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#064E3B] to-[#00A86B] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">EcoScan Native Android App</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-300 text-emerald-950">
                  Kotlin + Compose
                </span>
              </div>
              <p className="text-xs text-emerald-100">Android Studio Project & APK Build Preparation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4">
          <button
            onClick={() => setActiveTab('build')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'build'
                ? 'border-[#00A86B] text-[#064E3B] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-600" />
            How to Build APK (College Submission)
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'files'
                ? 'border-[#00A86B] text-[#064E3B] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            Project Structure
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'report'
                ? 'border-[#00A86B] text-[#064E3B] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-600" />
            Submission Notes
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'build' && (
            <div className="space-y-4 text-xs text-slate-700">
              {/* Highlight Download Card */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <div className="font-extrabold text-sm text-[#064E3B]">Download Complete Android Project</div>
                  <p className="text-[11px] text-emerald-800">
                    Includes all Gradle scripts, CameraX integrations, Jetpack Compose screens, and Retrofit clients.
                  </p>
                </div>
                <button
                  onClick={handleDownloadZip}
                  disabled={downloading}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#00A86B] hover:bg-emerald-600 text-white font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  {downloading ? 'Preparing ZIP...' : 'Download Project (.ZIP)'}
                </button>
              </div>

              {/* Step by step guide */}
              <div className="space-y-3 pt-2">
                <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Step-by-Step Instructions to Generate APK:
                </div>

                <div className="space-y-2.5 pl-2">
                  <div className="flex gap-3 items-start bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div>
                      <div className="font-bold text-slate-800">Extract and Open in Android Studio</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Extract the downloaded ZIP. Open Android Studio (2024 or newer), select <b>File &gt; Open</b>, and pick the extracted folder. Android Studio will automatically run Gradle sync.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      <div className="font-bold text-slate-800">Click "Build APK"</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        In the top menu, go to:
                        <br />
                        <code className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-mono font-bold mt-1 inline-block">
                          Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)
                        </code>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div>
                      <div className="font-bold text-slate-800">Locate and Submit Your APK</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Android Studio outputs the APK file in under 60 seconds at:
                        <br />
                        <code className="bg-slate-200 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-bold mt-1 inline-block">
                          app/build/outputs/apk/debug/app-debug.apk
                        </code>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-3 text-xs">
              <div className="font-bold text-slate-800">Created Native Project Files:</div>
              <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-[11px] leading-relaxed overflow-x-auto space-y-1">
                <div>📁 android/</div>
                <div className="pl-4">├── 📄 build.gradle.kts (Kotlin DSL Root)</div>
                <div className="pl-4">├── 📄 settings.gradle.kts</div>
                <div className="pl-4">├── 📄 gradle.properties</div>
                <div className="pl-4">├── 📁 gradle/libs.versions.toml (Version Catalog)</div>
                <div className="pl-4">└── 📁 app/</div>
                <div className="pl-8">├── 📄 build.gradle.kts (AGP 8.8, Compose, CameraX)</div>
                <div className="pl-8">├── 📄 proguard-rules.pro</div>
                <div className="pl-8">└── 📁 src/main/</div>
                <div className="pl-12">├── 📄 AndroidManifest.xml (Camera & GPS permissions)</div>
                <div className="pl-12">├── 📁 res/values/ (strings.xml, colors.xml, themes.xml)</div>
                <div className="pl-12">└── 📁 java/com/ecoscan/app/</div>
                <div className="pl-16">├── 📄 MainActivity.kt (ComponentActivity Entry)</div>
                <div className="pl-16">├── 📁 ui/theme/ (Theme.kt, Color.kt)</div>
                <div className="pl-16">├── 📁 ui/screens/ (EcoScanApp.kt: Resident, Collector, Admin, Scanner)</div>
                <div className="pl-16">├── 📁 data/model/ (Models.kt: User, DetectionItem, House, Pickup)</div>
                <div className="pl-16">└── 📁 data/api/ (EcoScanApi.kt: Retrofit client for AI Vision API)</div>
              </div>
            </div>
          )}

          {activeTab === 'report' && (
            <div className="space-y-3 text-xs text-slate-700">
              <div className="font-extrabold text-sm text-slate-900">College Project Submission Details</div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div><b>Project Title:</b> EcoScan - Smart Waste Management & Segregation Platform</div>
                <div><b>Architecture:</b> Native Android with MVVM + Jetpack Compose (Declarative UI)</div>
                <div><b>Language:</b> Kotlin 2.0+ with Coroutines</div>
                <div><b>Key Libraries:</b> CameraX, Jetpack Compose Material 3, Retrofit 2, OkHttp 3, Gson</div>
                <div><b>Target Android SDK:</b> API Level 35 (Android 15) with backwards compatibility down to API 24 (Android 7.0)</div>
                <div><b>Core Features:</b> AI Waste Classification (Dry vs Wet), Recyclability Analysis, Real-time Camera Viewfinder, Collector Live GPS Tracking, Route Optimization, Admin Real-Time Analytics.</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Android Studio 2024+ Ready</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownloadZip}
              className="px-5 py-2 bg-[#00A86B] hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download Project ZIP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
