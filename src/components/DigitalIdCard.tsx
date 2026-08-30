import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { 
  RotateCw, 
  Share2, 
  Download, 
  Printer, 
  ShieldCheck, 
  CheckCircle, 
  ExternalLink,
  Award,
  Calendar,
  Sparkles,
  QrCode
} from 'lucide-react';
import { Member } from '../types';
import { isTelegramMiniApp } from '../lib/telegram';

interface DigitalIdCardProps {
  member: Member;
  lang: 'EN' | 'AM';
  onVerifyClick: (token: string) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const DigitalIdCard: React.FC<DigitalIdCardProps> = ({
  member,
  lang,
  onVerifyClick,
  onToast,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const isFullMember = member.membership_type === 'FULL';
  const isStudent = member.membership_type === 'STUDENT';
  const verifyUrl = `${window.location.origin}/?verify=${encodeURIComponent(member.verification_token)}`;

  useEffect(() => {
    QRCode.toDataURL(verifyUrl, { width: 320, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#080808', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(error => console.error('[Digital ID] QR generation failed:', error));
  }, [verifyUrl]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(verifyUrl);
      onToast(
        lang === 'EN' 
          ? 'Verification link copied to clipboard!' 
          : 'የማረጋገጫ ማስፈንጠሪያው ወደ ቅንጥብ ሰሌዳ ተቀድቷል!',
        'success'
      );
    }
  };

  const handleDownloadWallet = async () => {
    if (!qrDataUrl) {
      onToast(lang === 'EN' ? 'Preparing your QR code. Please try again in a moment.' : 'የQR ኮድ በመዘጋጀት ላይ ነው።', 'info');
      return;
    }
    setIsDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1600; canvas.height = 1000;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Your browser does not support ID download.');
      const gradient = context.createLinearGradient(0, 0, 1600, 1000);
      gradient.addColorStop(0, '#0a0a0c'); gradient.addColorStop(0.55, '#173719'); gradient.addColorStop(1, '#101712');
      context.fillStyle = gradient; context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = '#d4ff00'; context.lineWidth = 5; context.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);
      context.fillStyle = '#d4ff00'; context.font = '700 32px Arial'; context.fillText('ETHIOPIAN PSYCHOLOGISTS’ ASSOCIATION', 90, 115);
      context.fillStyle = '#ffffff'; context.font = '700 64px Arial'; context.fillText(`${member.first_name} ${member.father_name}`, 90, 265);
      context.fillStyle = '#d4ff00'; context.font = '600 32px Arial'; context.fillText(isStudent ? 'STUDENT MEMBER' : isFullMember ? 'FULL PROFESSIONAL MEMBER' : 'CORPORATE MEMBER', 90, 325);
      context.fillStyle = '#c7d0c7'; context.font = '500 30px Arial'; context.fillText(`Membership No.  ${member.membership_number}`, 90, 410);
      context.fillText(`Status  ${member.status}`, 90, 465);
      context.fillText(`Valid through  ${new Date(member.expires_at).toLocaleDateString()}`, 90, 520);
      context.fillStyle = '#93a493'; context.font = '500 23px Arial'; context.fillText('Scan the QR code to verify this EPA membership record.', 90, 870);
      const qrImage = new Image();
      await new Promise<void>((resolve, reject) => { qrImage.onload = () => resolve(); qrImage.onerror = () => reject(new Error('QR image could not be created.')); qrImage.src = qrDataUrl; });
      context.fillStyle = '#ffffff'; context.fillRect(1120, 180, 350, 350); context.drawImage(qrImage, 1140, 200, 310, 310);
      context.fillStyle = '#d4ff00'; context.font = '700 23px Arial'; context.fillText('SCAN TO VERIFY', 1165, 585);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Could not create your ID image.');
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `EPA-${member.membership_number}-digital-id.png`; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setIsDownloading(false);
      onToast(
        lang === 'EN'
          ? 'Digital EPA Membership Pass downloaded successfully!'
          : 'ዲጂታል የኢሳይባ አባልነት ካርድ በተሳካ ሁኔታ ወርዷል!',
        'success'
      );
    } catch (error: any) {
      console.error('[Digital ID] Download failed:', error);
      onToast(error.message || 'Could not download this ID card.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    if (isTelegramMiniApp()) {
      onToast(lang === 'EN' ? 'Please open in browser to print ID card.' : 'መታወቂያውን ለማተም በብሮውዘር ይክፈቱ', 'info');
      return;
    }
    // Ensure we print the front face of the card
    const wasFlipped = isFlipped;
    if (isFlipped) setIsFlipped(false);
    // Give time for the flip animation to settle before printing
    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        onToast('Printing is not supported in this environment.', 'error');
      }
      // Restore flip state after print dialog closes
      if (wasFlipped) setIsFlipped(true);
    }, 400);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 flex flex-col items-center">
      {/* Header and Controls */}
      <div className="text-center max-w-lg mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/15 text-green-700 dark:text-[#d4ff00] text-xs font-mono font-bold uppercase tracking-widest mb-3">
          <Sparkles className="w-3.5 h-3.5 text-green-700 dark:text-[#d4ff00]" />
          <span>{lang === 'EN' ? 'EPA DIGITAL MEMBERSHIP CARD' : 'የEPA ዲጂታል አባልነት መታወቂያ'}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white font-syne uppercase tracking-tight">
          {lang === 'EN' ? 'Official EPA Digital ID' : 'ይፋዊ የኢሳይባ ዲጂታል መታወቂያ'}
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
          {lang === 'EN' 
            ? 'An association-issued digital card showing an active Ethiopian Psychologists’ Association membership record.'
            : 'በጤና ተቋማት እና በዩኒቨርሲቲዎች ዘንድ ህጋዊ እውቅና ያለው የኢትዮጵያ ሳይኮሎጂ ባለሙያዎች ማኅበር መታወቂያ።'}
        </p>
      </div>

