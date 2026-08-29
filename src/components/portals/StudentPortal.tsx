import React, { useState } from 'react';
import {
  GraduationCap, BookOpen, Award, Users, Calendar, FileText,
  ChevronRight, ExternalLink, Bell, TrendingUp, MessageCircle,
  Star, Clock, CheckCircle2, AlertCircle, Sparkles, ArrowRight,
  Briefcase, Search, Heart, Zap
} from 'lucide-react';
import { Member, CPDCourse, Announcement } from '../../types';

interface StudentPortalProps {
  member: Member;
  lang: 'EN' | 'AM';
  cpdCourses: CPDCourse[];
  announcements: Announcement[];
  onOpenIdCard: () => void;
  onOpenDirectory: () => void;
  onRegisterCPD: (courseId: string) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  member, lang, cpdCourses, announcements, onOpenIdCard, onOpenDirectory, onRegisterCPD, onToast
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'cpd' | 'research' | 'jobs' | 'mentor'>('overview');

  const studentCourses = cpdCourses.filter(c => 
    !c.eligible_types || c.eligible_types.includes('STUDENT')
  );

  const upcomingCourses = studentCourses.filter(c => !c.registered && !c.is_completed).slice(0, 3);
  const registeredCourses = studentCourses.filter(c => c.registered);

