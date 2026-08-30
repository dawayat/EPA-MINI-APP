import React, { useState } from 'react';
import {
  UserCheck, Award, FileText, Vote, MapPin, Building2, ExternalLink, ShieldCheck, Mail, Phone, Calendar, Download, BookOpen, Clock, Heart, Plus, Search, ChevronRight, Briefcase, Bell, MessageSquare, Sparkles, Shield, Edit3, CheckCircle2
} from 'lucide-react';
import { Member, CPDCourse, Announcement } from '../../types';

interface FullMemberPortalProps {
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

export const FullMemberPortal: React.FC<FullMemberPortalProps> = ({
  member, lang, cpdCourses, announcements, onOpenIdCard, onOpenVoting, onOpenDirectory, onRegisterCPD, onToast
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'cpd' | 'directory' | 'elections' | 'renewal'>('overview');

  const myRegisteredCourses = cpdCourses.filter(c => c.registered);
  const completedCourses = cpdCourses.filter(c => c.is_completed);
  const availableCourses = cpdCourses.filter(c => !c.registered && !c.is_completed);
  
  // CPD progress toward annual target (40 points)
  const cpdTarget = 40;
  const cpdProgress = Math.min((member.cpd_points / cpdTarget) * 100, 100);

  const daysUntilExpiry = Math.ceil(
    (new Date(member.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const tabs = [
    { id: 'overview', label: lang === 'EN' ? 'Overview' : 'መነሻ', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'cpd', label: lang === 'EN' ? 'CPD' : 'CPD', icon: <Award className="w-4 h-4" /> },
    { id: 'elections', label: lang === 'EN' ? 'Vote' : 'ምርጫ', icon: <Vote className="w-4 h-4" /> },
    { id: 'renewal', label: lang === 'EN' ? 'Renew' : ' አድስ', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Full Member Header Card */}
      <div className="relative overflow-hidden rounded-3xl mb-6 p-6"
        style={{ background: 'linear-gradient(135deg, #0f1a2e 0%, #0a1020 50%, #080e1a 100%)', border: '1px solid rgba(59,130,246,0.3)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 10%, #3b82f6 0%, transparent 50%)' }} />
        
        <div className="relative z-10 flex items-start gap-4">
          <img
            src={member.photo_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'}
            alt={member.first_name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500/40"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full border border-blue-400/20">
                {lang === 'EN' ? 'Licensed Clinical Member' : 'ፈቃድ ያለው አባል'}
              </span>
              {member.is_verified && (
                <span className="text-[10px] font-mono font-bold uppercase text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-white mt-1 font-syne">
              {member.first_name} {member.father_name}
            </h2>
            {member.amharic_full_name && <p className="text-blue-300/70 text-sm">{member.amharic_full_name}</p>}
            <p className="text-neutral-400 text-xs mt-0.5">{(member.specialty && member.specialty !== 'undefined') ? member.specialty : (member.current_specialty || 'Clinical Psychology')} • {(member.workplace && member.workplace !== 'undefined') ? member.workplace : (member.current_workplace || member.city || 'EPA Member')}</p>
            {member.license_number && (
              <p className="text-[10px] font-mono text-neutral-500 mt-0.5">License: {member.license_number}</p>
            )}
          </div>
        </div>

        {/* CPD Progress */}
        <div className="relative z-10 mt-5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-neutral-300">{lang === 'EN' ? 'Annual CPD Progress' : 'ዓመታዊ CPD ሂደት'}</span>
            <span className="font-mono font-bold text-blue-400">{member.cpd_points} / {cpdTarget} pts</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${cpdProgress}%`,
                background: cpdProgress >= 100 ? '#22c55e' : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
              }}
            />
          </div>
          {cpdProgress >= 100 && (
            <p className="text-[10px] text-green-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {lang === 'EN' ? 'Annual CPD target met! Eligible for renewal.' : 'ዓመታዊ CPD ግብ ተሳክቷል!'}
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className="relative z-10 grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/10">
          {[
            { label: lang === 'EN' ? 'CPD Pts' : 'CPD', value: member.cpd_points, color: 'text-blue-400' },
            { label: lang === 'EN' ? 'Courses' : 'ኮርሶች', value: completedCourses.length, color: 'text-green-400' },
            { label: lang === 'EN' ? 'Member Since' : 'አባል ሆኖ', value: new Date(member.issued_at).getFullYear(), color: 'text-white' },
            { label: lang === 'EN' ? 'Days Left' : 'ቀናት', value: `${daysUntilExpiry}d`, color: daysUntilExpiry < 60 ? 'text-amber-400' : 'text-white' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className={`text-xl font-black font-syne ${stat.color}`}>{stat.value}</div>
              <div className="text-[9px] font-mono text-neutral-500 uppercase">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: <CreditCard className="w-5 h-5" />, label: lang === 'EN' ? 'Digital ID' : 'ዲጂታል ID', action: onOpenIdCard, color: 'text-blue-400' },
          { icon: <Vote className="w-5 h-5" />, label: lang === 'EN' ? 'Elections' : 'ምርጫ', action: onOpenVoting, color: 'text-[#d4ff00]' },
          { icon: <Users className="w-5 h-5" />, label: lang === 'EN' ? 'Directory' : 'ማውጫ', action: onOpenDirectory, color: 'text-purple-400' },
          { icon: <FileText className="w-5 h-5" />, label: lang === 'EN' ? 'My CPD Report' : 'CPD ሪፖርት', action: () => setActiveSection('cpd'), color: 'text-green-400' },
        ].map((item, i) => (
          <button key={i} onClick={item.action}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-white/10 hover:border-[#d4ff00]/40 transition-all active:scale-95 cursor-pointer group">
            <span className={`${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</span>
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-neutral-300 text-center leading-tight">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-[#0c0c0e] p-1 rounded-2xl mb-6 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveSection(tab.id as typeof activeSection)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer flex-1 justify-center ${
              activeSection === tab.id
                ? 'bg-[#d4ff00] text-black shadow-md'
                : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
            }`}>
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Section Content */}
      {activeSection === 'overview' && (
        <div className="space-y-4">
          {/* Profile visibility control */}
          <div className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-700 dark:text-[#d4ff00]" />
                <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white">{lang === 'EN' ? 'Directory Listing' : 'የማውጫ ዝርዝር'}</h3>
              </div>
              <button onClick={() => onToast(lang === 'EN' ? 'Profile settings saved!' : 'መገለጫ ቅንጅቶች ተቀምጠዋል!', 'success')}
                className="flex items-center gap-1 text-[11px] text-green-700 dark:text-[#d4ff00] font-bold cursor-pointer">
                <Edit3 className="w-3.5 h-3.5" /> {lang === 'EN' ? 'Edit' : 'አርትዕ'}
              </button>
            </div>
            <div className="space-y-2">
              {[
                { label: lang === 'EN' ? 'Specialty' : 'ስፔሻሊቲ', value: member.specialty },
                { label: lang === 'EN' ? 'Workplace' : 'የሥራ ቦታ', value: member.workplace },
                { label: lang === 'EN' ? 'City' : 'ከተማ', value: member.city },
              ].filter(r => r.value).map((row, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-neutral-600 dark:text-neutral-400">{row.label}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Announcements */}
          <div className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-green-700 dark:text-[#d4ff00]" />
              <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white">{lang === 'EN' ? 'Official Updates' : 'ይፋዊ ዝማኔዎች'}</h3>
            </div>
            <div className="space-y-3">
              {announcements.slice(0, 4).map(ann => (
                <div key={ann.id} className="flex flex-col gap-2 p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#d4ff00] shrink-0 mt-1.5" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-900 dark:text-white leading-snug">{lang === 'EN' ? ann.title : (ann.amharic_title || ann.title)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] text-neutral-500">{ann.category} • {new Date(ann.published_at).toLocaleDateString()}</p>
                        {(ann as any).file_attachment_url && (
                          <a href={(ann as any).file_attachment_url} target="_blank" rel="noopener noreferrer" className="text-[10px] flex items-center gap-1 text-blue-500 hover:underline ml-2" onClick={e => e.stopPropagation()}>
                            <FileText className="w-3 h-3" /> {lang === 'EN' ? 'Attachment' : 'ፋይል'}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="pl-5 flex items-center justify-between mt-1">
                    {ann.category === 'Vote' ? (
                      <div className="flex gap-2">
                        <button onClick={() => onToast(lang === 'EN' ? 'Vote Approved!' : 'ድምጽዎ ጸድቋል!', 'success')} className="px-3 py-1 rounded bg-green-500/10 hover:bg-green-500/20 text-green-600 text-[10px] font-bold uppercase cursor-pointer">
                          Approve
                        </button>
                        <button onClick={() => onToast(lang === 'EN' ? 'Adjustment requested.' : 'ማስተካከያ ተጠይቋል!', 'info')} className="px-3 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 text-[10px] font-bold uppercase cursor-pointer">
                          Adjust
                        </button>
                        <button onClick={() => onToast(lang === 'EN' ? 'Comment opened.' : 'አስተያየት ክፈት', 'info')} className="px-3 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 text-[10px] font-bold uppercase cursor-pointer flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> Comment
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setLikedAnn(p => ({ ...p, [ann.id]: !p[ann.id] }))}
                        className={`text-[10px] flex items-center gap-1 cursor-pointer ${likedAnn[ann.id] ? 'text-red-400' : 'text-neutral-500'}`}>
                        <Heart className={`w-3 h-3 ${likedAnn[ann.id] ? 'fill-current' : ''}`} />
                        <span>{ann.likes_count + (likedAnn[ann.id] ? 1 : 0)}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {announcements.length > 4 && (
              <button 
                onClick={() => onToast('Opening full news feed...', 'info')}
                className="w-full mt-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                {lang === 'EN' ? 'View All News' : 'ሁሉንም ዜናዎች እይ'}
              </button>
            )}
          </div>
        </div>
      )}

      {activeSection === 'cpd' && (
        <div className="space-y-4">
          {/* CPD Summary card */}
          <div className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
            <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white mb-4">{lang === 'EN' ? 'CPD Summary' : 'CPD ማጠቃለያ'}</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-black text-blue-500 dark:text-blue-400 font-syne">{member.cpd_points}</div>
                <div className="text-[10px] font-mono text-neutral-500 uppercase">{lang === 'EN' ? 'Total Points' : 'ጠቅላላ ነጥቦች'}</div>
              </div>
              <div>
                <div className="text-2xl font-black text-green-500 dark:text-green-400 font-syne">{completedCourses.length}</div>
                <div className="text-[10px] font-mono text-neutral-500 uppercase">{lang === 'EN' ? 'Completed' : 'ተጠናቋል'}</div>
              </div>
              <div>
                <div className="text-2xl font-black text-amber-500 dark:text-amber-400 font-syne">{myRegisteredCourses.length}</div>
                <div className="text-[10px] font-mono text-neutral-500 uppercase">{lang === 'EN' ? 'Upcoming' : 'መጪ'}</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-600 dark:text-neutral-400">{lang === 'EN' ? 'Annual target: 40 points' : 'ዓመታዊ ግብ: 40 ነጥቦች'}</span>
                <span className="font-mono text-blue-500 dark:text-blue-400">{Math.round(cpdProgress)}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${cpdProgress}%` }} />
              </div>
            </div>
          </div>

          {/* Available courses */}
          <h4 className="text-xs font-black uppercase text-neutral-600 dark:text-neutral-400">{lang === 'EN' ? 'Available Courses' : 'ያሉ ኮርሶች'}</h4>
          {cpdCourses.map(course => (
            <div key={course.id} className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
              <div className="flex items-start gap-3 justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                      course.is_completed ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' :
                      course.registered ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                      'bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] border border-[#d4ff00]/20'
                    }`}>
                      {course.is_completed ? '✓ Done' : course.registered ? 'Registered' : course.mode}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono font-bold">{course.points} CPD pts</span>
                  </div>
                  <h4 className="font-black text-sm text-gray-900 dark:text-white">{course.title}</h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">{course.instructor}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-neutral-500">
                    <span>{new Date(course.date).toLocaleDateString()}</span>
                    <span>{course.duration}</span>
                    <span>{course.category}</span>
                  </div>
                </div>
                {!course.registered && !course.is_completed && (
                  <button onClick={() => { onRegisterCPD(course.id); onToast(lang === 'EN' ? 'Registered for CPD course!' : 'ለCPD ኮርስ ተመዝግበዋል!', 'success'); }}
                    className="shrink-0 px-3 py-2 rounded-xl bg-[#d4ff00] text-black text-[10px] font-black uppercase cursor-pointer active:scale-95">
                    {lang === 'EN' ? 'Register' : 'ተመዝገብ'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSection === 'elections' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/20 p-6 text-center">
            <Vote className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="font-black text-lg text-gray-900 dark:text-white mb-2">{lang === 'EN' ? 'EPA Executive Council Elections' : 'የEPA አስፈጻሚ ምክር ቤት ምርጫ'}</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">{lang === 'EN' ? 'As a Full Member, you have the right to vote and stand for elections.' : 'እንደ ሙሉ አባል፣ ለምርጫ የመምረጥ እና የመወዳደር መብት አለዎት።'}</p>
            <button onClick={onOpenVoting}
              className="px-6 py-3 rounded-2xl bg-[#d4ff00] text-black font-black uppercase tracking-wider text-sm cursor-pointer active:scale-95 shadow-lg">
              {lang === 'EN' ? 'Go to Voting Booth' : 'ወደ ምርጫ ቤት ሂድ'}
            </button>
          </div>
        </div>
      )}

      {activeSection === 'renewal' && (
        <div className="space-y-4">
          <div className={`rounded-2xl border p-5 ${daysUntilExpiry < 60 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-gray-50 dark:bg-[#121214] border-gray-200 dark:border-white/10'}`}>
            <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white mb-3">{lang === 'EN' ? 'Membership Renewal' : 'የአባልነት ማደስ'}</h3>
            <div className="space-y-2 mb-4">
              {[
                { label: lang === 'EN' ? 'Current Status' : 'አሁን ሁኔታ', value: member.status },
                { label: lang === 'EN' ? 'Expires On' : 'ያበቃል', value: new Date(member.expires_at).toLocaleDateString() },
                { label: lang === 'EN' ? 'Renewal Fee' : 'ማደሻ ክፍያ', value: 'ETB 1,500' },
                { label: lang === 'EN' ? 'CPD Requirement' : 'CPD ፍላጎት', value: `${member.cpd_points}/${cpdTarget} pts ${cpdProgress >= 100 ? '✓ Met' : '(Not yet met)'}` },
              ].map((row, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-neutral-600 dark:text-neutral-400">{row.label}</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{row.value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => onToast(lang === 'EN' ? 'Renewal process initiated. Please complete payment.' : 'ማደሻ ሂደት ተጀምሯል። ክፍያ ያጠናቅቁ።', 'info')}
              className="w-full py-3 rounded-xl bg-[#d4ff00] text-black font-black uppercase tracking-wider text-sm cursor-pointer active:scale-95">
              {lang === 'EN' ? 'Renew Membership (ETB 1,500)' : 'አባልነት አድስ (ብር 1,500)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
