import React, { useState } from 'react';
import { 
  Award, 
  CreditCard, 
  FileText, 
  CheckCircle2, 
  Calendar, 
  Users, 
  Vote, 
  BookOpen, 
  Clock, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  Download,
  Search,
  Building,
  Heart,
  Bookmark
} from 'lucide-react';
import { Member, CPDCourse, Announcement } from '../types';

interface MemberPortalViewProps {
  member: Member;
  lang: 'EN' | 'AM';
  cpdCourses: CPDCourse[];
  announcements: Announcement[];
  onOpenIdCard: () => void;
  onOpenVoting: () => void;
  onOpenDirectory: () => void;
  onRegisterCPD: (courseId: string) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const MemberPortalView: React.FC<MemberPortalViewProps> = ({
  member,
  lang,
  cpdCourses,
  announcements,
  onOpenIdCard,
  onOpenVoting,
  onOpenDirectory,
  onRegisterCPD,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'cpd' | 'announcements' | 'license'>('overview');
  const [likedAnnouncements, setLikedAnnouncements] = useState<Record<string, boolean>>({});
  const [bookmarkedAnnouncements, setBookmarkedAnnouncements] = useState<Record<string, boolean>>({});

  const toggleLike = (id: string) => {
    setLikedAnnouncements(prev => {
      const nextState = !prev[id];
      onToast(nextState ? (lang === 'EN' ? 'Added to liked posts' : 'ተወዷል') : '', 'info');
      return { ...prev, [id]: nextState };
    });
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedAnnouncements(prev => {
      const nextState = !prev[id];
      onToast(nextState ? (lang === 'EN' ? 'Saved to bookmarks' : 'ተቀምጧል') : '', 'info');
      return { ...prev, [id]: nextState };
    });
  };

  const handleDownloadCert = () => {
    onToast(
      lang === 'EN' 
        ? 'Official EPA Membership Certificate downloaded (PDF)!' 
        : 'የኢሳይባ አባልነት ሰርተፊኬት ወርዷል!', 
      'success'
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#080808] text-gray-900 dark:text-white">
      
      {/* ════════ MEMBER PROFILE BANNER ════════ */}
      <div className="bg-gray-50 dark:bg-[#121214] rounded-3xl p-6 sm:p-8 text-gray-900 dark:text-white shadow-xl relative overflow-hidden mb-8 border border-gray-200 dark:border-white/10 grid-lines-bg">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4ff00]/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={member.photo_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300'}
                alt={member.first_name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-[#d4ff00] shadow-lg bg-black"
              />
              <div className="absolute -bottom-1 -right-1 bg-[#d4ff00] text-black p-1 rounded-full border-2 border-black">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] border border-[#d4ff00]/30 text-[10px] font-mono font-black uppercase tracking-wider">
                  ● {member.status} ACCREDITED
                </span>
                <span className="text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                  {member.membership_number}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white font-syne uppercase">
                {member.first_name} {member.father_name} {member.grandfather_name || ''}
              </h1>

              {member.amharic_full_name && (
                <p className="text-xs font-semibold text-green-700 dark:text-[#d4ff00]">
                  {member.amharic_full_name}
                </p>
              )}

              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 flex items-center gap-2 font-mono">
                <span>{member.specialty}</span>
                <span>•</span>
                <span>{member.workplace}</span>
              </p>
            </div>
          </div>

          {/* Quick Action CTA Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              id="btn-view-my-id"
              onClick={onOpenIdCard}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#d4ff00] hover:bg-[#c3eb00] text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-[#d4ff00]/15 transition-all active:scale-95 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-black" />
              <span>{lang === 'EN' ? 'Digital ID Pass' : 'ዲጂታል መታወቂያ'}</span>
            </button>

            <button
              id="btn-download-cert"
              onClick={handleDownloadCert}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 border border-white/20 text-gray-900 dark:text-white text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4 text-green-700 dark:text-[#d4ff00]" />
              <span>{lang === 'EN' ? 'Certificate (PDF)' : 'ሰርተፊኬት (PDF)'}</span>
            </button>
          </div>
        </div>

        {/* Mini stats banner */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-neutral-600 dark:text-neutral-400 block">{lang === 'EN' ? 'Annual CPD Score' : 'የCPD ነጥብ'}</span>
            <div className="text-xl sm:text-2xl font-black text-green-700 dark:text-[#d4ff00] font-syne mt-0.5">{member.cpd_points} / 50 PTS</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-neutral-600 dark:text-neutral-400 block">{lang === 'EN' ? 'License Number' : 'የፈቃድ ቁጥር'}</span>
            <div className="text-sm font-bold text-gray-900 dark:text-white font-mono mt-1">{member.license_number || 'STU-ACCREDITED'}</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-neutral-600 dark:text-neutral-400 block">{lang === 'EN' ? 'Valid Until' : 'የሚያበቃበት ቀን'}</span>
            <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mt-1 font-mono">{new Date(member.expires_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-neutral-600 dark:text-neutral-400 block">{lang === 'EN' ? 'Voting Rights' : 'የመምረጥ መብት'}</span>
            <div className="text-sm font-bold text-green-700 dark:text-[#d4ff00] mt-1 font-mono">✓ {lang === 'EN' ? 'Eligible' : 'ተፈቅዷል'}</div>
          </div>
        </div>
      </div>

      {/* ════════ PORTAL NAVIGATION TABS ════════ */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-white/10 mb-8 overflow-x-auto no-scrollbar">
        <button
          id="tab-btn-overview"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-xs font-mono font-black uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'border-[#d4ff00] text-green-700 dark:text-[#d4ff00]'
              : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-gray-900 dark:text-white'
          }`}
        >
          {lang === 'EN' ? 'Dashboard Overview' : 'ዳሽቦርድ'}
        </button>

        <button
          id="tab-btn-cpd"
          onClick={() => setActiveTab('cpd')}
          className={`pb-3 px-4 text-xs font-mono font-black uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'cpd'
              ? 'border-[#d4ff00] text-green-700 dark:text-[#d4ff00]'
              : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-gray-900 dark:text-white'
          }`}
        >
          {lang === 'EN' ? 'CPD & Continuing Education' : 'የሙያ ማሻሻያ (CPD)'}
        </button>

        <button
          id="tab-btn-announcements"
          onClick={() => setActiveTab('announcements')}
          className={`pb-3 px-4 text-xs font-mono font-black uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'announcements'
              ? 'border-[#d4ff00] text-green-700 dark:text-[#d4ff00]'
              : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-gray-900 dark:text-white'
          }`}
        >
          {lang === 'EN' ? 'Research & News Feed' : 'ምርምርና ዜናዎች'}
        </button>
      </div>

      {/* ════════ TAB CONTENT ════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div 
              onClick={onOpenVoting}
              className="bg-[#d4ff00] rounded-2xl p-6 text-black shadow-lg cursor-pointer hover:bg-[#c3eb00] transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 bg-black/10 rounded-xl">
                  <Vote className="w-5 h-5 text-black" />
                </span>
                <span className="text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full bg-black text-green-700 dark:text-[#d4ff00]">
                  LIVE BALLOT
                </span>
              </div>
              <h4 className="font-black text-base font-syne uppercase tracking-tight">
                {lang === 'EN' ? 'EPA Executive Election 2026' : 'የስራ አስፈጻሚ ምርጫ 2026'}
              </h4>
              <p className="text-xs text-black/80 mt-1">
                {lang === 'EN' ? 'Cast your verified ballot for President & Board members.' : 'ለፕሬዝዳንት እና ለስራ አስፈጻሚ አባላት ድምጽዎን ይስጡ።'}
              </p>
            </div>

            <div 
              onClick={onOpenDirectory}
              className="bg-gray-50 dark:bg-[#121214] rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-md cursor-pointer hover:border-white/20 transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 bg-black/5 dark:bg-white/5 text-green-700 dark:text-[#d4ff00] border border-gray-200 dark:border-white/10 rounded-xl">
                  <Users className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono font-bold text-neutral-600 dark:text-neutral-400">1,280+ MEMBERS</span>
              </div>
              <h4 className="font-black text-base text-gray-900 dark:text-white font-syne uppercase tracking-tight">
                {lang === 'EN' ? 'Psychologist Directory' : 'የባለሙያዎች ማውጫ'}
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                {lang === 'EN' ? 'Find colleagues, clinical supervisors, and referral partners.' : 'የስራ ባልደረቦችን እና ክሊኒኮችን ይፈልጉ።'}
              </p>
            </div>

            <div 
              onClick={() => setActiveTab('cpd')}
              className="bg-gray-50 dark:bg-[#121214] rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-md cursor-pointer hover:border-white/20 transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 bg-black/5 dark:bg-white/5 text-green-700 dark:text-[#d4ff00] border border-gray-200 dark:border-white/10 rounded-xl">
                  <Award className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono font-black text-green-700 dark:text-[#d4ff00]">48/50 PTS</span>
              </div>
              <h4 className="font-black text-base text-gray-900 dark:text-white font-syne uppercase tracking-tight">
                {lang === 'EN' ? 'CPD Progress Hub' : 'የሙያ ማሻሻያ ነጥቦች'}
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                {lang === 'EN' ? 'Register for accredited workshops and earn points.' : 'በስልጠናዎች ላይ በመሳተፍ ነጥብዎን ያሟሉ።'}
              </p>
            </div>
          </div>

          {/* Bio & Accreditation Details */}
          <div className="bg-gray-50 dark:bg-[#121214] rounded-3xl p-6 sm:p-7 border border-gray-200 dark:border-white/10 shadow-md">
            <h3 className="text-base font-black text-gray-900 dark:text-white font-syne uppercase mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-700 dark:text-[#d4ff00]" />
              <span>{lang === 'EN' ? 'Accreditation Dossier' : 'የሙያ መረጃ ማጠቃለያ'}</span>
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {member.bio || 'Accredited member of the Ethiopian Psychologists’ Association in good standing.'}
            </p>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-neutral-600 dark:text-neutral-500 dark:text-neutral-500 font-mono font-bold block uppercase text-[10px]">Registered Workplace</span>
                <span className="font-bold text-neutral-700 dark:text-neutral-200 mt-0.5 block">{member.workplace}</span>
              </div>
              <div>
                <span className="text-neutral-600 dark:text-neutral-500 dark:text-neutral-500 font-mono font-bold block uppercase text-[10px]">Official Email</span>
                <span className="font-bold text-neutral-700 dark:text-neutral-200 mt-0.5 block font-mono">{member.email}</span>
              </div>
              <div>
                <span className="text-neutral-600 dark:text-neutral-500 dark:text-neutral-500 font-mono font-bold block uppercase text-[10px]">City & Region</span>
                <span className="font-bold text-neutral-700 dark:text-neutral-200 mt-0.5 block">{member.city}, Ethiopia</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════ TAB: CPD COURSES ════════ */}
      {activeTab === 'cpd' && (
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-black text-gray-900 dark:text-white font-syne uppercase text-sm">
                {lang === 'EN' ? 'Annual CPD Target: 50 Points' : 'ዓመታዊ የCPD ግብ፡ 50 ነጥቦች'}
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                {lang === 'EN' ? 'You have completed 48 of 50 accredited points required for 2026.' : 'ለ2026 የሚያስፈልገዎትን 48 ነጥብ አጠናቀዋል።'}
              </p>
            </div>
            <div className="w-full sm:w-48">
              <div className="w-full h-3 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#d4ff00] rounded-full" style={{ width: '96%' }}></div>
              </div>
              <span className="text-[10px] text-green-700 dark:text-[#d4ff00] font-bold font-mono mt-1 block text-right">96% Complete</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cpdCourses.map((course) => (
              <div
                key={course.id}
                className="bg-gray-50 dark:bg-[#121214] rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 border border-gray-200 dark:border-white/10 font-mono font-bold uppercase text-[10px]">
                      {course.category}
                    </span>
                    <span className="font-mono text-xs font-black text-green-700 dark:text-[#d4ff00] bg-[#d4ff00]/10 px-2 py-0.5 rounded-md border border-[#d4ff00]/30">
                      +{course.points} CPD PTS
                    </span>
                  </div>

                  <h4 className="font-black text-base text-gray-900 dark:text-white font-syne uppercase leading-snug">
                    {course.title}
                  </h4>

                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">
                    Instructor: <span className="font-semibold text-neutral-700 dark:text-neutral-200">{course.instructor}</span> ({course.instructor_title})
                  </p>

                  <div className="flex items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400 mt-3 pt-3 border-t border-gray-200 dark:border-white/10">
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-500 dark:text-neutral-500" />
                      {course.date}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-mono">
                      <Clock className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-500 dark:text-neutral-500" />
                      {course.duration}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 dark:border-white/5">
                  {course.is_completed ? (
                    <div className="flex items-center gap-1.5 text-green-700 dark:text-[#d4ff00] text-xs font-mono font-bold py-2">
                      <Check className="w-4 h-4" />
                      <span>{lang === 'EN' ? 'Course Completed • Certificate Issued' : 'ስልጠናው ተጠናቋል'}</span>
                    </div>
                  ) : course.registered ? (
                    <div className="flex items-center justify-between text-xs py-2 text-green-700 dark:text-[#d4ff00] font-mono font-bold">
                      <span>✓ {lang === 'EN' ? 'Registered (Zoom Link Sent)' : 'ተመዝግበዋል (የዙም ሊንክ ተልኳል)'}</span>
                      <button className="text-xs text-gray-900 dark:text-white underline font-semibold cursor-pointer">
                        Join Session
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onRegisterCPD(course.id)}
                      className="w-full py-3 rounded-xl bg-[#d4ff00] hover:bg-[#c3eb00] text-black text-xs font-black uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
                    >
                      {lang === 'EN' ? 'Register for Workshop' : 'ለስልጠናው ይመዝገቡ'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════ TAB: ANNOUNCEMENTS ════════ */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="bg-gray-50 dark:bg-[#121214] rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] border border-[#d4ff00]/30 font-mono font-bold uppercase text-[10px]">
                  {ann.category}
                </span>
                <span className="text-neutral-600 dark:text-neutral-400 font-mono text-xs">
                  {new Date(ann.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <h3 className="font-black text-base text-gray-900 dark:text-white font-syne uppercase mb-2">
                {lang === 'EN' ? ann.title : ann.amharic_title || ann.title}
              </h3>

              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                {ann.content}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-white/10 text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                <span className="font-semibold text-neutral-700 dark:text-neutral-200">{ann.author}</span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleLike(ann.id)}
                    className={`flex items-center gap-1 text-xs font-semibold cursor-pointer transition-colors ${
                      likedAnnouncements[ann.id] ? 'text-red-600 dark:text-red-400' : 'text-neutral-600 dark:text-neutral-500 dark:text-neutral-500 hover:text-red-600 dark:text-red-400'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${likedAnnouncements[ann.id] ? 'fill-current' : ''}`} />
                    <span>{ann.likes_count + (likedAnnouncements[ann.id] ? 1 : 0)}</span>
                  </button>

                  <button
                    onClick={() => toggleBookmark(ann.id)}
                    className={`flex items-center gap-1 text-xs font-semibold cursor-pointer transition-colors ${
                      bookmarkedAnnouncements[ann.id] ? 'text-green-700 dark:text-[#d4ff00]' : 'text-neutral-600 dark:text-neutral-500 dark:text-neutral-500 hover:text-green-700 dark:text-[#d4ff00]'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${bookmarkedAnnouncements[ann.id] ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
