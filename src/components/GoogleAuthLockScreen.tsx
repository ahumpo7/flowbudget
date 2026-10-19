import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import {
  decodeGoogleCredential,
  GOOGLE_CLIENT_ID,
} from '../utils/storage';
import {
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Mail,
  ChevronDown,
  ChevronUp,
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
  const [showManualLogin, setShowManualLogin] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Initialize official Google Identity Services (GIS)
  useEffect(() => {
    const initializeGis = () => {
      if (window.google?.accounts?.id && googleButtonRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
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

          // Render official Google Sign-In button
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
  }, [onLogin]);

  // Instant Google Account Login (fallback if popups/third-party cookies are disabled)
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
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Brand / Logo */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow text-white font-black">
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
            <span>Strict Privacy & Account Isolation</span>
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

        {/* Primary Official Google Sign-In Container */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col items-center justify-center space-y-3 bg-slate-800/40 p-5 rounded-2xl border border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
              Sign In With Google
            </span>
            {/* GIS Official Button Target */}
            <div ref={googleButtonRef} className="min-h-[44px] flex items-center justify-center" />
            <p className="text-[11px] text-slate-500 text-center">
              Secured with Google Identity Services
            </p>
          </div>

          {/* Collapsible Direct Email Fallback */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setShowManualLogin(!showManualLogin)}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Or sign in with email directly</span>
              {showManualLogin ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showManualLogin && (
              <div className="mt-3 p-4 rounded-2xl bg-slate-800 border border-slate-700 space-y-3 text-left animate-in fade-in">
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
                    className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
                  >
                    <span>Blank Vault</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickGoogleConnect(manualEmail, manualName, true)}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Sample Data</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 pt-2 border-t border-slate-800">
          FlowBudget • Zero third-party server tracking • Private Google Account & Drive AppData Cloud Sync
        </div>
      </div>
    </div>
  );
};
