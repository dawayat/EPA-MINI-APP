import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Award, 
  Calendar, 
  Building, 
  Lock, 
  Sparkles,
  QrCode,
  ExternalLink
} from 'lucide-react';
import { Member } from '../types';
import { verifyMembership } from '../lib/api';
import { memberPhotoUrl, useFallbackMemberPhoto } from '../lib/media';

interface PublicVerifyViewProps {
  lang: 'EN' | 'AM';
  initialToken?: string;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const PublicVerifyView: React.FC<PublicVerifyViewProps> = ({
  lang,
  initialToken = '',
  onToast,
}) => {
  const [tokenInput, setTokenInput] = useState<string>(initialToken || 'epa_tok_9942a17b');
  const [verifiedMember, setVerifiedMember] = useState<Member | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const performVerification = async (tokenToVerify: string) => {
    const clean = tokenToVerify.trim();
    if (!clean) {
      setHasSearched(true);
      setVerifiedMember(null);
      onToast(lang === 'EN' ? 'Enter a membership reference to verify.' : 'የአባልነት መለያ ያስገቡ።', 'error');
      return;
    }
    setIsVerifying(true);
    setHasSearched(true);

    try {
      // Query exactly one public record. The previous implementation downloaded
      // every member (and often every embedded photo) for each verification.
      const match = await verifyMembership(clean);

      setVerifiedMember(match || null);

      if (match) {
        onToast(lang === 'EN' ? 'EPA membership record found.' : 'የEPA አባልነት መረጃ ተገኝቷል!', 'success');
      } else {
        onToast(lang === 'EN' ? 'No active EPA membership record was found for this query.' : 'ምንም መረጃ አልተገኘም::', 'error');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (initialToken) {
      setTokenInput(initialToken);
      void performVerification(initialToken);
    }
  }, [initialToken]);

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4ff00]/10 border border-[#d4ff00]/30 text-green-700 dark:text-[#d4ff00] text-xs font-mono font-bold uppercase mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-green-700 dark:text-[#d4ff00]" />
          <span>{lang === 'EN' ? 'EPA Membership Directory' : 'የEPA አባልነት ማውጫ'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white font-syne uppercase tracking-tight">
          {lang === 'EN' ? 'EPA Membership Verification' : 'የEPA አባልነት ማረጋገጫ'}
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-2">
          {lang === 'EN'
            ? 'Confirm whether an EPA membership record is active. This directory confirms association membership only; it is not a government licensing or accreditation registry.'
            : 'በኢትዮጵያ ውስጥ የስነ-ልቦና ባለሙያዎችን ህጋዊ እውቅና እና የፈቃድ ሁኔታ በቀጥታ ያረጋግጡ።'}
        </p>
      </div>

      {/* Search Bar Input */}
      <div className="max-w-xl mx-auto mb-8">
        <div className="relative flex items-center shadow-2xl rounded-2xl overflow-hidden border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-[#121214]">
          <Search className="w-5 h-5 text-stone-600 dark:text-stone-400 ml-4 shrink-0" />
          <input
            id="input-verify-token"
            type="text"
            placeholder={lang === 'EN' ? 'Enter Token or Membership ID (e.g. EPA-2026-8849)...' : 'የማረጋገጫ ኮድ ወይም መለያ ቁጥር ያስገቡ...'}
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void performVerification(tokenInput)}
            className="w-full px-3 py-4 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none bg-transparent font-mono"
          />
          <button
            id="btn-perform-verify"
            onClick={() => void performVerification(tokenInput)}
            className="px-6 py-4 bg-[#d4ff00] hover:bg-[#c2eb00] text-black text-xs sm:text-sm font-black uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
          >
            {isVerifying ? (lang === 'EN' ? 'Verifying...' : 'በማረጋገጥ ላይ...') : (lang === 'EN' ? 'Verify' : 'አረጋግጥ')}
          </button>
        </div>

        {/* Quick Token Samples */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-stone-600 dark:text-stone-400">
          <span className="font-mono uppercase">{lang === 'EN' ? 'Try Sample IDs:' : 'ናሙና ይሞክሩ፡'}</span>
          <button
            onClick={() => { setTokenInput('EPA-2026-8849'); void performVerification('EPA-2026-8849'); }}
            className="px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-green-700 dark:text-[#d4ff00] font-mono font-semibold cursor-pointer border border-gray-200 dark:border-white/10"
          >
            EPA-2026-8849
          </button>
          <button
            onClick={() => { setTokenInput('EPA-2026-4412'); void performVerification('EPA-2026-4412'); }}
            className="px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-green-700 dark:text-[#d4ff00] font-mono font-semibold cursor-pointer border border-gray-200 dark:border-white/10"
          >
            EPA-2026-4412
          </button>
          <button
            onClick={() => { setTokenInput('EPA-2026-7201'); void performVerification('EPA-2026-7201'); }}
            className="px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-green-700 dark:text-[#d4ff00] font-mono font-semibold cursor-pointer border border-gray-200 dark:border-white/10"
          >
            EPA-2026-7201
          </button>
        </div>
      </div>

      {/* Verification Result Card */}
      {isVerifying ? (
        <div className="max-w-xl mx-auto bg-gray-50 dark:bg-[#121214] rounded-3xl p-8 border border-gray-200 dark:border-white/10 text-center shadow-xl animate-pulse">
          <div className="w-12 h-12 rounded-full bg-[#d4ff00]/20 text-green-700 dark:text-[#d4ff00] flex items-center justify-center mx-auto mb-3 border border-[#d4ff00]/30">
            <ShieldCheck className="w-6 h-6 animate-spin" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white text-base font-syne uppercase">Checking EPA member directory...</h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">Looking for an active EPA membership record</p>
        </div>
      ) : hasSearched && verifiedMember ? (
        <div className="max-w-xl mx-auto bg-gray-50 dark:bg-[#121214] rounded-3xl border-2 border-[#d4ff00] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          {/* Top Verification Seal Header */}
          <div className="bg-[#d4ff00] text-black p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black text-green-700 dark:text-[#d4ff00] flex items-center justify-center border border-black/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-black/70 block">
                  EPA Membership Status
                </span>
                <span className="font-black text-base tracking-tight font-syne uppercase text-black">
                  ACTIVE EPA MEMBER
                </span>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-black text-gray-900 dark:text-white font-mono text-[11px] font-bold">
              {verifiedMember.membership_number}
            </span>
          </div>

          {/* Member Details */}
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-gray-200 dark:border-white/10">
              <img
                src={memberPhotoUrl(verifiedMember.id)}
                alt=""
                onError={useFallbackMemberPhoto}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-[#d4ff00] shadow-md bg-stone-100 dark:bg-stone-900"
              />
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white font-syne uppercase">
                  {verifiedMember.first_name} {verifiedMember.father_name} {verifiedMember.grandfather_name || ''}
                </h3>
                {verifiedMember.amharic_full_name && (
                  <p className="text-xs font-semibold text-green-700 dark:text-[#d4ff00] mt-0.5">
                    {verifiedMember.amharic_full_name}
                  </p>
                )}
                <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] border border-[#d4ff00]/30 text-[10px] font-mono font-bold uppercase">
                  {verifiedMember.membership_type === 'FULL' ? 'Full Professional Member' : verifiedMember.membership_type === 'STUDENT' ? 'Student Member' : 'Corporate Member'}
                </div>
              </div>
            </div>

            {/* Credential Attributes Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-white dark:bg-[#0a0a0c] rounded-xl border border-gray-200 dark:border-white/10">
                <span className="text-stone-600 dark:text-stone-400 font-mono font-semibold uppercase text-[10px] block">{verifiedMember.membership_type === 'STUDENT' ? 'Membership category' : 'Professional field'}</span>
                <span className="font-bold text-gray-900 dark:text-white mt-0.5 block">{verifiedMember.membership_type === 'STUDENT' ? 'Student Member' : (verifiedMember.specialty || 'Psychology')}</span>
              </div>

              <div className="p-3 bg-white dark:bg-[#0a0a0c] rounded-xl border border-gray-200 dark:border-white/10">
                <span className="text-stone-600 dark:text-stone-400 font-mono font-semibold uppercase text-[10px] block">EPA membership reference</span>
                <span className="font-mono font-bold text-green-700 dark:text-[#d4ff00] mt-0.5 block">
                  {verifiedMember.membership_number}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-[#0a0a0c] rounded-xl border border-gray-200 dark:border-white/10">
                <span className="text-stone-600 dark:text-stone-400 font-mono font-semibold uppercase text-[10px] block">Institution / Workplace</span>
                <span className="font-bold text-gray-900 dark:text-white mt-0.5 block">{verifiedMember.workplace}</span>
              </div>

              <div className="p-3 bg-white dark:bg-[#0a0a0c] rounded-xl border border-gray-200 dark:border-white/10">
                <span className="text-stone-600 dark:text-stone-400 font-mono font-semibold uppercase text-[10px] block">Membership valid through</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  Valid Until {new Date(verifiedMember.expires_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Membership record footer */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/10 text-xs text-stone-700 dark:text-stone-300 flex items-start gap-3">
              <Lock className="w-4 h-4 text-green-700 dark:text-[#d4ff00] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold font-syne uppercase text-gray-900 dark:text-white block">EPA membership record</span>
                <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">
                  Checked against the Ethiopian Psychologists’ Association member directory on {new Date().toLocaleString()}. This result confirms EPA membership only and does not verify statutory licensure.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : hasSearched ? (
        <div className="max-w-xl mx-auto bg-gray-50 dark:bg-[#121214] rounded-3xl p-8 border border-red-500/40 text-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-3 border border-red-500/30">
            <XCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white text-base font-syne uppercase">No active EPA membership record</h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 max-w-sm mx-auto">
            The searched membership reference could not be matched with an active EPA member. Please check the spelling or contact EPA.
          </p>
        </div>
      ) : null}
    </div>
  );
};
