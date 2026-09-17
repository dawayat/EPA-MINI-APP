import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, ShieldCheck, X } from 'lucide-react';
import { signInAdmin } from '../lib/admin';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
  onToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onAuthenticated, onToast }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setPassword('');
    setShowPassword(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password) return;
    setIsSubmitting(true);
    const result = await signInAdmin(username.trim(), password);
    setIsSubmitting(false);
    if (!result.success) {
      onToast(result.error || 'Admin sign-in failed.', 'error');
      return;
    }
    setPassword('');
    onToast('Admin session started.', 'success');
    onAuthenticated();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-gray-50 dark:bg-[#121214] border border-white/20 shadow-2xl overflow-hidden">
        <div className="p-6 sm:p-7 border-b border-gray-200 dark:border-white/10 flex items-start justify-between">
          <div>
            <div className="w-11 h-11 rounded-2xl bg-[#d4ff00]/15 flex items-center justify-center border border-[#d4ff00]/30"><ShieldCheck className="w-5 h-5 text-green-700 dark:text-[#d4ff00]" /></div>
            <h2 className="mt-4 text-xl font-black font-syne uppercase text-gray-900 dark:text-white">Admin sign in</h2>
            <p className="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">Use the EPA administrator credentials configured for this deployment.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl text-neutral-500 hover:bg-black/5 dark:hover:bg-white/10" aria-label="Close admin sign in"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 sm:p-7 space-y-4">
          <label className="block"><span className="block mb-1.5 text-[10px] font-mono font-black uppercase tracking-wider text-neutral-500">Username</span><input autoFocus autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d4ff00]" /></label>
          <label className="block"><span className="block mb-1.5 text-[10px] font-mono font-black uppercase tracking-wider text-neutral-500">Password</span><span className="relative block"><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black px-4 py-3 pr-11 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d4ff00]" /><button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></span></label>
          <button disabled={isSubmitting || !username.trim() || !password} className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#d4ff00] px-4 py-3.5 text-xs font-black uppercase tracking-wider text-black disabled:opacity-50"><LockKeyhole className="w-4 h-4" />{isSubmitting ? 'Signing in…' : 'Open admin portal'}</button>
        </div>
      </form>
    </div>
  );
};
