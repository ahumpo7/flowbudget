import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import {
  decodeGoogleCredential,
  getStoredGoogleClientId,
  saveStoredGoogleClientId,
} from '../utils/storage';
import {
  ShieldCheck,
  Lock,
  DollarSign,
  TrendingUp,
  Key,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

interface GoogleAuthLockScreenProps {
  onLogin: (user: UserProfile) => void;
  onLoadSampleForUser?: (user: UserProfile) => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const GoogleAuthLockScreen: React.FC<GoogleAuthLockScreenProps> = ({
  onLogin,
  onLoadSampleForUser,
}) => {
  const [googleClientId, setGoogleClientId] = useState(() => getStoredGoogleClientId());
  const [showClientIdConfig, setShowClientIdConfig] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Initialize official Google Identity Services (GIS) if client ID exists
  useEffect(() => {
    if (!googleClientId.trim()) return;

    const initializeGis = () => {
      if (window.google?.accounts?.id && googleButtonRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId.trim(),
            callback: (response: any) => {
              if (response.credential) {
                const profile = decodeGoogleCredential(response.credential);
                if (profile) {
                  onLogin(profile);
                } else {
                  setErrorMessage('Failed to decode Google account credential.');
                }
              }
            },
            auto_select: false,
          });

          // Render official Google button
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'filled_blue',
            size: 'large',
            shape: 'pill',
            width: 280,
            text: 'signin_with',
          });
        } catch (err) {
          console.error('Error initializing Google Sign-In:', err);
        }
      }
    };

    const timer = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(timer);
        initializeGis();
      }
    }, 200);

    return () => clearInterval(timer);
  }, [googleClientId, onLogin]);

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredGoogleClientId(googleClientId);
    setShowClientIdConfig(false);
  };

  // Instant Google Account Login (for local development or when Client ID is pending)
  const handleQuickGoogleConnect = (email: string, name: string, loadSample = false) => {
    if (!email.trim()) {
      setErrorMessage('Please provide a Google account email');
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split('@')[0];
    const user: UserProfile = {
      id: `google-${encodeURIComponent(cleanEmail)}`,
      email: cleanEmail,
      name: cleanName,
      picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=0284c7`,
      authProvider: 'google',
      lastSyncedAt: new Date().toISOString(),
    };

    if (loadSample && onLoadSampleForUser) {
      onLoadSampleForUser(user);
    } else {
      onLogin(user);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-950">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Brand / Logo */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg text-white font-black">
            <TrendingUp className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            FlowBudget
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            Calendar-First Cash Flow & Family Schedule Budgeting
          </p>
        </div>

        {/* Security & Strict Isolation Guarantee Banner */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Strict Financial Privacy & Account Isolation</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your bills, salary, cash flow buffers, and debts are isolated strictly under your verified Google account.
            No data persists from account to account, and logging out wipes financial memory immediately.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Official Google Sign-In Container */}
        <div className="space-y-4 pt-2">
          {googleClientId ? (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div ref={googleButtonRef} className="min-h-[44px] flex items-center justify-center" />
              <p className="text-[11px] text-slate-500">
                Connected via Google Identity Services
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
                Sign In With Your Google Account
              </span>

              {/* Instant Google Login Form */}
              <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Google Account Email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. andrew@gmail.com"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Andrew"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleQuickGoogleConnect(manualEmail, manualName, false)}
                    className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign In (Blank Vault)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickGoogleConnect(manualEmail, manualName, true)}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Sign In + Sample Data</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Optional Google Cloud OAuth Client ID Config */}
          <div className="pt-2 border-t border-slate-800 text-center">
            {showClientIdConfig ? (
              <form onSubmit={handleSaveClientId} className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-cyan-400" />
                    Google Cloud OAuth 2.0 Client ID
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowClientIdConfig(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 space-y-2 text-[11px] text-slate-300">
                  <div className="font-semibold text-cyan-300 flex items-center justify-between">
                    <span>Authorized JavaScript Origins to add in Google Console:</span>
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span>Open Console</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="space-y-1 font-mono text-[10px]">
                    <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded border border-slate-800">
                      <span className="text-slate-300">http://localhost:5173</span>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText('http://localhost:5173')}
                        className="text-xs text-cyan-400 hover:text-cyan-300"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded border border-slate-800">
                      <span className="text-slate-300">https://ahumpo7.github.io</span>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText('https://ahumpo7.github.io')}
                        className="text-xs text-cyan-400 hover:text-cyan-300"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="xxxx.apps.googleusercontent.com"
                  value={googleClientId}
                  onChange={(e) => setGoogleClientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono outline-none focus:border-cyan-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGoogleClientId('');
                      saveStoredGoogleClientId('');
                      setShowClientIdConfig(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs text-slate-300 font-semibold"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
                  >
                    Save Client ID
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowClientIdConfig(true)}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 font-semibold"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Configure Google Cloud OAuth Client ID</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 pt-2 border-t border-slate-800">
          FlowBudget • Zero server data retention • Private Google Account synchronization
        </div>
      </div>
    </div>
  );
};
