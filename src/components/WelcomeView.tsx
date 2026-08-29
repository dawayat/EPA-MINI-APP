import React from 'react';
import { 
  GraduationCap, 
  UserCheck, 
  Building2, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  BookOpen, 
  Award, 
  Sparkles, 
  Globe, 
  HeartHandshake, 
  FileText,
  Calendar,
  Layers,
  Search
} from 'lucide-react';
import { MEMBERSHIP_TYPES } from '../data/mockData';
import { Announcement, MembershipTypeCode } from '../types';

interface WelcomeViewProps {
  lang: 'EN' | 'AM';
  announcements: Announcement[];
  onSelectMembership: (code: MembershipTypeCode) => void;
  onOpenDirectory: () => void;
  onOpenVerify: () => void;
  onOpenIdCard: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  lang,
  announcements,
  onSelectMembership,
  onOpenDirectory,
  onOpenVerify,
  onOpenIdCard,
}) => {
  return (
    <div className="w-full bg-white dark:bg-[#080808] text-gray-900 dark:text-white">
      {/* ════════ HERO SECTION ════════ */}
      <section className="relative overflow-hidden bg-white dark:bg-[#080808] text-gray-900 dark:text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 grid-lines-bg border-b border-gray-200 dark:border-white/10">
        {/* Background ambient lighting effects */}
        
        {/* EXPERIMENTAL: SUNRISE / SUNSET VIBE FOR LIGHT MODE */}
        {/* If you dislike this, delete this block and uncomment the 'ORIGINAL VIBE' block below */}
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-100 via-rose-50 to-purple-100 dark:hidden opacity-70 pointer-events-none"></div>
        <div className="absolute -top-20 left-1/4 w-[500px] h-[500px] bg-orange-400/20 dark:hidden rounded-full blur-3xl pointer-events-none mix-blend-multiply"></div>
        <div className="absolute -bottom-20 right-1/4 w-[500px] h-[500px] bg-purple-400/20 dark:hidden rounded-full blur-3xl pointer-events-none mix-blend-multiply"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-rose-400/10 dark:hidden blur-3xl pointer-events-none mix-blend-multiply"></div>

        {/* ORIGINAL VIBE (Currently active only in dark mode) */}
        {/* To revert the light mode completely to original, use the code below instead of the above. */}
        {/*
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#d4ff00]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-black/5 dark:bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        */}
        
        {/* Dark mode only original orbs (so dark mode still looks good while testing sunset in light mode) */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#d4ff00]/5 hidden dark:block rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 hidden dark:block rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/5 dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/15 text-green-700 dark:text-[#d4ff00] text-xs font-mono font-bold uppercase tracking-widest mb-6">
              <span className="flex h-2 w-2 rounded-full bg-[#d4ff00] animate-pulse"></span>
              <span>{lang === 'EN' ? 'OFFICIAL NATIONAL REGISTRY • EST. 1999' : 'ብሔራዊ የስነ-ልቦና ባለሙያዎች ማኅበር'}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black font-syne uppercase tracking-tight leading-[1.05] text-gray-900 dark:text-white">
              {lang === 'EN' ? (
                <>
                  Advancing Psychology & Mental Health in <span className="text-green-700 dark:text-[#d4ff00]">Ethiopia</span>
                </>
              ) : (
                <>
                  የስነ-ልቦና ሙያን እና የአእምሮ ጤናን በ<span className="text-green-700 dark:text-[#d4ff00]">ኢትዮጵያ</span> እናሳድጋለን
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-lg text-neutral-700 dark:text-neutral-300 font-normal leading-relaxed max-w-2xl">
              {lang === 'EN'
                ? 'The official professional regulatory council for Ethiopian psychologists, researchers, clinicians, and students. Verified digital accreditation credentials, CPD tracking, and national member directory.'
                : 'ለኢትዮጵያ ስነ-ልቦና ባለሙያዎች፣ ተመራማሪዎች እና ተማሪዎች የተዘጋጀ ይፋዊ መድረክ። አባል በመሆን የሙያ እውቅና ያግኙ፤ ዲጂታል መታወቂያዎን ይያዙ።'}
            </p>

            {/* Hero CTAs */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 w-full max-w-lg">
              <button
                id="hero-apply-btn"
                onClick={() => onSelectMembership('FULL')}
                className="flex-1 min-w-[180px] flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#d4ff00] hover:bg-[#c3eb00] text-black text-xs font-black uppercase tracking-wider shadow-xl shadow-[#d4ff00]/15 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
              >
                <span>{lang === 'EN' ? 'Apply for Membership' : 'አባል ለመሆን ያመልክቱ'}</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>

              <button
                id="hero-verify-btn"
                onClick={onOpenVerify}
                className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 backdrop-blur-md border border-white/20 text-gray-900 dark:text-white text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-green-700 dark:text-[#d4ff00]" />
                <span>{lang === 'EN' ? 'Verify License / ID' : 'መታወቂያ ያረጋግጡ'}</span>
              </button>
            </div>

            {/* Quick trust metrics */}
            <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full pt-10 border-t border-gray-200 dark:border-white/10 text-center">
              <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                <div className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white font-syne">1,280+</div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mt-1">{lang === 'EN' ? 'Accredited Members' : 'እውቅና ያላቸው ባለሙያዎች'}</div>
              </div>
              <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                <div className="text-3xl sm:text-4xl font-black text-green-700 dark:text-[#d4ff00] font-syne">24</div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mt-1">{lang === 'EN' ? 'University Chapters' : 'የዩኒቨርሲቲ ቅርንጫፎች'}</div>
              </div>
              <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                <div className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white font-syne">100%</div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mt-1">{lang === 'EN' ? 'Biometric QR Verified' : 'የተረጋገጠ ዲጂታል መታወቂያ'}</div>
              </div>
              <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                <div className="text-3xl sm:text-4xl font-black text-green-700 dark:text-[#d4ff00] font-syne">4,800+</div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mt-1">{lang === 'EN' ? 'Annual CPD Hours' : 'የሙያ ማሻሻያ ሰዓታት'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ MEMBERSHIP TIERS SECTION ════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-mono font-black uppercase tracking-widest text-green-700 dark:text-[#d4ff00] bg-black/5 dark:bg-white/5 px-3.5 py-1 rounded-full border border-gray-200 dark:border-white/10">
            {lang === 'EN' ? 'MEMBERSHIP CATEGORIES' : 'የአባልነት ዘርፎች'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mt-3 font-syne uppercase tracking-tight">
            {lang === 'EN' ? 'Select Your Professional Track' : 'የሙያ ደረጃዎን ይምረጡ'}
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
            {lang === 'EN'
              ? 'Transparent annual membership fees supporting psychological research, advocacy, and clinical standardization in Ethiopia.'
              : 'በኢትዮጵያ ውስጥ የስነ-ልቦና ጥናትና ምርምርን እንዲሁም የባለሙያዎችን መብት የሚያስጠብቅ ዓመታዊ የአባልነት ክፍያ።'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MEMBERSHIP_TYPES.map((type) => {
            const isFull = type.code === 'FULL';
            const isStudent = type.code === 'STUDENT';
            
            return (
              <div
                key={type.code}
                id={`membership-tier-card-${type.code}`}
                className={`relative flex flex-col justify-between bg-gray-50 dark:bg-[#121214] rounded-3xl p-7 border transition-all duration-200 shadow-xl ${
                  isFull 
                    ? 'border-[#d4ff00] ring-1 ring-[#d4ff00]/40' 
                    : 'border-gray-200 dark:border-white/10 hover:border-white/20'
                }`}
              >
                {/* Popular Pill */}
                {isFull && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#d4ff00] text-black text-[10px] font-black uppercase tracking-widest shadow-md">
                    {lang === 'EN' ? 'MOST POPULAR' : 'ተመራጭ'}
                  </div>
                )}

                <div>
                  {/* Card Header Icon & Name */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      isFull 
                        ? 'bg-[#d4ff00]/15 text-green-700 dark:text-[#d4ff00] border border-[#d4ff00]/30' 
                        : 'bg-black/5 dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10'
                    }`}>
                      {isStudent && <GraduationCap className="w-6 h-6" />}
                      {isFull && <UserCheck className="w-6 h-6" />}
                      {type.code === 'CORPORATE' && <Building2 className="w-6 h-6" />}
                    </div>

                    <span className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-400 uppercase">
                      {type.period}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-gray-900 dark:text-white font-syne uppercase">
                    {lang === 'EN' ? type.name : type.amharicName}
                  </h3>

                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 min-h-[42px] leading-relaxed">
                    {lang === 'EN' ? type.description : type.amharicDescription}
                  </p>

                  {/* Pricing tag */}
                  <div className="my-6 py-4 border-y border-gray-200 dark:border-white/10 flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white font-syne">
                      {type.fee.toLocaleString()}
                    </span>
                    <span className="text-sm font-black text-green-700 dark:text-[#d4ff00]">
                      {type.currency}
                    </span>
                    <span className="text-xs text-neutral-600 dark:text-neutral-500 dark:text-neutral-500 font-medium ml-1">
                      / {lang === 'EN' ? 'year' : 'ዓመት'}
                    </span>
                  </div>

                  {/* Requirements & Benefits */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 block mb-2">
                        {lang === 'EN' ? 'KEY BENEFITS' : 'ዋና ጥቅሞች'}
                      </span>
                      <ul className="space-y-2">
                        {type.benefits.slice(0, 3).map((b, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-700 dark:text-[#d4ff00] shrink-0 mt-0.5" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  id={`apply-tier-btn-${type.code}`}
                  onClick={() => onSelectMembership(type.code)}
                  className={`w-full py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isFull
                      ? 'bg-[#d4ff00] hover:bg-[#c3eb00] text-black shadow-lg shadow-[#d4ff00]/15'
                      : 'bg-black/10 dark:bg-white/10 hover:bg-white/15 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10'
                  }`}
                >
                  <span>{lang === 'EN' ? 'Apply for this Tier' : 'በዚህ ዘርፍ ያመልክቱ'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ════════ PILLARS OF EPA SECTION ════════ */}
      <section className="bg-gray-50 dark:bg-[#0e0e10] py-20 px-4 sm:px-6 lg:px-8 border-y border-gray-200 dark:border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono font-black uppercase tracking-widest text-green-700 dark:text-[#d4ff00] bg-black/5 dark:bg-white/5 px-3.5 py-1 rounded-full border border-gray-200 dark:border-white/10">
              {lang === 'EN' ? 'CORE MANDATES' : 'የማኅበሩ ዋና ተግባራት'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mt-3 font-syne uppercase tracking-tight">
              {lang === 'EN' ? 'Advancing Mental Health in Ethiopia' : 'የስነ-ልቦና ሳይንስን ለማስፋፋት'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-[#141416] p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-md">
              <div className="w-11 h-11 rounded-xl bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] border border-[#d4ff00]/20 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-black text-base text-gray-900 dark:text-white font-syne uppercase">
                {lang === 'EN' ? 'Licensing & Ethics' : 'የሙያ ፈቃድና ስነ-ምግባር'}
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed">
                {lang === 'EN'
                  ? 'Upholding national ethical standards, client confidentiality, and diagnostic practice guidelines in accordance with Ethiopian law.'
                  : 'የሙያ ስነ-ምግባር ደንቦችን ማስከበር እና የታካሚዎችን ሚስጥር መጠበቅ።'}
              </p>
            </div>

            <div className="bg-white dark:bg-[#141416] p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-md">
              <div className="w-11 h-11 rounded-xl bg-black/5 dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="font-black text-base text-gray-900 dark:text-white font-syne uppercase">
                {lang === 'EN' ? 'Research & Journal' : 'ጥናትና ምርምር'}
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed">
                {lang === 'EN'
                  ? 'Publishing peer-reviewed local research, organizing annual national symposia, and standardizing psychometric tests in local languages.'
                  : 'የስነ-ልቦና ጥናቶችን ማሳተም እና ዓመታዊ ሳይንሳዊ ጉባዔዎችን ማካሄድ።'}
              </p>
            </div>

            <div className="bg-white dark:bg-[#141416] p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-md">
              <div className="w-11 h-11 rounded-xl bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] border border-[#d4ff00]/20 flex items-center justify-center mb-4">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-black text-base text-gray-900 dark:text-white font-syne uppercase">
                {lang === 'EN' ? 'Continuing Education (CPD)' : 'የሙያ ማሻሻያ (CPD)'}
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed">
                {lang === 'EN'
                  ? 'Providing certified workshops, trauma care seminars, and clinical supervision points for license renewal.'
                  : 'የዕውቀትና ክህሎት ማሻሻያ ስልጠናዎችን በመስጠት የCPD ነጥቦችን ማስመዝገብ።'}
              </p>
            </div>

            <div className="bg-white dark:bg-[#141416] p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-md">
              <div className="w-11 h-11 rounded-xl bg-black/5 dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 flex items-center justify-center mb-4">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="font-black text-base text-gray-900 dark:text-white font-syne uppercase">
                {lang === 'EN' ? 'Psychologist Locator' : 'የባለሙያዎች ማውጫ'}
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed">
                {lang === 'EN'
                  ? 'Connecting the public and healthcare facilities with accredited psychologists across all regions of Ethiopia.'
                  : 'ህብረተሰቡ እውቅና ካላቸው የስነ-ልቦና ባለሙያዎች ጋር በቀላሉ እንዲገናኝ ማድረግ።'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ LATEST ANNOUNCEMENTS HIGHLIGHT ════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-mono font-black uppercase tracking-widest text-green-700 dark:text-[#d4ff00] bg-black/5 dark:bg-white/5 px-3.5 py-1 rounded-full border border-gray-200 dark:border-white/10">
              {lang === 'EN' ? 'OFFICIAL NEWS' : 'ይፋዊ ዜናዎች'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mt-3 font-syne uppercase tracking-tight">
              {lang === 'EN' ? 'Latest Association Updates' : 'ወቅታዊ ማስታወቂያዎች'}
            </h2>
          </div>
          <button 
            onClick={onOpenDirectory}
            className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-green-700 dark:text-[#d4ff00] hover:text-[#c3eb00] cursor-pointer"
          >
            <span>{lang === 'EN' ? 'Search Directory' : 'ባለሙያዎችን ፈልግ'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {announcements.slice(0, 3).map((ann) => (
            <div 
              key={ann.id}
              className="bg-gray-50 dark:bg-[#121214] rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-md hover:border-white/20 transition-all flex flex-col justify-between"
            >
              <div className="p-6">
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] border border-[#d4ff00]/30 font-mono font-bold uppercase text-[10px]">
                    {ann.category}
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-400 font-mono text-[11px]">
                    {new Date(ann.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <h3 className="font-black text-base text-gray-900 dark:text-white font-syne uppercase leading-snug line-clamp-2">
                  {lang === 'EN' ? ann.title : ann.amharic_title || ann.title}
                </h3>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2.5 line-clamp-3 leading-relaxed">
                  {ann.content}
                </p>
              </div>

              <div className="px-6 py-3 bg-gray-50 dark:bg-[#0d0d0f] border-t border-gray-200 dark:border-white/10 flex items-center justify-between text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
                <span>{ann.author}</span>
                <span className="text-green-700 dark:text-[#d4ff00] font-bold">{ann.views_count} views</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
