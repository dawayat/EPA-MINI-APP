import React, { useState } from 'react';
import { Phone, Lock, X, LogIn, Eye, EyeOff } from 'lucide-react';
import { Member } from '../types';

interface PhoneLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'EN' | 'AM';
  onSuccess: (member: Member) => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const PhoneLoginModal: React.FC<PhoneLoginModalProps> = ({
  isOpen, onClose, lang, onSuccess, onToast
}) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = async () => {
    setError('');
    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), password, action: 'login' })
      });
      const data = await res.json();

      if (data.success && data.member) {
        onToast(
          lang === 'EN' ? `Welcome back, ${data.member.first_name}!` : `እንኳን ደህና መጡ, ${data.member.first_name}!`,
          'success'
        );
        onSuccess(data.member as Member);
        onClose();
      } else {
        setError(data.error || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      setError('Connection error. Please check your internet and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm bg-white dark:bg-[#121214] rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-gray-100 dark:border-white/10">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#d4ff00]/10 border border-[#d4ff00]/30 rounded-2xl flex items-center justify-center">
              <LogIn className="w-5 h-5 text-green-700 dark:text-[#d4ff00]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight font-syne">
                {lang === 'EN' ? 'Member Login' : 'አባል መግቢያ'}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {lang === 'EN' ? 'Use your phone number & password' : 'ስልክ ቁጥርዎ እና የይለፍ ቃልዎ'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Phone */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
              {lang === 'EN' ? 'Phone Number' : 'ስልክ ቁጥር'}
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="tel"
                placeholder="e.g. 0911223344"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-700 dark:focus:border-[#d4ff00] transition-all font-medium"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
              {lang === 'EN' ? 'Password' : 'የይለፍ ቃል'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-700 dark:focus:border-[#d4ff00] transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/20 p-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full py-3.5 bg-[#d4ff00] text-black font-black uppercase text-xs rounded-xl shadow-[0_0_20px_rgba(212,255,0,0.3)] hover:shadow-[0_0_30px_rgba(212,255,0,0.5)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                {lang === 'EN' ? 'Logging in...' : 'እየተገባ ነው...'}
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                {lang === 'EN' ? 'Login to Portal' : 'ወደ ፖርታሉ ግባ'}
              </>
            )}
          </button>

          <p className="text-center text-xs text-neutral-400 dark:text-neutral-500">
            {lang === 'EN'
              ? 'Password was set during registration. Contact EPA if you forgot it.'
              : 'የይለፍ ቃሉ በምዝገባ ጊዜ ተቀናጅቷል። ካልዘከሩ EPA ን ያናግሩ።'}
          </p>
        </div>
      </div>
    </div>
  );
};
