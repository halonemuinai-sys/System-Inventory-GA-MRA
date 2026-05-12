'use client';

import { useState } from 'react';
import { login } from './actions';
import { Package, Lock, Mail, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const { dark } = useTheme();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const formData = new FormData(e.currentTarget);
    const result = await login(formData);
    
    if (result?.error) {
      setErrorMsg(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="login-container min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Dark Overlay (without blur) so the background image stays sharp */}
      <div className="absolute inset-0 bg-slate-950/50" />

      <div className="relative z-10 w-full max-w-md p-8">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4">
              <img 
                src="/logo-mra.png" 
                alt="Logo MRA Group" 
                className="h-20 w-auto object-contain drop-shadow-[0_4px_10px_rgba(255,255,255,0.15)]" 
              />
            </div>
            <h1 className="text-2xl font-800 text-white letter-tight">MRA Inventory</h1>
            <p className="text-slate-300 text-sm mt-1">General Affairs Management</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3 bg-rose-light border border-rose-border text-rose rounded-lg text-sm flex items-center gap-2">
              <div className="w-1 h-full bg-rose rounded-full" />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="sp-field">
              <label className="sp-label uppercase letter-wide text-xs text-slate-300">Email</label>
              <div className="sp-input-wrap">
                <Mail size={16} className="sp-input-icon" />
                <input 
                  type="email" 
                  name="email"
                  required
                  placeholder="Masukkan email Anda"
                  className="sp-input !bg-white/10 !border-white/10 !text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="sp-field">
              <label className="sp-label uppercase letter-wide text-xs text-slate-300">Password</label>
              <div className="sp-input-wrap">
                <Lock size={16} className="sp-input-icon" />
                <input 
                  type={showPwd ? 'text' : 'password'}
                  name="password"
                  required
                  placeholder="••••••••"
                  className="sp-input !bg-white/10 !border-white/10 !text-white placeholder:text-slate-500"
                />
                <button type="button" className="sp-eye-btn" onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue focus:ring-blue" />
                <span className="text-xs font-500 text-slate-300">Remember me</span>
              </label>
              <a href="#" className="text-xs font-600 text-blue-400 hover:text-blue-300 transition-colors">
                Forgot password?
              </a>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="mt-4 w-full bg-blue hover:bg-blue-d text-white font-600 rounded-xl py-3 px-4 flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-glow disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

        </div>
        
        <p className="text-center text-[10px] text-white/50 mt-8 font-600 tracking-widest uppercase">
          © 2026 <span className="text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]">MRA Group</span>. All rights reserved.
        </p>
      </div>
    </div>
  );
}
