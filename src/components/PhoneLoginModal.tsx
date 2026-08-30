import React, { useState } from 'react';
import { Lock, X, LogIn, Eye, EyeOff, Mail, UploadCloud, CheckCircle2 } from 'lucide-react';
import { Member } from '../types';
import { uploadFile } from '../lib/api';

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
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'password' | 'profile'>('login');
  const [pendingMember, setPendingMember] = useState<Member | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [city, setCity] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [bio, setBio] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const completeLogin = async (member: Member) => {
    const telegramId = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id;
    if (telegramId && String(member.telegram_id || '') !== String(telegramId)) {
      try {
        await fetch('/api/auth', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'bind-telegram', memberId: member.id, telegramId })
        });
      } catch { /* Login should still succeed if Telegram capture is unavailable. */ }
    }
    onToast(lang === 'EN' ? `Welcome back, ${member.first_name}!` : `እንኳን ደህና መጡ, ${member.first_name}!`, 'success');
    onSuccess(member);
    onClose();
  };

  const handleLogin = async () => {
    setError('');
    if (!identifier.trim()) {
      setError('Please enter your email address or phone number.');
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
        body: JSON.stringify({ identifier: identifier.trim(), password, action: 'login' })
      });
      const data = await res.json();

      if (data.success && data.member) {
        const member = data.member as Member;
        setPendingMember(member);
        if (member.must_change_password) setMode('password');
        else if (member.onboarding_completed === false) setMode('profile');
        else await completeLogin(member);
      } else {
        setError(data.error || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      setError('Connection error. Please check your internet and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setError('');
    if (newPassword.length < 8) return setError('Use a new password with at least 8 characters.');
    if (newPassword !== confirmPassword) return setError('The new passwords do not match.');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change-password', identifier: identifier.trim(), currentPassword: password, newPassword })
      });
      const data = await res.json();
      if (!data.success || !data.member) return setError(data.error || 'Could not update your password.');
      const member = data.member as Member;
      setPendingMember(member);
      if (member.onboarding_completed === false) setMode('profile');
      else await completeLogin(member);
    } catch {
      setError('Connection error. Please try again.');
    } finally { setIsLoading(false); }
  };

  const handleProfileComplete = async () => {
    if (!pendingMember) return;
    setError('');
    if (!profilePhoto) return setError('Please upload a profile photo to finish setting up your membership.');
    setIsLoading(true);
    try {
      const photo_url = await uploadFile(profilePhoto);
      const res = await fetch('/api/members', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete-onboarding', id: pendingMember.id, photo_url, city, workplace, bio })
      });
      const data = await res.json();
      if (!data.success || !data.member) return setError(data.error || 'Could not save your member profile.');
      await completeLogin(data.member as Member);
    } catch {
      setError('Could not upload your profile information. Please try again.');
    } finally { setIsLoading(false); }
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
                {mode === 'login' ? (lang === 'EN' ? 'Use your email or phone number & password' : 'ኢሜይልዎን ወይም ስልክ ቁጥርዎን ይጠቀሙ') : mode === 'password' ? 'Choose a secure new password' : 'Complete your membership profile'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {mode === 'login' && <>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
              {lang === 'EN' ? 'Email or Phone Number' : 'ኢሜይል ወይም ስልክ ቁጥር'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="name@email.com or 0911223344"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-700 dark:focus:border-[#d4ff00] transition-all font-medium"
              />
            </div>
          </div>

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
          </>}

          {mode === 'password' && <>
            <div className="rounded-xl border border-[#d4ff00]/30 bg-[#d4ff00]/5 p-3 text-xs text-neutral-600 dark:text-neutral-300">For security, replace the temporary password supplied by EPA before entering your portal.</div>
            {['New password', 'Confirm new password'].map((label, index) => <div key={label}>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">{label}</label>
              <div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><input type={showPassword ? 'text' : 'password'} value={index ? confirmPassword : newPassword} onChange={e => index ? setConfirmPassword(e.target.value) : setNewPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePasswordChange()} className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-700 dark:focus:border-[#d4ff00]" /></div>
            </div>)}
          </>}

          {mode === 'profile' && <>
            <div className="rounded-xl border border-[#d4ff00]/30 bg-[#d4ff00]/5 p-3 text-xs text-neutral-600 dark:text-neutral-300">Welcome, {pendingMember?.first_name}. Add your photo and a few details to activate your member profile.</div>
            <label className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-300 dark:border-white/20 hover:border-[#d4ff00]/60 cursor-pointer"><div className="w-10 h-10 rounded-xl bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] flex items-center justify-center">{profilePhoto ? <CheckCircle2 className="w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}</div><span className="text-xs font-bold text-neutral-600 dark:text-neutral-300 truncate">{profilePhoto?.name || 'Upload a profile photo *'}</span><input type="file" accept="image/*" className="hidden" onChange={e => setProfilePhoto(e.target.files?.[0] || null)} /></label>
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="City (optional)" className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-700 dark:focus:border-[#d4ff00]" />
            <input value={workplace} onChange={e => setWorkplace(e.target.value)} placeholder="Workplace / university (optional)" className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-700 dark:focus:border-[#d4ff00]" />
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="A short professional introduction (optional)" rows={2} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-700 dark:focus:border-[#d4ff00] resize-none" />
          </>}

          {error && (
            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/20 p-3 rounded-xl">
              {error}
            </div>
          )}

          {mode !== 'profile' && <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-700 dark:hover:text-white">{showPassword ? 'Hide passwords' : 'Show passwords'}</button>}
          <button
            onClick={mode === 'login' ? handleLogin : mode === 'password' ? handlePasswordChange : handleProfileComplete}
            disabled={isLoading}
            className="w-full py-3.5 bg-[#d4ff00] text-black font-black uppercase text-xs rounded-xl shadow-[0_0_20px_rgba(212,255,0,0.3)] hover:shadow-[0_0_30px_rgba(212,255,0,0.5)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                {mode === 'profile' ? 'Saving profile…' : mode === 'password' ? 'Updating password…' : (lang === 'EN' ? 'Logging in...' : 'እየተገባ ነው...')}
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                {mode === 'profile' ? 'Complete profile & enter portal' : mode === 'password' ? 'Save new password' : (lang === 'EN' ? 'Login to Portal' : 'ወደ ፖርታሉ ግባ')}
              </>
            )}
          </button>

          {mode === 'login' && <p className="text-center text-xs text-neutral-400 dark:text-neutral-500">
            {lang === 'EN'
              ? 'Password was set during registration. Contact EPA if you forgot it.'
              : 'የይለፍ ቃሉ በምዝገባ ጊዜ ተቀናጅቷል። ካልዘከሩ EPA ን ያናግሩ።'}
          </p>}
        </div>
      </div>
    </div>
  );
};