  const daysUntilExpiry = Math.ceil(
    (new Date(member.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const tabs = [
    { id: 'overview', label: lang === 'EN' ? 'Overview' : 'መነሻ', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'cpd', label: lang === 'EN' ? 'Webinars' : 'ዌቢናሮች', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'mentor', label: lang === 'EN' ? 'Mentors' : 'አማካሪዎች', icon: <Users className="w-4 h-4" /> },
    { id: 'jobs', label: lang === 'EN' ? 'Jobs' : 'ስራ', icon: <Briefcase className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Student Header Card */}
      <div className="relative overflow-hidden rounded-3xl mb-6 p-6"
        style={{ background: 'linear-gradient(135deg, #1a3a1a 0%, #0d1f0d 50%, #0a1a0a 100%)', border: '1px solid rgba(212,255,0,0.2)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #d4ff00 0%, transparent 50%)' }} />
        
        <div className="relative z-10 flex items-start gap-4">
          <img
            src={member.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
            alt={member.first_name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-[#d4ff00]/40"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#d4ff00] bg-[#d4ff00]/10 px-2 py-0.5 rounded-full border border-[#d4ff00]/20">
                {lang === 'EN' ? 'Student Member' : 'የተማሪ አባል'}
              </span>
              {member.is_verified && (
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {lang === 'EN' ? 'Verified' : 'ተረጋግጧል'}
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-white mt-1 font-syne">
              {member.first_name} {member.father_name}
            </h2>
            {member.amharic_full_name && (
              <p className="text-[#d4ff00]/70 text-sm">{member.amharic_full_name}</p>
            )}
            <p className="text-neutral-400 text-xs mt-1">{member.specialty} • {member.workplace}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="relative z-10 grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/10">
          <div className="text-center">
            <div className="text-2xl font-black text-[#d4ff00] font-syne">{member.cpd_points}</div>
            <div className="text-[10px] font-mono text-neutral-500 uppercase">{lang === 'EN' ? 'CPD Points' : 'CPD ነጥቦች'}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-white font-syne">{registeredCourses.length}</div>
            <div className="text-[10px] font-mono text-neutral-500 uppercase">{lang === 'EN' ? 'Courses' : 'ኮርሶች'}</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-black font-syne ${daysUntilExpiry < 60 ? 'text-amber-400' : 'text-white'}`}>
              {daysUntilExpiry}d
            </div>
            <div className="text-[10px] font-mono text-neutral-500 uppercase">{lang === 'EN' ? 'Until Renewal' : 'እስከ ማደሻ'}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: <FileText className="w-5 h-5" />, label: lang === 'EN' ? 'My Digital ID' : 'ዲጂታል መታወቂያ', action: onOpenIdCard, color: 'text-[#d4ff00]' },
          { icon: <Search className="w-5 h-5" />, label: lang === 'EN' ? 'Find Mentor' : 'አማካሪ ፈልግ', action: () => setActiveSection('mentor'), color: 'text-blue-400' },
          { icon: <BookOpen className="w-5 h-5" />, label: lang === 'EN' ? 'Webinars' : 'ዌቢናሮች', action: () => setActiveSection('cpd'), color: 'text-purple-400' },
          { icon: <Briefcase className="w-5 h-5" />, label: lang === 'EN' ? 'Job Board' : 'የስራ ዝርዝር', action: () => setActiveSection('jobs'), color: 'text-green-400' },
        ].map((item, i) => (
          <button key={i} onClick={item.action}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-white/10 hover:border-[#d4ff00]/40 transition-all active:scale-95 cursor-pointer group">
            <span className={`${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</span>
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-neutral-300 text-center leading-tight">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Navigation */}
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
          {/* Membership Card status */}
          <div className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-green-700 dark:text-[#d4ff00]" />
              <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white">{lang === 'EN' ? 'Membership Status' : 'የአባልነት ሁኔታ'}</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-600 dark:text-neutral-400">{lang === 'EN' ? 'Membership No.' : 'የአባልነት ቁጥር'}</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{member.membership_number}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-neutral-600 dark:text-neutral-400">{lang === 'EN' ? 'Valid Until' : 'ዋጋ ያለው እስከ'}</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{new Date(member.expires_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-neutral-600 dark:text-neutral-400">{lang === 'EN' ? 'Status' : 'ሁኔታ'}</span>
                <span className={`font-mono font-bold ${member.status === 'ACTIVE' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>{member.status}</span>
              </div>
            </div>
            {daysUntilExpiry < 60 && (
              <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-600 dark:text-amber-400">{lang === 'EN' ? `Membership expires in ${daysUntilExpiry} days. Renew soon!` : `አባልነትዎ በ${daysUntilExpiry} ቀናት ያበቃል። አሁን ያድሱ!`}</p>
              </div>
            )}
          </div>

          {/* Recent Announcements */}
          <div className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-green-700 dark:text-[#d4ff00]" />
                <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white">{lang === 'EN' ? 'Latest News' : 'ወቅታዊ ዜናዎች'}</h3>
              </div>
            </div>
            <div className="space-y-3">
              {announcements.slice(0, 3).map(ann => (
                <div key={ann.id} className="flex items-start gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5">
                  <div className="w-2 h-2 rounded-full bg-[#d4ff00] shrink-0 mt-1.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2">{lang === 'EN' ? ann.title : (ann.amharic_title || ann.title)}</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">{new Date(ann.published_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Courses Preview */}
          {upcomingCourses.length > 0 && (
            <div className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-700 dark:text-[#d4ff00]" />
                  <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white">{lang === 'EN' ? 'Upcoming Webinars' : 'መጪ ዌቢናሮች'}</h3>
                </div>
                <button onClick={() => setActiveSection('cpd')} className="text-[11px] font-bold text-green-700 dark:text-[#d4ff00] cursor-pointer">
                  {lang === 'EN' ? 'See all' : 'ሁሉም'}
                </button>
              </div>
              <div className="space-y-2">
                {upcomingCourses.map(course => (
                  <div key={course.id} className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{course.title}</p>
                      <p className="text-[10px] text-neutral-500">{course.mode} • {course.points} CPD pts</p>
                    </div>
                    <button onClick={() => { onRegisterCPD(course.id); onToast(lang === 'EN' ? 'Registered successfully!' : 'በተሳካ ሁኔታ ተመዝግበዋል!', 'success'); }}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-[#d4ff00] text-black text-[10px] font-black uppercase cursor-pointer">
                      {lang === 'EN' ? 'Join' : 'ተሳተፍ'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeSection === 'cpd' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-black text-gray-900 dark:text-white uppercase">{lang === 'EN' ? 'Available Webinars & Workshops' : 'ዌቢናሮችና ወርክሾፖች'}</span>
          </div>
          {studentCourses.map(course => (
            <div key={course.id} className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                      course.is_completed ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' :
                      course.registered ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                      'bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] border border-[#d4ff00]/20'
                    }`}>
                      {course.is_completed ? (lang === 'EN' ? 'Completed' : 'ተጠናቋል') :
                       course.registered ? (lang === 'EN' ? 'Registered' : 'ተመዝግቧል') :
                       course.mode}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">{course.points} CPD pts</span>
                  </div>
                  <h4 className="font-black text-sm text-gray-900 dark:text-white">{course.title}</h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">{course.instructor_title} {course.instructor}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(course.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration}</span>
                  </div>
                </div>
                {!course.registered && !course.is_completed && (
                  <button onClick={() => { onRegisterCPD(course.id); onToast(lang === 'EN' ? 'Successfully registered!' : 'ተመዝግበዋል!', 'success'); }}
                    className="shrink-0 px-3 py-2 rounded-xl bg-[#d4ff00] text-black text-[10px] font-black uppercase cursor-pointer active:scale-95">
                    {lang === 'EN' ? 'Register' : 'ተመዝገብ'}
                  </button>
                )}
                {course.is_completed && (
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSection === 'mentor' && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{lang === 'EN' ? 'Connect with licensed EPA members for mentorship and professional guidance.' : 'ለሙያ መምሪያ ከተፈቀዱ የEPA አባላት ጋር ይገናኙ።'}</p>
          {/* Sample mentors from directory */}
          {[
            { name: 'Dr. Selamawit Bekele', specialty: 'Clinical & Trauma Psychology', workplace: 'Addis Ababa University', photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200' },
            { name: 'Dr. Dawit Mekonnen', specialty: 'Neuropsychology & Psychometrics', workplace: 'Jimma University', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
          ].map((mentor, i) => (
            <div key={i} className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-4 flex items-center gap-4">
              <img src={mentor.photo} alt={mentor.name} className="w-14 h-14 rounded-2xl object-cover border border-gray-200 dark:border-white/10" />
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-gray-900 dark:text-white">{mentor.name}</p>
                <p className="text-xs text-green-700 dark:text-[#d4ff00] font-medium">{mentor.specialty}</p>
                <p className="text-[11px] text-neutral-500">{mentor.workplace}</p>
              </div>
              <button onClick={() => onToast(lang === 'EN' ? 'Mentorship request sent!' : 'የምርጫ ጥያቄ ተልኳል!', 'success')}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-black text-gray-900 dark:text-white cursor-pointer active:scale-95">
                {lang === 'EN' ? 'Connect' : 'ያግኙ'}
              </button>
            </div>
          ))}
          <button onClick={onOpenDirectory} className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-dashed border-gray-300 dark:border-white/20 text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:border-[#d4ff00]/40 cursor-pointer transition-colors">
            <Search className="w-4 h-4" />
            {lang === 'EN' ? 'Browse all psychologists' : 'ሁሉንም ባለሙያዎች ፈልግ'}
          </button>
        </div>
      )}

      {activeSection === 'jobs' && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{lang === 'EN' ? 'Graduate and internship opportunities in psychology across Ethiopia.' : 'በኢትዮጵያ ውስጥ የስነ-ልቦና ምሩቃን እና ልምምድ እድሎች።'}</p>
          {[
            { title: 'Psychosocial Support Intern', org: 'UNHCR Ethiopia', location: 'Addis Ababa', type: 'Internship', posted: '2 days ago' },
            { title: 'Research Assistant – Mental Health', org: 'Jimma University', location: 'Jimma', type: 'Part-time', posted: '1 week ago' },
            { title: 'School Counselor (Graduate)', org: 'Addis Ababa Education Bureau', location: 'Addis Ababa', type: 'Full-time', posted: '3 days ago' },
          ].map((job, i) => (
            <div key={i} className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-black text-sm text-gray-900 dark:text-white">{job.title}</h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">{job.org} • {job.location}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">{job.type}</span>
                    <span className="text-[10px] text-neutral-500">{job.posted}</span>
                  </div>
                </div>
                <button onClick={() => onToast(lang === 'EN' ? 'Opening application...' : 'ማመልከቻ እየተከፈተ ነው...', 'info')}
                  className="shrink-0 p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-neutral-400 cursor-pointer">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
