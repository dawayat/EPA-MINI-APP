import React, { useState } from 'react';
import { Lock, X, LogIn, Eye, EyeOff, Mail, UploadCloud, CheckCircle2, Phone, MapPin, Building2, GraduationCap, CalendarDays, UserRound } from 'lucide-react';
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
  const [profilePhone, setProfilePhone] = useState('');
  const [city, setCity] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [bio, setBio] = useState('');
  const [studentProfile, setStudentProfile] = useState({ university_name: '', field_of_study: '', academic_year: '', student_id_number: '', expected_graduation_year: '' });
  const [corporateProfile, setCorporateProfile] = useState({ organization_name: '', org_type: '', tin_number: '', contact_person: '', contact_title: '', contact_phone: '', contact_email: '', staff_count: '', headquarters_city: '', services_description: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const beginProfileCompletion = (member: Member) => {
    setPendingMember(member);
    setProfilePhoto(null);
    setProfilePhone(member.phone || '');
    setCity(member.city || '');
    setWorkplace(member.workplace || '');
    setSpecialty(member.specialty || '');
    setGender(member.gender || '');
    setDateOfBirth(member.date_of_birth || '');
    setBio(member.bio || '');
    setStudentProfile({
      university_name: member.student_profile?.university_name || '',
      field_of_study: member.student_profile?.field_of_study || '',
      academic_year: member.student_profile?.academic_year ? String(member.student_profile.academic_year) : '',
      student_id_number: member.student_profile?.student_id_number || '',
      expected_graduation_year: member.student_profile?.expected_graduation_year ? String(member.student_profile.expected_graduation_year) : ''
    });
    setCorporateProfile({
      organization_name: member.corporate_profile?.organization_name || '', org_type: member.corporate_profile?.org_type || '', tin_number: member.corporate_profile?.tin_number || '',
      contact_person: member.corporate_profile?.contact_person || '', contact_title: member.corporate_profile?.contact_title || '',
      contact_phone: member.corporate_profile?.contact_phone || '', contact_email: member.corporate_profile?.contact_email || '',
      staff_count: member.corporate_profile?.staff_count ? String(member.corporate_profile.staff_count) : '',
      headquarters_city: member.corporate_profile?.headquarters_city || '', services_description: member.corporate_profile?.services_description || ''
    });
    setMode('profile');
  };

  const needs = pendingMember ? {
    photo: !pendingMember.photo_url,
    phone: !pendingMember.phone,
    city: !pendingMember.city,
    gender: pendingMember.membership_type !== 'CORPORATE' && !pendingMember.gender,
    dateOfBirth: pendingMember.membership_type !== 'CORPORATE' && !pendingMember.date_of_birth,
    workplace: pendingMember.membership_type === 'FULL' && !pendingMember.workplace,
    specialty: pendingMember.membership_type === 'FULL' && !pendingMember.specialty,
    studentUniversity: pendingMember.membership_type === 'STUDENT' && !pendingMember.student_profile?.university_name,
    studentProgramme: pendingMember.membership_type === 'STUDENT' && !pendingMember.student_profile?.field_of_study,
    studentYear: pendingMember.membership_type === 'STUDENT' && !pendingMember.student_profile?.academic_year,
    studentId: pendingMember.membership_type === 'STUDENT' && !pendingMember.student_profile?.student_id_number,
    studentGraduation: pendingMember.membership_type === 'STUDENT' && !pendingMember.student_profile?.expected_graduation_year,
    corporateOrganisation: pendingMember.membership_type === 'CORPORATE' && !pendingMember.corporate_profile?.organization_name,
    corporateType: pendingMember.membership_type === 'CORPORATE' && !pendingMember.corporate_profile?.org_type,
    corporateTin: pendingMember.membership_type === 'CORPORATE' && !pendingMember.corporate_profile?.tin_number,
    corporateContact: pendingMember.membership_type === 'CORPORATE' && !pendingMember.corporate_profile?.contact_person,
    corporateTitle: pendingMember.membership_type === 'CORPORATE' && !pendingMember.corporate_profile?.contact_title,
    corporatePhone: pendingMember.membership_type === 'CORPORATE' && !pendingMember.corporate_profile?.contact_phone,
    corporateEmail: pendingMember.membership_type === 'CORPORATE' && !pendingMember.corporate_profile?.contact_email,
    corporateStaff: pendingMember.membership_type === 'CORPORATE' && !pendingMember.corporate_profile?.staff_count,
    corporateCity: pendingMember.membership_type === 'CORPORATE' && !pendingMember.corporate_profile?.headquarters_city,
    corporateServices: pendingMember.membership_type === 'CORPORATE' && !pendingMember.corporate_profile?.services_description
  } : { photo: false, phone: false, city: false, gender: false, dateOfBirth: false, workplace: false, specialty: false, studentUniversity: false, studentProgramme: false, studentYear: false, studentId: false, studentGraduation: false, corporateOrganisation: false, corporateType: false, corporateTin: false, corporateContact: false, corporateTitle: false, corporatePhone: false, corporateEmail: false, corporateStaff: false, corporateCity: false, corporateServices: false };

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
        if (member.must_change_password) setMode('password');
        else if (member.onboarding_completed === false) beginProfileCompletion(member);
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
      if (member.onboarding_completed === false) beginProfileCompletion(member);
      else await completeLogin(member);
    } catch {
      setError('Connection error. Please try again.');
    } finally { setIsLoading(false); }
  };

  const handleProfileComplete = async () => {
    if (!pendingMember) return;
    setError('');
    if (needs.photo && !profilePhoto) return setError('Please upload a profile photo to finish setting up your membership.');
    setIsLoading(true);
    try {
      const photo_url = profilePhoto ? await uploadFile(profilePhoto) : pendingMember.photo_url;
      const res = await fetch('/api/members', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete-onboarding', id: pendingMember.id, photo_url, phone: profilePhone, city, workplace, specialty, gender, date_of_birth: dateOfBirth, bio,
          student_profile: pendingMember.membership_type === 'STUDENT' ? { ...studentProfile, academic_year: Number(studentProfile.academic_year), expected_graduation_year: Number(studentProfile.expected_graduation_year) } : undefined,
          corporate_profile: pendingMember.membership_type === 'CORPORATE' ? { ...corporateProfile, staff_count: Number(corporateProfile.staff_count) || 0 } : undefined
        })
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
      <div className="w-full max-w-2xl max-h-[92vh] bg-white dark:bg-[#121214] rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
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

        <div className="p-6 space-y-4 overflow-y-auto">
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
            <div className="rounded-2xl border border-[#d4ff00]/30 bg-gradient-to-br from-[#d4ff00]/15 to-transparent p-4">
              <div className="flex items-start gap-3"><div className="w-10 h-10 shrink-0 rounded-xl bg-[#173719] text-[#d4ff00] flex items-center justify-center"><UserRound className="w-5 h-5" /></div><div><p className="text-sm font-black text-gray-900 dark:text-white">Welcome, {pendingMember?.first_name}.</p><p className="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">We preserved the information already imported by EPA. Complete only the missing required details below, then your portal is ready.</p></div></div>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/70 dark:bg-black/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-green-800 dark:text-[#d4ff00]"><CheckCircle2 className="w-3.5 h-3.5" /> Fields marked * are required</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {needs.photo && <div className="sm:col-span-2"><label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Profile photo <span className="text-red-500">*</span></label><label className="flex items-center gap-3 p-3.5 rounded-xl border border-dashed border-gray-300 dark:border-white/20 hover:border-[#d4ff00]/60 cursor-pointer transition-colors"><div className="w-10 h-10 rounded-xl bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] flex items-center justify-center">{profilePhoto ? <CheckCircle2 className="w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}</div><span className="text-xs font-bold text-neutral-600 dark:text-neutral-300 truncate">{profilePhoto?.name || 'Choose a clear profile photo'}</span><input type="file" accept="image/*" className="hidden" onChange={e => setProfilePhoto(e.target.files?.[0] || null)} /></label></div>}
              {needs.phone && <div><label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Phone number <span className="text-red-500">*</span></label><div className="relative"><Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><input value={profilePhone} onChange={e => setProfilePhone(e.target.value)} placeholder="0911223344" className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-700 dark:focus:border-[#d4ff00]" /></div></div>}
              {needs.city && <div><label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">City <span className="text-red-500">*</span></label><div className="relative"><MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Addis Ababa" className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-700 dark:focus:border-[#d4ff00]" /></div></div>}
              {needs.gender && <div><label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Gender <span className="text-red-500">*</span></label><select value={gender} onChange={e => setGender(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-700 dark:focus:border-[#d4ff00]"><option value="">Select gender</option><option value="M">Male</option><option value="F">Female</option></select></div>}
              {needs.dateOfBirth && <div><label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Date of birth <span className="text-red-500">*</span></label><div className="relative"><CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-700 dark:focus:border-[#d4ff00]" /></div></div>}
              {needs.workplace && <div><label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Workplace <span className="text-red-500">*</span></label><div className="relative"><Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><input value={workplace} onChange={e => setWorkplace(e.target.value)} placeholder="Your practice or institution" className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-700 dark:focus:border-[#d4ff00]" /></div></div>}
              {needs.specialty && <div><label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Professional field <span className="text-red-500">*</span></label><input value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="e.g. Counseling Psychology" className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-700 dark:focus:border-[#d4ff00]" /></div>}
            </div>

            {(needs.studentUniversity || needs.studentProgramme || needs.studentYear || needs.studentId || needs.studentGraduation) && <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.03] p-4"><div className="flex items-center gap-2 mb-4"><GraduationCap className="w-4 h-4 text-green-700 dark:text-[#d4ff00]" /><h3 className="text-xs font-black uppercase tracking-wide text-gray-900 dark:text-white">Student record</h3></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {needs.studentUniversity && <div><label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">University <span className="text-red-500">*</span></label><input value={studentProfile.university_name} onChange={e => setStudentProfile(current => ({ ...current, university_name: e.target.value }))} placeholder="University or college" className="w-full px-4 py-3 bg-white dark:bg-black/15 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#d4ff00]" /></div>}
              {needs.studentProgramme && <div><label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Programme / degree <span className="text-red-500">*</span></label><input value={studentProfile.field_of_study} onChange={e => setStudentProfile(current => ({ ...current, field_of_study: e.target.value }))} placeholder="e.g. BSc Psychology" className="w-full px-4 py-3 bg-white dark:bg-black/15 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#d4ff00]" /></div>}
              {needs.studentYear && <div><label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Academic year <span className="text-red-500">*</span></label><input type="number" min="1" max="10" value={studentProfile.academic_year} onChange={e => setStudentProfile(current => ({ ...current, academic_year: e.target.value }))} placeholder="e.g. 3" className="w-full px-4 py-3 bg-white dark:bg-black/15 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#d4ff00]" /></div>}
              {needs.studentGraduation && <div><label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Expected graduation year <span className="text-red-500">*</span></label><input type="number" min="2020" max="2100" value={studentProfile.expected_graduation_year} onChange={e => setStudentProfile(current => ({ ...current, expected_graduation_year: e.target.value }))} placeholder="e.g. 2027" className="w-full px-4 py-3 bg-white dark:bg-black/15 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#d4ff00]" /></div>}
              {needs.studentId && <div className="sm:col-span-2"><label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Student ID number <span className="text-red-500">*</span></label><input value={studentProfile.student_id_number} onChange={e => setStudentProfile(current => ({ ...current, student_id_number: e.target.value }))} placeholder="Your university student ID" className="w-full px-4 py-3 bg-white dark:bg-black/15 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#d4ff00]" /></div>}
            </div></div>}

            {(needs.corporateOrganisation || needs.corporateType || needs.corporateTin || needs.corporateContact || needs.corporateTitle || needs.corporatePhone || needs.corporateEmail || needs.corporateStaff || needs.corporateCity || needs.corporateServices) && <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.03] p-4"><div className="flex items-center gap-2 mb-4"><Building2 className="w-4 h-4 text-green-700 dark:text-[#d4ff00]" /><h3 className="text-xs font-black uppercase tracking-wide text-gray-900 dark:text-white">Organisation record</h3></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {needs.corporateOrganisation && <div><label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Organisation name <span className="text-red-500">*</span></label><input value={corporateProfile.organization_name} onChange={e => setCorporateProfile(current => ({ ...current, organization_name: e.target.value }))} className="w-full px-4 py-3 bg-white dark:bg-black/15 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#d4ff00]" /></div>}
              {needs.corporateType && <div><label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Organisation type <span className="text-red-500">*</span></label><input value={corporateProfile.org_type} onChange={e => setCorporateProfile(current => ({ ...current, org_type: e.target.value }))} placeholder="e.g. Clinic, NGO, University" className="w-full px-4 py-3 bg-white dark:bg-black/15 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#d4ff00]" /></div>}
              {needs.corporateTin && <div><label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">TIN number <span className="text-red-500">*</span></label><input value={corporateProfile.tin_number} onChange={e => setCorporateProfile(current => ({ ...current, tin_number: e.target.value }))} className="w-full px-4 py-3 bg-white dark:bg-black/15 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#d4ff00]" /></div>}
              {needs.corporateStaff && <div><label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Staff count <span className="text-red-500">*</span></label><input type="number" min="1" value={corporateProfile.staff_count} onChange={e => setCorporateProfile(current => ({ ...current, staff_count: e.target.value }))} className="w-full px-4 py-3 bg-white dark:bg-black/15 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#d4ff00]" /></div>}
              {needs.corporateContact && <div><label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Contact person <span className="text-red-500">*</span></label><input value={corporateProfile.contact_person} onChange={e => setCorporateProfile(current => ({ ...current, contact_person: e.target.value }))} className="w-full px-4 py-3 bg-white dark:bg-black/15 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#d4ff00]" /></div>}
              {needs.corporateTitle && <div><label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Contact title <span className="text-red-500">*</span></label><input value={corporateProfile.contact_title} onChange={e => setCorporateProfile(current => ({ ...current, contact_title: e.target.value }))} className="w-full px-4 py-3 bg-white dark:bg-black/15 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#d4ff00]" /></div>}
              {needs.corporatePhone && <div><label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Contact phone <span className="text-red-500">*</span></label><input value={corporateProfile.contact_phone} onChange={e => setCorporateProfile(current => ({ ...current, contact_phone: e.target.value }))} className="w-full px-4 py-3 bg-white dark:bg-black/15 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#d4ff00]" /></div>}
              {needs.corporateEmail && <div><label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Contact email <span className="text-red-500">*</span></label><input type="email" value={corporateProfile.contact_email} onChange={e => setCorporateProfile(current => ({ ...current, contact_email: e.target.value }))} className="w-full px-4 py-3 bg-white dark:bg-black/15 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#d4ff00]" /></div>}
              {needs.corporateCity && <div><label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Headquarters city <span className="text-red-500">*</span></label><input value={corporateProfile.headquarters_city} onChange={e => setCorporateProfile(current => ({ ...current, headquarters_city: e.target.value }))} className="w-full px-4 py-3 bg-white dark:bg-black/15 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#d4ff00]" /></div>}
              {needs.corporateServices && <div className="sm:col-span-2"><label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Services description <span className="text-red-500">*</span></label><textarea value={corporateProfile.services_description} onChange={e => setCorporateProfile(current => ({ ...current, services_description: e.target.value }))} rows={2} placeholder="Briefly describe your services" className="w-full px-4 py-3 bg-white dark:bg-black/15 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#d4ff00] resize-none" /></div>}
            </div></div>}
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
