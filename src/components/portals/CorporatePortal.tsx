import React, { useState } from 'react';
import {
  Building2, Users, Award, Briefcase, FileText, BarChart2,
  CheckCircle2, Plus, ExternalLink, Bell, TrendingUp,
  ChevronRight, BookOpen, Shield, Star, Zap, Edit3, Search
} from 'lucide-react';
import { Member, CPDCourse, Announcement } from '../../types';

interface CorporatePortalProps {
  member: Member;
  lang: 'EN' | 'AM';
  cpdCourses: CPDCourse[];
  announcements: Announcement[];
  onOpenDirectory: () => void;
  onRegisterCPD: (courseId: string) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const CorporatePortal: React.FC<CorporatePortalProps> = ({
  member, lang, cpdCourses, announcements, onOpenDirectory, onRegisterCPD, onToast
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'staff' | 'workshops' | 'jobs' | 'invoices'>('overview');

  // Simulated staff list
  const mockStaff = [
    { name: 'Meron Haile', role: 'Clinical Psychologist', status: 'Active' },
    { name: 'Abebe Tadesse', role: 'Counselor', status: 'Pending' },
    { name: 'Tigist Bekele', role: 'Researcher', status: 'Active' },
  ];

  const tabs = [
    { id: 'overview', label: lang === 'EN' ? 'Overview' : 'መነሻ', icon: <Building2 className="w-4 h-4" /> },
    { id: 'staff', label: lang === 'EN' ? 'Staff' : 'ሰራተኞች', icon: <Users className="w-4 h-4" /> },
    { id: 'workshops', label: lang === 'EN' ? 'Workshops' : 'ወርክሾፖች', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'jobs', label: lang === 'EN' ? 'Job Board' : 'ስራ', icon: <Briefcase className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Corporate Header Card */}
      <div className="relative overflow-hidden rounded-3xl mb-6 p-6"
        style={{ background: 'linear-gradient(135deg, #1a1200 0%, #120d00 50%, #0a0900 100%)', border: '1px solid rgba(245,158,11,0.3)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 20%, #f59e0b 0%, transparent 50%)' }} />
        
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                {lang === 'EN' ? 'Corporate Member' : 'ድርጅታዊ አባል'}
              </span>
              <span className="text-[10px] font-mono font-bold uppercase text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Accredited
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-1 font-syne">
              {member.corporate_profile?.organization_name || `${member.first_name} ${member.father_name}`}
            </h2>
            <p className="text-amber-300/70 text-sm">{member.corporate_profile?.org_type || 'Healthcare Institution'}</p>
            <p className="text-neutral-400 text-xs mt-0.5">{member.corporate_profile?.headquarters_city || member.city}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/10">
          <div className="text-center">
            <div className="text-2xl font-black text-amber-400 font-syne">{mockStaff.filter(s => s.status === 'Active').length}</div>
            <div className="text-[9px] font-mono text-neutral-500 uppercase">{lang === 'EN' ? 'Active Staff' : 'ንቁ ሰራተኞች'}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-white font-syne">{cpdCourses.filter(c => c.registered).length}</div>
            <div className="text-[9px] font-mono text-neutral-500 uppercase">{lang === 'EN' ? 'Workshops Booked' : 'ወርክሾፖች'}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-white font-syne">
              {Math.ceil((new Date(member.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d
            </div>
            <div className="text-[9px] font-mono text-neutral-500 uppercase">{lang === 'EN' ? 'Until Renewal' : 'እስከ ማደሻ'}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: <Plus className="w-5 h-5" />, label: lang === 'EN' ? 'Add Staff' : 'ሰራተኛ ጨምር', action: () => setActiveSection('staff'), color: 'text-amber-400' },
          { icon: <BookOpen className="w-5 h-5" />, label: lang === 'EN' ? 'Book Workshop' : 'ወርክሾፕ ያዝ', action: () => setActiveSection('workshops'), color: 'text-blue-400' },
          { icon: <Briefcase className="w-5 h-5" />, label: lang === 'EN' ? 'Post Job' : 'ስራ ለቀቅ', action: () => setActiveSection('jobs'), color: 'text-green-400' },
          { icon: <Search className="w-5 h-5" />, label: lang === 'EN' ? 'Find Psychologists' : 'ባለሙያ ፈልግ', action: onOpenDirectory, color: 'text-purple-400' },
        ].map((item, i) => (
          <button key={i} onClick={item.action}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-white/10 hover:border-amber-500/40 transition-all active:scale-95 cursor-pointer group">
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

      {/* Sections */}
      {activeSection === 'overview' && (
        <div className="space-y-4">
          {/* Accreditation Seal */}
          <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 rounded-2xl border border-amber-500/20 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-black text-sm text-gray-900 dark:text-white">{lang === 'EN' ? 'EPA Accreditation Seal' : 'የEPA ማረጋገጫ ምልክት'}</h3>
                <p className="text-[11px] text-neutral-500">{lang === 'EN' ? 'Valid for official publications & documents' : 'ለይፋዊ ሰነዶች ዋጋ አለው'}</p>
              </div>
            </div>
            <button onClick={() => onToast(lang === 'EN' ? 'Accreditation badge downloaded!' : 'የማረጋገጫ ምልክት ወርዷል!', 'success')}
              className="w-full py-2.5 rounded-xl border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider cursor-pointer active:scale-95">
              {lang === 'EN' ? 'Download Accreditation Badge' : 'የማረጋገጫ ምልክት አውርድ'}
            </button>
          </div>

          {/* Recent announcements */}
          <div className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-green-700 dark:text-[#d4ff00]" />
              <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white">{lang === 'EN' ? 'EPA News' : 'EPA ዜናዎች'}</h3>
            </div>
            <div className="space-y-3">
              {announcements.slice(0, 3).map(ann => (
                <div key={ann.id} className="flex items-start gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5">
                  <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2">{ann.title}</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">{new Date(ann.published_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'staff' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-700 dark:text-neutral-300">{lang === 'EN' ? 'Registered Psychology Staff' : 'የተመዘገቡ የስነ-ልቦና ሰራተኞች'}</p>
            <button onClick={() => onToast(lang === 'EN' ? 'Staff invitation sent!' : 'ጥሪ ተልኳል!', 'success')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d4ff00] text-black text-xs font-black cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> {lang === 'EN' ? 'Invite' : 'ጋብዝ'}
            </button>
          </div>
          {mockStaff.map((s, i) => (
            <div key={i} className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-neutral-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{s.name}</p>
                  <p className="text-xs text-neutral-500">{s.role}</p>
                </div>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                s.status === 'Active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              }`}>{s.status}</span>
            </div>
          ))}
          <p className="text-xs text-center text-neutral-500">{lang === 'EN' ? 'Up to 5 staff included in corporate plan.' : 'እስከ 5 ሰራተኞች በዕቅድ ውስጥ ይካተታሉ።'}</p>
        </div>
      )}

      {activeSection === 'workshops' && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{lang === 'EN' ? 'Book certified EPA CPD workshops for your institution staff.' : 'ለተቋምዎ ሰራተኞች የEPA CPD ወርክሾፖችን ያስፈፅሙ።'}</p>
          {cpdCourses.slice(0, 4).map(course => (
            <div key={course.id} className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-black text-sm text-gray-900 dark:text-white">{course.title}</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">{course.instructor} • {course.duration}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] border border-[#d4ff00]/20">{course.mode}</span>
                    <span className="text-[10px] text-neutral-500">{course.points} CPD pts/person</span>
                  </div>
                </div>
                <button onClick={() => { onRegisterCPD(course.id); onToast(lang === 'EN' ? 'Workshop booked for your team!' : 'ለቡድናችሁ ወርክሾፕ ታቅዷል!', 'success'); }}
                  className="shrink-0 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase cursor-pointer active:scale-95">
                  {lang === 'EN' ? 'Book' : 'ያዝ'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSection === 'jobs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-700 dark:text-neutral-300">{lang === 'EN' ? 'Your Job Postings' : 'የእርስዎ ስራ ማስታወቂያዎች'}</p>
            <button onClick={() => onToast(lang === 'EN' ? 'Job posting form opening...' : 'የስራ ማስታወቂያ ቅጽ እየተከፈተ ነው...', 'info')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d4ff00] text-black text-xs font-black cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> {lang === 'EN' ? 'Post Job' : 'ስራ ልቀቅ'}
            </button>
          </div>
          <div className="text-center py-12 text-neutral-500">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{lang === 'EN' ? 'No active job postings.' : 'ንቁ ማስታወቂያዎች የሉም።'}</p>
            <p className="text-xs mt-1">{lang === 'EN' ? 'Post a job to reach accredited EPA psychologists.' : 'ሙያተኛ ለመፈለግ ስራ ይለቀቁ።'}</p>
          </div>
        </div>
      )}
    </div>
  );
};