      {/* 3D Card Stage */}
      <div className="relative w-full max-w-md perspective-1000 my-2">
        <div 
          onClick={() => setIsFlipped(!isFlipped)}
          className={`relative w-full aspect-[1.586/1] rounded-3xl cursor-pointer transition-transform duration-700 transform-style-3d select-none shadow-2xl ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* ════════ FRONT OF THE CARD ════════ */}
          <div 
            className="absolute inset-0 w-full h-full rounded-3xl p-5 sm:p-6 text-white flex flex-col justify-between overflow-hidden backface-hidden border border-white/20 shadow-2xl"
            style={{
              backfaceVisibility: 'hidden',
              background: 'linear-gradient(135deg, #0d0d0f 0%, #17171a 50%, #0a0a0c 100%)',
            }}
          >
            {/* Hologram sheen gradient & micro security watermark */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#d4ff00]/5 to-transparent pointer-events-none opacity-60"></div>
            <div className="absolute -right-12 -bottom-12 w-56 h-56 rounded-full border-[18px] border-white/5 pointer-events-none"></div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-[120px] text-black/[0.04] dark:text-white/[0.04] select-none pointer-events-none font-syne">
              EPA
            </div>

            {/* Top row: Association Name & Emblem */}
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white p-0.5 shadow-md flex items-center justify-center border border-[#d4ff00]/40 overflow-hidden">
                  <img src="/epa-logo.png" alt="EPA Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="text-[11px] font-black tracking-wider uppercase text-white font-syne leading-tight">
                    Ethiopian Psychologists’ Association
                  </div>
                  <div className="text-[9px] font-medium text-[#d4ff00]">
                    የኢትዮጵያ ሳይኮሎጂ ባለሙያዎች ማኅበር
                  </div>
                  <div className="text-[8px] tracking-widest text-neutral-400 font-mono mt-0.5 uppercase">
                    FDRE REG. NO. 0492 • EST. 1992
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex flex-col items-end">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold uppercase tracking-wider text-[#d4ff00]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d4ff00] animate-pulse"></span>
                  {member.status}
                </span>
                <span className="text-[9px] text-neutral-400 font-mono mt-0.5">
                  ID: {member.membership_number}
                </span>
              </div>
            </div>

            {/* Middle row: Member Avatar & Credentials */}
            <div className="relative z-10 flex items-center gap-4 my-auto">
              <div className="relative">
                <img 
                  src={member.photo_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'} 
                  alt={member.first_name}
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#d4ff00] shadow-lg bg-black"
                />
                <div className="absolute -bottom-1 -right-1 bg-[#d4ff00] text-black p-0.5 rounded-full shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white font-syne uppercase leading-tight truncate">
                  {member.first_name} {member.father_name} {member.grandfather_name || ''}
                </h3>
                {member.amharic_full_name && (
                  <p className="text-xs font-semibold text-[#d4ff00] truncate">
                    {member.amharic_full_name}
                  </p>
                )}
                
                <div className="inline-block mt-1 px-2.5 py-0.5 rounded bg-white/10 text-[10px] font-mono font-bold tracking-wide uppercase text-white border border-white/15">
                  {isFullMember ? 'Full Professional Member' : isStudent ? 'Student Member' : 'Corporate Member'}
                </div>

                {!isStudent && <div className="text-[10px] text-neutral-300 truncate mt-1">{member.specialty && member.specialty !== 'undefined' ? member.specialty : 'EPA Member'}</div>}
              </div>
            </div>

            {/* Bottom Row: Membership Info, Expiry & CPD */}
            <div className="relative z-10 flex items-end justify-between pt-2 border-t border-white/10 text-[9px]">
              <div>
                <div className="text-neutral-400 uppercase text-[8px] font-mono font-bold">{isStudent ? 'Member class' : 'Member class'}</div>
                <div className="font-mono font-bold text-white tracking-wide">
                  {isStudent ? 'STUDENT MEMBER' : isFullMember ? 'FULL MEMBER' : 'CORPORATE MEMBER'}
                </div>
              </div>

              <div>
                <div className="text-neutral-400 uppercase text-[8px] font-mono font-bold">Valid Period</div>
                <div className="font-mono font-semibold text-neutral-700 dark:text-neutral-200">
                  {new Date(member.expires_at).getFullYear() - 1} — {new Date(member.expires_at).getFullYear()}
                </div>
              </div>

              <div>
                <div className="text-neutral-400 uppercase text-[8px] font-mono font-bold">CPD Credits</div>
                <div className="font-mono font-bold text-[#d4ff00] flex items-center gap-0.5">
                  <Award className="w-2.5 h-2.5" />
                  <span>{member.cpd_points} PTS</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[8px] text-neutral-400 block font-mono uppercase tracking-wider">TAP TO FLIP ↻</span>
              </div>
            </div>
          </div>

          {/* ════════ BACK OF THE CARD ════════ */}
          <div 
            className="absolute inset-0 w-full h-full rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#121214] via-[#161619] to-[#0a0a0c] text-white flex flex-col justify-between overflow-hidden shadow-2xl border border-white/20"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {/* Magnetic Stripe representation */}
            <div className="absolute top-4 left-0 right-0 h-9 bg-black border-y border-white/10"></div>

            <div className="pt-8">
              {/* Security Statement */}
              <div className="text-[8px] text-neutral-400 leading-tight border-b border-white/10 pb-2">
                This card confirms active EPA association membership and the member’s agreement to the EPA Code of Ethics. It does not represent government licensure or accreditation.
              </div>
            </div>

            {/* QR Code Verification Section */}
            <div className="flex items-center justify-between gap-4 my-auto bg-black/5 dark:bg-black/60 p-3.5 rounded-2xl border border-white/10">
              <div className="w-20 h-20 bg-white rounded-xl p-1 flex items-center justify-center shadow-md">
                <div className="relative w-full h-full flex items-center justify-center bg-white border border-neutral-200 rounded-lg">
                  {qrDataUrl ? <img src={qrDataUrl} alt="EPA membership verification QR code" className="w-full h-full object-contain" /> : <QrCode className="w-16 h-16 text-black animate-pulse" />}
                </div>
              </div>

              <div className="flex-1">
                <div className="text-[10px] font-mono font-bold text-[#d4ff00] uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#d4ff00]" />
                  INSTANT SCAN VERIFY
                </div>
                <div className="text-[9px] text-neutral-300 font-mono mt-0.5 break-all">
                  Token: {member.verification_token}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onVerifyClick(member.verification_token);
                  }}
                  className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#d4ff00] hover:bg-[#c3eb00] text-black text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Verify Status Online</span>
                </button>
              </div>
            </div>

            {/* Bottom Signature & Verification Hotline */}
            <div className="flex items-end justify-between pt-2 border-t border-white/10 text-[8px] text-neutral-400">
              <div>
                <span className="font-mono text-[#d4ff00] font-semibold block">Hotline: +251 11 123 4567</span>
                <span>Addis Ababa, Ethiopia</span>
              </div>

              <div className="text-right">
                <div className="italic text-neutral-700 dark:text-neutral-200 font-serif font-bold text-[10px]">
                  Prof. Teshale W.
                </div>
                <span className="text-neutral-600 dark:text-neutral-500 dark:text-neutral-500 uppercase tracking-widest text-[7px] font-mono">President, EPA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Helper Text */}
      <div className="flex items-center gap-2 mt-4 text-xs font-mono font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
        <RotateCw className="w-3.5 h-3.5 text-green-700 dark:text-[#d4ff00] animate-spin-slow" />
        <span>
          {lang === 'EN' ? 'Click card to flip and view QR verification code' : 'ካርዱን በመጫን የQR ማረጋገጫውን ይመልከቱ'}
        </span>
      </div>

      {/* Action Toolbar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl mt-6">
        <button
          id="btn-flip-card"
          onClick={() => setIsFlipped(!isFlipped)}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/15 text-gray-900 dark:text-white hover:bg-black/10 dark:bg-white/10 text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
        >
          <RotateCw className="w-4 h-4 text-green-700 dark:text-[#d4ff00]" />
          <span>{lang === 'EN' ? 'Flip Card' : 'ካርዱን አዙር'}</span>
        </button>

        <button
          id="btn-share-id"
          onClick={handleShare}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/15 text-gray-900 dark:text-white hover:bg-black/10 dark:bg-white/10 text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
        >
          <Share2 className="w-4 h-4 text-green-700 dark:text-[#d4ff00]" />
          <span>{lang === 'EN' ? 'Share Link' : 'ሊንኩን አጋራ'}</span>
        </button>

        <button
          id="btn-download-pass"
          onClick={handleDownloadWallet}
          disabled={isDownloading}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#d4ff00] hover:bg-[#c3eb00] text-black text-xs font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Download className="w-4 h-4 text-black" />
          <span>{isDownloading ? (lang === 'EN' ? 'Saving...' : 'በማውረድ ላይ...') : (lang === 'EN' ? 'Save Pass' : 'ካርዱን አስቀምጥ')}</span>
        </button>

        <button
          id="btn-print-id"
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/15 text-gray-900 dark:text-white hover:bg-black/10 dark:bg-white/10 text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
        >
          <Printer className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
          <span>{lang === 'EN' ? 'Print Card' : 'ካርድ አትም'}</span>
        </button>
      </div>

      {/* Membership record card */}
      <div className="w-full max-w-xl mt-8 bg-[#141416] border border-gray-200 dark:border-white/10 rounded-2xl p-5 flex items-start gap-4">
        <div className="p-2.5 bg-[#d4ff00]/10 border border-[#d4ff00]/30 text-green-700 dark:text-[#d4ff00] rounded-xl shrink-0">
          <CheckCircle className="w-5 h-5" />
        </div>
        <div className="text-xs text-gray-900 dark:text-white">
          <span className="font-black font-syne uppercase tracking-tight block text-sm mb-1 text-gray-900 dark:text-white">
            {lang === 'EN' ? 'Official EPA Membership Record' : 'ይፋዊ የEPA አባልነት መረጃ'}
          </span>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {lang === 'EN'
              ? 'This card confirms active membership in the Ethiopian Psychologists’ Association. It is not a government professional licence or accreditation credential.'
              : 'ይህ መታወቂያ በጤና ሚኒስቴር እና በትምህርት ሚኒስቴር ዳታቤዝ የተረጋገጠ ሲሆን በማንኛውም የህክምና እና የትምህርት ተቋም ተቀባይነት አለው።'}
          </p>
        </div>
      </div>
    </div>
  );
};
