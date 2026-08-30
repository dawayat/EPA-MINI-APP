import React, { useState } from 'react';
import {
  Award, CreditCard, FileText, CheckCircle2, Calendar, Users, Vote,
  BookOpen, Clock, ExternalLink, Sparkles, ShieldCheck, Check, Download,
  Search, Heart, Bookmark, GraduationCap, Building2, Briefcase,
  Star, Bell, TrendingUp, AlertCircle, Plus, Shield, Edit3, ChevronRight,
  MessageSquare
} from 'lucide-react';
import { Member, CPDCourse, Announcement, ResearchArticle } from '../types';
import { ResearchPortal } from './ResearchPortal';

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

// ── ANNOUNCEMENT CARD (shared across all portals) ───────────────────────────
interface AnnCardProps {
  ann: Announcement;
  lang: 'EN' | 'AM';
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  likedAnn: Record<string, boolean>;
  setLikedAnn: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}
const AnnouncementCard: React.FC<AnnCardProps> = ({ ann, lang, onToast, likedAnn, setLikedAnn }) => {
  const [showComment, setShowComment] = useState(false);
  const [commentText, setCommentText] = useState('');
  const isVoting = ann.category === 'Election' || ann.is_draft;
  const coverImg = ann.cover_image_url || ann.cover_photo_url;
  return (
    <div className="rounded-2xl bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-white/10 overflow-hidden hover:border-[#d4ff00]/40 transition-colors">
      {coverImg && (
        <img src={coverImg} alt={ann.title} className="w-full h-40 object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] border border-[#d4ff00]/20 uppercase">{ann.category}</span>
          <span className="text-[10px] text-neutral-500">{new Date(ann.published_at).toLocaleDateString()}</span>
        </div>
        <h4 className="font-black text-sm text-gray-900 dark:text-white leading-snug">{lang === 'EN' ? ann.title : (ann.amharic_title || ann.title)}</h4>
        <p className="text-[12px] text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{ann.content}</p>
        {ann.file_attachment_url && (
          <a href={ann.file_attachment_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-[11px] text-blue-500 hover:underline font-bold">
            <FileText className="w-3.5 h-3.5" /> {lang === 'EN' ? 'Open Attachment' : 'ፋይል ክፈት'}
          </a>
        )}
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
          {isVoting ? (
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => onToast(lang === 'EN' ? 'Vote: Approved!' : 'ድምጽ: አጽድቁ!', 'success')}
                className="px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 text-[11px] font-black uppercase cursor-pointer flex items-center gap-1">
                ✓ Approve
              </button>
              <button onClick={() => onToast(lang === 'EN' ? 'Vote: Needs Adjustment' : 'ድምጽ: ማስተካከያ', 'info')}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-black uppercase cursor-pointer flex items-center gap-1">
                ↺ Adjust
              </button>
              <button onClick={() => setShowComment(v => !v)}
                className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 text-[11px] font-black uppercase cursor-pointer flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Comment
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button onClick={() => setLikedAnn(p => ({ ...p, [ann.id]: !p[ann.id] }))}
                className={`flex items-center gap-1.5 text-[11px] cursor-pointer transition-colors ${likedAnn[ann.id] ? 'text-red-400' : 'text-neutral-500 hover:text-red-400'}`}>
                <Heart className={`w-4 h-4 ${likedAnn[ann.id] ? 'fill-current' : ''}`} />
                <span>{ann.likes_count + (likedAnn[ann.id] ? 1 : 0)}</span>
              </button>
              <button onClick={() => setShowComment(v => !v)}
                className="flex items-center gap-1.5 text-[11px] text-neutral-500 hover:text-blue-400 cursor-pointer transition-colors">
                <MessageSquare className="w-4 h-4" /> Comment
              </button>
            </div>
          )}
        </div>
        {showComment && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
            <textarea
              rows={2}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder={lang === 'EN' ? 'Write your comment...' : 'አስተያየትዎን ይጻፉ...'}
              className="w-full p-2.5 rounded-xl text-xs border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d4ff00] resize-none"
            />
            <button
              onClick={() => { if (commentText.trim()) { onToast(lang === 'EN' ? 'Comment submitted!' : 'አስተያየት ተልኳል!', 'success'); setCommentText(''); setShowComment(false); } }}
              className="mt-2 px-4 py-1.5 rounded-lg bg-[#d4ff00] text-black text-[11px] font-black uppercase cursor-pointer active:scale-95"
            >
              {lang === 'EN' ? 'Submit' : 'አስገባ'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── CONNECT & CHAT SECTION (students connect with full members & peers) ────────
interface ConnectProps {
  member: Member;
  lang: 'EN' | 'AM';
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}
const ConnectChatSection: React.FC<ConnectProps> = ({ member, lang, onToast }) => {
  const [chatPerson, setChatPerson] = useState<{ name: string; role: string } | null>(null);
  const [msgInput, setMsgInput] = useState('');
  const [messages, setMessages] = useState<{ from: 'me' | 'them'; text: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'mentors' | 'peers' | 'chat'>('mentors');

  const mentors = [
    { name: 'Dr. Selamawit Bekele', specialty: 'Clinical & Trauma Psychology', workplace: 'Addis Ababa University', available: true, photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200' },
    { name: 'Dr. Dawit Mekonnen', specialty: 'Neuropsychology & Psychometrics', workplace: 'Jimma University', available: true, photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
    { name: 'Aster Haile, M.Sc.', specialty: 'Counseling Psychology', workplace: 'St. Paul Hospital', available: false, photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200' },
    { name: 'Dr. Yonas Biruk', specialty: 'Child & Adolescent Psychology', workplace: 'ALERT Hospital', available: true, photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200' },
  ];

  const peers = [
    { name: 'Sara Bekele', year: 'Year 3', university: 'Addis Ababa University', photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200' },
    { name: 'Temesgen Alemu', year: 'Year 4', university: 'Jimma University', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200' },
    { name: 'Hana Tadesse', year: 'Year 2', university: 'AAU', photo: 'https://images.unsplash.com/photo-1554727242-741c14fa561c?auto=format&fit=crop&q=80&w=200' },
  ];

  const openChat = (name: string, role: string) => {
    setChatPerson({ name, role });
    setMessages([{ from: 'them', text: `Hello! I'm ${name}. How can I help you?` }]);
    setActiveTab('chat');
  };

  const sendMessage = () => {
    if (!msgInput.trim()) return;
    const newMessages = [...messages, { from: 'me' as const, text: msgInput }];
    setMessages(newMessages);
    setMsgInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { from: 'them', text: 'Thank you for your message! I\'ll get back to you soon.' }]);
    }, 800);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-gray-100 dark:bg-[#0c0c0e] p-1 rounded-2xl overflow-x-auto no-scrollbar mb-4">
        {[
          { id: 'mentors', label: lang === 'EN' ? 'Mentors' : 'አማካሪዎች' },
          { id: 'peers', label: lang === 'EN' ? 'Peer Students' : 'የትምህርት ባልደረቦች' },
          { id: 'chat', label: lang === 'EN' ? 'Messages' : 'መልዕክቶች' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
              activeTab === t.id ? 'bg-[#d4ff00] text-black shadow-md' : 'text-gray-600 dark:text-neutral-400'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'mentors' && (
        <div className="space-y-3">
          <p className="text-xs text-neutral-500">{lang === 'EN' ? 'Connect with licensed full members for professional mentorship and guidance.' : 'ለሙያ ምክር ከሙሉ አባላት ጋር ይገናኙ።'}</p>
          {mentors.map((m, i) => (
            <div key={i} className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-4 flex items-center gap-4">
              <div className="relative shrink-0">
                <img src={m.photo} alt={m.name} className="w-14 h-14 rounded-2xl object-cover border border-gray-200 dark:border-white/10" />
                <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#121214] ${m.available ? 'bg-green-400' : 'bg-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-gray-900 dark:text-white truncate">{m.name}</p>
                <p className="text-xs text-green-700 dark:text-[#d4ff00] font-medium truncate">{m.specialty}</p>
                <p className="text-[11px] text-neutral-500 truncate">{m.workplace}</p>
              </div>
              <button onClick={() => openChat(m.name, m.specialty)}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-[#d4ff00] text-black text-[10px] font-black uppercase cursor-pointer active:scale-95">
                Chat
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'peers' && (
        <div className="space-y-3">
          <p className="text-xs text-neutral-500">{lang === 'EN' ? 'Connect and collaborate with fellow psychology students across Ethiopia.' : 'ከሌሎች ተማሪዎች ጋር ይተባበሩ።'}</p>
          {peers.map((p, i) => (
            <div key={i} className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-4 flex items-center gap-4">
              <img src={p.photo} alt={p.name} className="w-12 h-12 rounded-2xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-gray-900 dark:text-white">{p.name}</p>
                <p className="text-xs text-neutral-500">{p.year} • {p.university}</p>
              </div>
              <button onClick={() => openChat(p.name, 'Student')}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-black text-gray-900 dark:text-white cursor-pointer active:scale-95">
                Chat
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="flex flex-col h-[420px] bg-gray-50 dark:bg-[#0d0d0f] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
          {chatPerson ? (
            <>
              <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#121214]">
                <div className="w-8 h-8 rounded-full bg-[#d4ff00]/20 flex items-center justify-center text-sm font-black text-[#d4ff00]">{chatPerson.name[0]}</div>
                <div>
                  <p className="text-sm font-black text-gray-900 dark:text-white">{chatPerson.name}</p>
                  <p className="text-[10px] text-neutral-500">{chatPerson.role}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.from === 'me'
                        ? 'bg-[#d4ff00] text-black rounded-br-sm'
                        : 'bg-white dark:bg-white/10 text-gray-900 dark:text-white rounded-bl-sm border border-gray-100 dark:border-white/10'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-gray-200 dark:border-white/10 flex gap-2">
                <input
                  type="text"
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder={lang === 'EN' ? 'Type a message...' : 'መልዕክት ይጻፉ...'}
                  className="flex-1 px-3 py-2 rounded-xl text-xs border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d4ff00]"
                />
                <button onClick={sendMessage}
                  className="px-4 py-2 rounded-xl bg-[#d4ff00] text-black text-xs font-black uppercase cursor-pointer active:scale-95">
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-neutral-500">
              <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-bold">{lang === 'EN' ? 'No conversation selected' : 'ምንም ንግግር አልተመረጠም'}</p>
              <p className="text-xs mt-1">{lang === 'EN' ? 'Click "Chat" on any member above to start messaging.' : 'ከላይ "Chat" ን ይጫኑ'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── STUDENT PORTAL ─────────────────────────────────────────────────────────────

const StudentPortal: React.FC<MemberPortalViewProps> = ({
  member, lang, cpdCourses, announcements, onOpenIdCard, onOpenDirectory, onRegisterCPD, onToast
}) => {
  const [section, setSection] = useState<'overview' | 'cpd' | 'mentor' | 'jobs' | 'news'>('overview');
  const [likedAnn, setLikedAnn] = useState<Record<string, boolean>>({});

  const daysLeft = Math.ceil((new Date(member.expires_at).getTime() - Date.now()) / 86400000);
  const registeredCourses = cpdCourses.filter(c => c.registered);
  const availableCourses = cpdCourses.filter(c => !c.registered && !c.is_completed);

  const tabs = [
    { id: 'overview', label: lang === 'EN' ? 'Dashboard' : 'ዳሽቦርድ', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'cpd', label: lang === 'EN' ? 'Webinars' : 'ዌቢናሮች', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'mentor', label: lang === 'EN' ? 'Connect' : 'ተወዳደሩ', icon: <Users className="w-4 h-4" /> },
    { id: 'jobs', label: lang === 'EN' ? 'Jobs' : 'ስራ', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'news', label: lang === 'EN' ? 'News' : 'ዜና', icon: <Bell className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl mb-6 p-6"
        style={{ background: 'linear-gradient(135deg, #0f2a0f 0%, #0a1a0a 60%, #050d05 100%)', border: '1px solid rgba(212,255,0,0.18)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 10%, #d4ff00 0%, transparent 55%)' }} />
        <div className="relative z-10 flex items-start gap-4">
          <img src={member.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
            alt={member.first_name} className="w-16 h-16 rounded-2xl object-cover border-2 border-[#d4ff00]/40 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#d4ff00] bg-[#d4ff00]/10 px-2 py-0.5 rounded-full border border-[#d4ff00]/20">
                {lang === 'EN' ? '● Student Member' : '● የተማሪ አባል'}
              </span>
              {member.is_verified && (
                <span className="text-[10px] font-mono font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {lang === 'EN' ? 'Verified' : 'ተረጋግጧል'}
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-white mt-1 uppercase">{member.first_name} {member.father_name}</h2>
            {member.amharic_full_name && <p className="text-[#d4ff00]/70 text-sm">{member.amharic_full_name}</p>}
            <p className="text-neutral-400 text-xs mt-0.5">{member.student_profile?.field_of_study || 'Psychology Student'} {member.student_profile?.academic_year ? `— Year ${member.student_profile.academic_year}` : ''}</p>
            <p className="text-neutral-500 text-[10px] font-mono mt-0.5">{member.student_profile?.university_name || member.city} • {member.membership_number}</p>
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/10">
          {[
            { label: lang === 'EN' ? 'CPD Points' : 'CPD ነጥቦች', value: member.cpd_points, color: 'text-[#d4ff00]' },
            { label: lang === 'EN' ? 'Courses' : 'ኮርሶች', value: registeredCourses.length, color: 'text-white' },
            { label: lang === 'EN' ? 'Days Left' : 'ቀናት', value: `${daysLeft}d`, color: daysLeft < 60 ? 'text-amber-400' : 'text-white' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[9px] font-mono text-neutral-500 uppercase mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: <FileText className="w-5 h-5" />, label: lang === 'EN' ? 'Digital ID' : 'ዲጂታል ID', action: onOpenIdCard, color: 'text-[#d4ff00]' },
          { icon: <Search className="w-5 h-5" />, label: lang === 'EN' ? 'Find Mentor' : 'አማካሪ ፈልግ', action: () => setSection('mentor'), color: 'text-blue-400' },
          { icon: <BookOpen className="w-5 h-5" />, label: lang === 'EN' ? 'Webinars' : 'ዌቢናሮች', action: () => setSection('cpd'), color: 'text-purple-400' },
          { icon: <Briefcase className="w-5 h-5" />, label: lang === 'EN' ? 'Job Board' : 'የስራ ዝርዝር', action: () => setSection('jobs'), color: 'text-green-400' },
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
          <button key={tab.id} onClick={() => setSection(tab.id as any)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer flex-1 justify-center ${
              section === tab.id ? 'bg-[#d4ff00] text-black shadow-md' : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
            }`}>
            {tab.icon}<span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {section === 'overview' && (
        <div className="space-y-4">
          {/* Announcements */}
          <div className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-green-700 dark:text-[#d4ff00]" />
              <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white">{lang === 'EN' ? 'Latest News' : 'ወቅታዊ ዜናዎች'}</h3>
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
                    {ann.category === 'Election' || ann.is_draft ? (
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => onToast(lang === 'EN' ? 'Vote cast: Approve' : 'ድምጽ: አጽድቁ', 'success')} className="px-3 py-1 rounded bg-green-500/10 hover:bg-green-500/20 text-green-600 text-[10px] font-bold uppercase cursor-pointer">
                          ✓ Approve
                        </button>
                        <button onClick={() => onToast(lang === 'EN' ? 'Vote cast: Needs Adjustment' : 'ድምጽ: ማስተካከያ', 'info')} className="px-3 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 text-[10px] font-bold uppercase cursor-pointer">
                          ↺ Adjust
                        </button>
                        <button onClick={() => onToast(lang === 'EN' ? 'Comment panel opening...' : 'አስተያየት ይስጡ', 'info')} className="px-3 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 text-[10px] font-bold uppercase cursor-pointer flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> Comment
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button onClick={() => setLikedAnn(p => ({ ...p, [ann.id]: !p[ann.id] }))}
                          className={`text-[10px] flex items-center gap-1 cursor-pointer ${likedAnn[ann.id] ? 'text-red-400' : 'text-neutral-500'}`}>
                          <Heart className={`w-3 h-3 ${likedAnn[ann.id] ? 'fill-current' : ''}`} />
                          <span>{ann.likes_count + (likedAnn[ann.id] ? 1 : 0)}</span>
                        </button>
                        <button onClick={() => onToast('Comment opened.', 'info')} className="text-[10px] flex items-center gap-1 cursor-pointer text-neutral-500 hover:text-blue-400">
                          <MessageSquare className="w-3 h-3" /> Comment
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setSection('news' as any)}
              className="w-full mt-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              {lang === 'EN' ? 'View All News' : 'ሁሉንም ዜናዎች እይ'}
            </button>
          </div>

          {/* Upcoming webinars */}
          {availableCourses.length > 0 && (
            <div className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-700 dark:text-[#d4ff00]" />
                  <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white">{lang === 'EN' ? 'Upcoming Webinars' : 'መጪ ዌቢናሮች'}</h3>
                </div>
                <button onClick={() => setSection('cpd')} className="text-[11px] font-bold text-green-700 dark:text-[#d4ff00] cursor-pointer">{lang === 'EN' ? 'See all' : 'ሁሉም'}</button>
              </div>
              {availableCourses.slice(0, 2).map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 mb-2 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{c.title}</p>
                    <p className="text-[10px] text-neutral-500">{c.mode} • {c.points} CPD pts</p>
                  </div>
                  <button onClick={() => { onRegisterCPD(c.id); onToast(lang === 'EN' ? 'Registered!' : 'ተመዝግበዋል!', 'success'); }}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-[#d4ff00] text-black text-[10px] font-black uppercase cursor-pointer">
                    {lang === 'EN' ? 'Join' : 'ተሳተፍ'}
                  </button>
                </div>
              ))}
            </div>
          )}
        {/* Membership status */}
          <div className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-green-700 dark:text-[#d4ff00]" />
              <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white">{lang === 'EN' ? 'Membership Status' : 'የአባልነት ሁኔታ'}</h3>
            </div>
            {[
              { label: lang === 'EN' ? 'Membership No.' : 'የአባልነት ቁጥር', value: member.membership_number },
              { label: lang === 'EN' ? 'Valid Until' : 'ዋጋ ያለው እስከ', value: new Date(member.expires_at).toLocaleDateString() },
              { label: 'Status', value: member.status },
            ].map((r, i) => (
              <div key={i} className="flex justify-between text-xs py-1.5 border-b border-gray-100 dark:border-white/5 last:border-0">
                <span className="text-neutral-600 dark:text-neutral-400">{r.label}</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{r.value}</span>
              </div>
            ))}
            {daysLeft < 60 && (
              <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-600 dark:text-amber-400">{lang === 'EN' ? `Membership expires in ${daysLeft} days.` : `አባልነትዎ በ${daysLeft} ቀናት ያበቃል።`}</p>
              </div>
            )}
          </div>

          </div>
      )}

      {section === 'cpd' && (
        <div className="space-y-3">
          <p className="text-xs font-black uppercase text-neutral-600 dark:text-neutral-400 mb-2">{lang === 'EN' ? 'All Webinars & Workshops' : 'ሁሉም ዌቢናሮችና ወርክሾፖች'}</p>
          {cpdCourses.map(c => (
            <div key={c.id} className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                      c.is_completed ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' :
                      c.registered ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                      'bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] border-[#d4ff00]/20'
                    }`}>
                      {c.is_completed ? '✓ Done' : c.registered ? 'Registered' : c.mode}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-neutral-500">{c.points} CPD pts</span>
                  </div>
                  <h4 className="font-black text-sm text-gray-900 dark:text-white">{c.title}</h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">{c.instructor_title} {c.instructor}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-neutral-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(c.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.duration}</span>
                  </div>
                </div>
                {c.is_completed ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-1" /> :
                 !c.registered ? (
                  <button onClick={() => { onRegisterCPD(c.id); onToast(lang === 'EN' ? 'Registered!' : 'ተመዝግበዋል!', 'success'); }}
                    className="shrink-0 px-3 py-2 rounded-xl bg-[#d4ff00] text-black text-[10px] font-black uppercase cursor-pointer active:scale-95">
                    {lang === 'EN' ? 'Register' : 'ተመዝገብ'}
                  </button>
                ) : (
                  <span className="text-[10px] font-mono text-blue-500 dark:text-blue-400 shrink-0">✓ Enrolled</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {section === 'mentor' && (
        <ConnectChatSection member={member} lang={lang} onToast={onToast} />
      )}

      {section === 'jobs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white">{lang === 'EN' ? 'Jobs & Internships' : 'ስራ እና ልምምድ'}</h3>
              <p className="text-xs text-neutral-500 mt-0.5">{lang === 'EN' ? 'Graduate & internship opportunities in psychology across Ethiopia.' : 'የምሩቃን እና ልምምድ እድሎች'}</p>
            </div>
          </div>
          {[
            { title: 'Psychosocial Support Intern', org: 'UNHCR Ethiopia', location: 'Addis Ababa', type: 'Internship', deadline: 'Sep 15, 2026', pay: 'Stipend: 3,500 ETB/mo' },
            { title: 'Research Assistant – Mental Health', org: 'Jimma University', location: 'Jimma', type: 'Part-time', deadline: 'Sep 20, 2026', pay: '4,000 ETB/mo' },
            { title: 'School Counselor (Graduate)', org: 'Addis Ababa Education Bureau', location: 'Addis Ababa', type: 'Full-time', deadline: 'Oct 1, 2026', pay: 'Gov. Scale' },
            { title: 'Community Mental Health Worker', org: 'Partners in Health Ethiopia', location: 'Gondar', type: 'Contract', deadline: 'Sep 30, 2026', pay: 'Negotiable' },
          ].map((job, i) => (
            <div key={i} className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      job.type === 'Internship' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' :
                      job.type === 'Full-time' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' :
                      'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                    }`}>{job.type}</span>
                  </div>
                  <h4 className="font-black text-sm text-gray-900 dark:text-white">{job.title}</h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">{job.org} • {job.location}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-500">
                    <span>Deadline: {job.deadline}</span>
                    <span className="text-[#d4ff00]/80">{job.pay}</span>
                  </div>
                </div>
                <button onClick={() => onToast(lang === 'EN' ? 'Opening application form...' : 'ማመልከቻ እየተከፈተ ነው...', 'info')}
                  className="shrink-0 px-3 py-2 rounded-xl bg-[#d4ff00] text-black text-[10px] font-black uppercase cursor-pointer active:scale-95 hover:bg-[#c3eb00]">
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {section === 'news' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-green-700 dark:text-[#d4ff00]" />
            <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white">{lang === 'EN' ? 'All News & Announcements' : 'ሁሉም ዜናዎች'}</h3>
          </div>
          <div className="space-y-4">
            {announcements.map(ann => (
              <AnnouncementCard key={ann.id} ann={ann} lang={lang} onToast={onToast}
                likedAnn={likedAnn} setLikedAnn={setLikedAnn} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};



// ── FULL MEMBER PORTAL ─────────────────────────────────────────────────────────
const FullMemberPortal: React.FC<MemberPortalViewProps> = ({
  member, lang, cpdCourses, announcements, onOpenIdCard, onOpenVoting, onOpenDirectory, onRegisterCPD, onToast
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'cpd' | 'announcements' | 'license' | 'research'>('overview');
  const [likedAnn, setLikedAnn] = useState<Record<string, boolean>>({});
  const [bookmarkedAnn, setBookmarkedAnn] = useState<Record<string, boolean>>({});
  const [draftVotes, setDraftVotes] = useState<Record<string, 'approve' | 'adjust' | null>>({});
  const [researchArticles, setResearchArticles] = useState<ResearchArticle[]>([]);

  const cpdTarget = 50;
  const cpdProgress = Math.min((member.cpd_points / cpdTarget) * 100, 100);
  const completedCourses = cpdCourses.filter(c => c.is_completed);

  const handleDownloadCert = () => onToast(lang === 'EN' ? 'EPA Membership Certificate downloaded (PDF)!' : 'የኢሳይባ አባልነት ሰርተፊኬት ወርዷል!', 'success');

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#080808] text-gray-900 dark:text-white">

      {/* ── PROFILE BANNER ── */}
      <div className="bg-gray-50 dark:bg-[#121214] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden mb-8 border border-gray-200 dark:border-white/10 grid-lines-bg">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4ff00]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img src={member.photo_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300'}
                alt={member.first_name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-[#d4ff00] shadow-lg bg-black" />
              <div className="absolute -bottom-1 -right-1 bg-[#d4ff00] text-black p-1 rounded-full border-2 border-black">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] border border-[#d4ff00]/30 text-[10px] font-mono font-black uppercase tracking-wider">
                  ● {member.status} ACCREDITED
                </span>
                <span className="text-xs text-neutral-600 dark:text-neutral-400 font-mono">{member.membership_number}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white uppercase">
                {member.first_name} {member.father_name} {member.grandfather_name || ''}
              </h1>
              {member.amharic_full_name && <p className="text-xs font-semibold text-green-700 dark:text-[#d4ff00]">{member.amharic_full_name}</p>}
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 flex items-center gap-2 font-mono">
                <span>{member.specialty}</span><span>•</span><span>{member.workplace}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button onClick={onOpenIdCard}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#d4ff00] hover:bg-[#c3eb00] text-black text-xs font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 cursor-pointer">
              <CreditCard className="w-4 h-4" />
              <span>{lang === 'EN' ? 'Digital ID Pass' : 'ዲጂታል መታወቂያ'}</span>
            </button>
            <button onClick={handleDownloadCert}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer">
              <Download className="w-4 h-4 text-green-700 dark:text-[#d4ff00]" />
              <span>{lang === 'EN' ? 'Certificate (PDF)' : 'ሰርተፊኬት (PDF)'}</span>
            </button>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { label: lang === 'EN' ? 'Annual CPD Score' : 'CPD ነጥቦች', value: `${member.cpd_points} / 50 PTS`, color: 'text-green-700 dark:text-[#d4ff00]' },
            { label: lang === 'EN' ? 'License Number' : 'የፈቃድ ቁጥር', value: member.license_number || 'LICENSED', color: 'text-gray-900 dark:text-white' },
            { label: lang === 'EN' ? 'Valid Until' : 'ያበቃበት ቀን', value: new Date(member.expires_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), color: 'text-gray-900 dark:text-white' },
            { label: lang === 'EN' ? 'Voting Rights' : 'መምረጥ መብት', value: '✓ Eligible', color: 'text-green-700 dark:text-[#d4ff00]' },
          ].map((s, i) => (
            <div key={i}>
              <span className="text-[10px] uppercase font-mono font-bold text-neutral-600 dark:text-neutral-400 block">{s.label}</span>
              <div className={`text-sm sm:text-base font-black mt-0.5 font-mono ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
        {/* CPD bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-mono font-bold text-neutral-600 dark:text-neutral-400">{lang === 'EN' ? 'Annual CPD Progress' : 'ዓመታዊ CPD ሂደት'}</span>
            <span className="font-mono font-bold text-green-700 dark:text-[#d4ff00]">{Math.round(cpdProgress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-[#d4ff00] transition-all duration-500" style={{ width: `${cpdProgress}%` }} />
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-white/10 mb-8 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: lang === 'EN' ? 'Dashboard Overview' : 'ዳሽቦርድ' },
          { id: 'cpd', label: lang === 'EN' ? 'CPD & Continuing Education' : 'CPD ማሻሻያ' },
          { id: 'research', label: lang === 'EN' ? 'Research & Articles' : 'ምርምር' },
          { id: 'announcements', label: lang === 'EN' ? 'News Feed' : 'ዜናዎች' },
          { id: 'license', label: lang === 'EN' ? 'License & Renewal' : 'ፈቃድ / ማደስ' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`pb-3 px-4 text-xs font-mono font-black uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === t.id ? 'border-[#d4ff00] text-green-700 dark:text-[#d4ff00]' : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">

          <div className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-green-700 dark:text-[#d4ff00]" />
                <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white">{lang === 'EN' ? 'Latest News' : 'ወቅታዊ ዜናዎች'}</h3>
              </div>
              <button onClick={() => setActiveTab('announcements')} className="text-[10px] font-black uppercase text-blue-500 hover:underline">
                {lang === 'EN' ? 'View All' : 'ሁሉንም እይ'}
              </button>
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
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div onClick={onOpenVoting} className="bg-[#d4ff00] rounded-2xl p-6 text-black shadow-lg cursor-pointer hover:bg-[#c3eb00] transition-all hover:scale-[1.01]">
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 bg-black/10 rounded-xl"><Vote className="w-5 h-5 text-black" /></span>
                <span className="text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full bg-black text-[#d4ff00]">LIVE BALLOT</span>
              </div>
              <h4 className="font-black text-base uppercase tracking-tight">{lang === 'EN' ? 'EPA Executive Election 2026' : 'የስራ አስፈጻሚ ምርጫ 2026'}</h4>
              <p className="text-xs text-black/80 mt-1">{lang === 'EN' ? 'Cast your verified ballot for President & Board.' : 'ለፕሬዝዳንት እና ለስራ አስፈጻሚ አባላት ድምጽዎን ይስጡ።'}</p>
            </div>
            <div onClick={onOpenDirectory} className="bg-gray-50 dark:bg-[#121214] rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-md cursor-pointer hover:border-[#d4ff00]/30 transition-all hover:scale-[1.01]">
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 bg-black/5 dark:bg-white/5 text-green-700 dark:text-[#d4ff00] border border-gray-200 dark:border-white/10 rounded-xl"><Users className="w-5 h-5" /></span>
                <span className="text-[10px] font-mono font-bold text-neutral-500">1,280+ MEMBERS</span>
              </div>
              <h4 className="font-black text-base text-gray-900 dark:text-white uppercase tracking-tight">{lang === 'EN' ? 'Psychologist Directory' : 'የባለሙያዎች ማውጫ'}</h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">{lang === 'EN' ? 'Find colleagues, clinical supervisors, and referral partners.' : 'የስራ ባልደረቦችን እና ክሊኒኮችን ይፈልጉ።'}</p>
            </div>
            <div onClick={() => setActiveTab('cpd')} className="bg-gray-50 dark:bg-[#121214] rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-md cursor-pointer hover:border-[#d4ff00]/30 transition-all hover:scale-[1.01]">
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 bg-black/5 dark:bg-white/5 text-green-700 dark:text-[#d4ff00] border border-gray-200 dark:border-white/10 rounded-xl"><Award className="w-5 h-5" /></span>
                <span className="text-[10px] font-mono font-black text-green-700 dark:text-[#d4ff00]">{member.cpd_points}/50 PTS</span>
              </div>
              <h4 className="font-black text-base text-gray-900 dark:text-white uppercase tracking-tight">{lang === 'EN' ? 'CPD Progress Hub' : 'CPD ነጥቦች'}</h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">{lang === 'EN' ? 'Register for accredited workshops and earn points.' : 'ነጥቦቹን ያሟሉ።'}</p>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-[#121214] rounded-3xl p-6 sm:p-7 border border-gray-200 dark:border-white/10 shadow-md">
            <h3 className="text-base font-black text-gray-900 dark:text-white uppercase mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-700 dark:text-[#d4ff00]" />{lang === 'EN' ? 'Accreditation Dossier' : 'የሙያ መረጃ ማጠቃለያ'}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">{member.bio || 'Accredited member of the Ethiopian Psychologists\' Association in good standing.'}</p>
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {[
                { label: 'Registered Workplace', value: member.workplace },
                { label: 'Official Email', value: member.email },
                { label: 'City & Region', value: `${member.city}, Ethiopia` },
              ].map((r, i) => (
                <div key={i}>
                  <span className="text-neutral-500 font-mono font-bold block uppercase text-[10px]">{r.label}</span>
                  <span className="font-bold text-neutral-700 dark:text-neutral-200 mt-0.5 block font-mono">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Research & Articles Tab */}
      {activeTab === 'research' && (
        <ResearchPortal
          member={member}
          articles={researchArticles}
          lang={lang}
          onPublishArticle={(article) => {
            setResearchArticles(prev => [{ ...article, id: `art-${Date.now()}` } as ResearchArticle, ...prev]);
          }}
          onAddComment={(articleId, comment) => {
            setResearchArticles(prev => prev.map(a => a.id === articleId ? {
              ...a,
              comments: [...a.comments, {
                id: `c-${Date.now()}`,
                author_name: `${member.first_name} ${member.father_name}`,
                author_membership_number: member.membership_number,
                content: comment,
                created_at: new Date().toISOString()
              }]
            } : a));
          }}
          onLikeArticle={(articleId) => {
            setResearchArticles(prev => prev.map(a => a.id === articleId ? { ...a, likes_count: a.likes_count + 1 } : a));
          }}
          onToast={onToast}
        />
      )}

      {/* CPD Tab */}
      {activeTab === 'cpd' && (
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-black text-gray-900 dark:text-white uppercase text-sm">{lang === 'EN' ? 'Annual CPD Target: 50 Points' : 'ዓመታዊ CPD ግብ: 50 ነጥቦች'}</h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">{lang === 'EN' ? `${member.cpd_points} of 50 accredited points completed.` : `${member.cpd_points} ነጥቦች አጠናቅቀዋል።`}</p>
            </div>
            <div className="w-full sm:w-48">
              <div className="w-full h-3 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#d4ff00] rounded-full" style={{ width: `${cpdProgress}%` }} />
              </div>
              <span className="text-[10px] text-green-700 dark:text-[#d4ff00] font-bold font-mono mt-1 block text-right">{Math.round(cpdProgress)}% Complete</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cpdCourses.map(c => (
              <div key={c.id} className="bg-gray-50 dark:bg-[#121214] rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 border border-gray-200 dark:border-white/10 font-mono font-bold uppercase text-[10px]">{c.category}</span>
                    <span className="font-mono text-xs font-black text-green-700 dark:text-[#d4ff00] bg-[#d4ff00]/10 px-2 py-0.5 rounded-md border border-[#d4ff00]/30">+{c.points} CPD PTS</span>
                  </div>
                  <h4 className="font-black text-base text-gray-900 dark:text-white uppercase leading-snug">{c.title}</h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">Instructor: <span className="font-semibold text-neutral-700 dark:text-neutral-200">{c.instructor}</span> ({c.instructor_title})</p>
                  <div className="flex items-center gap-4 text-xs text-neutral-500 mt-3 pt-3 border-t border-gray-200 dark:border-white/10">
                    <span className="flex items-center gap-1 font-mono text-[11px]"><Calendar className="w-3.5 h-3.5" />{c.date}</span>
                    <span className="flex items-center gap-1 text-[11px] font-mono"><Clock className="w-3.5 h-3.5" />{c.duration}</span>
                  </div>
                </div>
                <div className="mt-5 pt-3 border-t border-gray-100 dark:border-white/5">
                  {c.is_completed ? (
                    <div className="flex items-center gap-1.5 text-green-700 dark:text-[#d4ff00] text-xs font-mono font-bold py-2">
                      <Check className="w-4 h-4" /><span>{lang === 'EN' ? 'Completed • Certificate Issued' : 'ተጠናቋል'}</span>
                    </div>
                  ) : c.registered ? (
                    <div className="flex items-center justify-between text-xs py-2 text-green-700 dark:text-[#d4ff00] font-mono font-bold">
                      <span>✓ {lang === 'EN' ? 'Registered (Zoom Link Sent)' : 'ተመዝግበዋል'}</span>
                      <button className="text-xs text-gray-900 dark:text-white underline font-semibold cursor-pointer">Join Session</button>
                    </div>
                  ) : (
                    <button onClick={() => onRegisterCPD(c.id)}
                      className="w-full py-3 rounded-xl bg-[#d4ff00] hover:bg-[#c3eb00] text-black text-xs font-black uppercase tracking-wider shadow-sm transition-colors cursor-pointer">
                      {lang === 'EN' ? 'Register for Workshop' : 'ለስልጠናው ይመዝገቡ'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {announcements.map(ann => (
            <div key={ann.id} className="bg-gray-50 dark:bg-[#121214] rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-md">
              {ann.cover_photo_url && (
                <img src={ann.cover_photo_url} alt={ann.title} className="w-full h-40 object-cover rounded-xl mb-4" />
              )}
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] border border-[#d4ff00]/30 font-mono font-bold uppercase text-[10px]">{ann.category}</span>
                <span className="text-neutral-600 dark:text-neutral-400 font-mono text-xs">{new Date(ann.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <h3 className="font-black text-base text-gray-900 dark:text-white uppercase mb-2">
                {lang === 'EN' ? ann.title : ann.amharic_title || ann.title}
                {(ann as any).is_draft && <span className="ml-2 text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full">DRAFT</span>}
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">{ann.content}</p>

              {(ann as any).file_attachment_url && (
                <a href={(ann as any).file_attachment_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mb-4 px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-900 dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                  <FileText className="w-4 h-4" />
                  View Attached Document
                </a>
              )}

              {(ann as any).is_draft && (
                <div className="mt-2 mb-4 p-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/10 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-500 mb-2">Cast your vote on this draft</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDraftVotes(p => ({ ...p, [ann.id]: p[ann.id] === 'approve' ? null : 'approve' }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                        draftVotes[ann.id] === 'approve' ? 'bg-green-500 text-white' : 'bg-white dark:bg-black border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white'
                      }`}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setDraftVotes(p => ({ ...p, [ann.id]: p[ann.id] === 'adjust' ? null : 'adjust' }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                        draftVotes[ann.id] === 'adjust' ? 'bg-amber-500 text-white' : 'bg-white dark:bg-black border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white'
                      }`}
                    >
                      Needs Adjustment
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-white/10 text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                <span className="font-semibold text-neutral-700 dark:text-neutral-200">{ann.author}</span>
                <div className="flex items-center gap-4">
                  <button onClick={() => setLikedAnn(p => ({ ...p, [ann.id]: !p[ann.id] }))}
                    className={`flex items-center gap-1 font-semibold cursor-pointer transition-colors ${likedAnn[ann.id] ? 'text-red-500 dark:text-red-400' : 'text-neutral-500 hover:text-red-500'}`}>
                    <Heart className={`w-4 h-4 ${likedAnn[ann.id] ? 'fill-current' : ''}`} />
                    <span>{ann.likes_count + (likedAnn[ann.id] ? 1 : 0)}</span>
                  </button>
                  <button onClick={() => setBookmarkedAnn(p => ({ ...p, [ann.id]: !p[ann.id] }))}
                    className={`flex items-center gap-1 font-semibold cursor-pointer transition-colors ${bookmarkedAnn[ann.id] ? 'text-green-700 dark:text-[#d4ff00]' : 'text-neutral-500 hover:text-green-700 dark:hover:text-[#d4ff00]'}`}>
                    <Bookmark className={`w-4 h-4 ${bookmarkedAnn[ann.id] ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* License & Renewal Tab */}
      {activeTab === 'license' && (
        <div className="space-y-4 max-w-lg">
          <div className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-6">
            <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-700 dark:text-[#d4ff00]" />{lang === 'EN' ? 'License & Renewal' : 'ፈቃድ / ማደስ'}
            </h3>
            {[
              { label: lang === 'EN' ? 'License No.' : 'የፈቃድ ቁጥር', value: member.license_number || 'Not yet assigned' },
              { label: lang === 'EN' ? 'Membership Status' : 'አባልነት ሁኔታ', value: member.status },
              { label: lang === 'EN' ? 'Expires On' : 'ያበቃል', value: new Date(member.expires_at).toLocaleDateString() },
              { label: lang === 'EN' ? 'Renewal Fee' : 'ማደሻ ክፍያ', value: 'ETB 1,500' },
              { label: lang === 'EN' ? 'CPD Requirement' : 'CPD ፍላጎት', value: `${member.cpd_points}/50 pts${cpdProgress >= 100 ? ' ✓ Met' : ' (in progress)'}` },
            ].map((r, i) => (
              <div key={i} className="flex justify-between py-2 text-xs border-b border-gray-100 dark:border-white/5 last:border-0">
                <span className="text-neutral-600 dark:text-neutral-400">{r.label}</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{r.value}</span>
              </div>
            ))}
            <button onClick={() => onToast(lang === 'EN' ? 'Renewal form opened. Complete payment.' : 'ማደሻ ሂደት ተጀምሯል።', 'info')}
              className="w-full mt-4 py-3 rounded-xl bg-[#d4ff00] text-black font-black uppercase tracking-wider text-sm cursor-pointer active:scale-95">
              {lang === 'EN' ? 'Renew Membership (ETB 1,500)' : 'አባልነት አድስ (ብር 1,500)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── CORPORATE PORTAL ───────────────────────────────────────────────────────────
const CorporatePortal: React.FC<MemberPortalViewProps> = ({
  member, lang, cpdCourses, announcements, onOpenDirectory, onRegisterCPD, onToast
}) => {
  const [section, setSection] = useState<'overview' | 'staff' | 'workshops' | 'jobs'>('overview');
  const mockStaff = [
    { name: 'Meron Haile', role: 'Clinical Psychologist', status: 'Active' },
    { name: 'Abebe Tadesse', role: 'Counselor', status: 'Pending' },
    { name: 'Tigist Bekele', role: 'Researcher', status: 'Active' },
  ];
  const daysLeft = Math.ceil((new Date(member.expires_at).getTime() - Date.now()) / 86400000);
  const tabs = [
    { id: 'overview', label: lang === 'EN' ? 'Overview' : 'መነሻ', icon: <Building2 className="w-4 h-4" /> },
    { id: 'staff', label: lang === 'EN' ? 'Staff' : 'ሰራተኞች', icon: <Users className="w-4 h-4" /> },
    { id: 'workshops', label: lang === 'EN' ? 'Workshops' : 'ወርክሾፖች', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'jobs', label: lang === 'EN' ? 'Job Board' : 'ስራ', icon: <Briefcase className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Corp Header */}
      <div className="relative overflow-hidden rounded-3xl mb-6 p-6"
        style={{ background: 'linear-gradient(135deg, #1a1200 0%, #120d00 50%, #0a0900 100%)', border: '1px solid rgba(245,158,11,0.3)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 20%, #f59e0b 0%, transparent 50%)' }} />
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Building2 className="w-8 h-8 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                {lang === 'EN' ? 'Corporate Member' : 'ድርጅታዊ አባል'}
              </span>
              <span className="text-[10px] font-mono font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Accredited
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-1 uppercase">{member.corporate_profile?.organization_name || `${member.first_name} Org`}</h2>
            <p className="text-amber-300/70 text-sm">{member.corporate_profile?.org_type || 'Healthcare Institution'}</p>
            <p className="text-neutral-400 text-xs mt-0.5 font-mono">{member.membership_number}</p>
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/10">
          {[
            { label: lang === 'EN' ? 'Active Staff' : 'ሰራተኞች', value: mockStaff.filter(s => s.status === 'Active').length, color: 'text-amber-400' },
            { label: lang === 'EN' ? 'Workshops' : 'ወርክሾፖች', value: cpdCourses.filter(c => c.registered).length, color: 'text-white' },
            { label: lang === 'EN' ? 'Days Left' : 'ቀናት', value: `${daysLeft}d`, color: daysLeft < 60 ? 'text-red-400' : 'text-white' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[9px] font-mono text-neutral-500 uppercase mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: <Plus className="w-5 h-5" />, label: lang === 'EN' ? 'Add Staff' : 'ሰራተኛ ጨምር', action: () => setSection('staff'), color: 'text-amber-400' },
          { icon: <BookOpen className="w-5 h-5" />, label: lang === 'EN' ? 'Book Workshop' : 'ወርክሾፕ ያዝ', action: () => setSection('workshops'), color: 'text-blue-400' },
          { icon: <Briefcase className="w-5 h-5" />, label: lang === 'EN' ? 'Post Job' : 'ስራ ለቀቅ', action: () => setSection('jobs'), color: 'text-green-400' },
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
          <button key={tab.id} onClick={() => setSection(tab.id as any)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer flex-1 justify-center ${
              section === tab.id ? 'bg-[#d4ff00] text-black shadow-md' : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
            }`}>
            {tab.icon}<span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {section === 'overview' && (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-green-700 dark:text-[#d4ff00]" />
              <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white">{lang === 'EN' ? 'EPA News' : 'EPA ዜናዎች'}</h3>
            </div>
            {announcements.slice(0, 3).map(ann => (
              <div key={ann.id} className="flex items-start gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5 mb-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2">{ann.title}</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">{new Date(ann.published_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 rounded-2xl border border-amber-500/20 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-500/20 rounded-xl"><Shield className="w-5 h-5 text-amber-400" /></div>
              <div>
                <h3 className="font-black text-sm text-gray-900 dark:text-white">{lang === 'EN' ? 'EPA Accreditation Seal' : 'የEPA ማረጋገጫ ምልክት'}</h3>
                <p className="text-[11px] text-neutral-500">{lang === 'EN' ? 'Valid for official publications & documents' : 'ለይፋዊ ሰነዶች ዋጋ አለው'}</p>
              </div>
            </div>
            <button onClick={() => onToast(lang === 'EN' ? 'Accreditation badge downloaded!' : 'ምልክት ወርዷል!', 'success')}
              className="w-full py-2.5 rounded-xl border border-amber-500/30 text-amber-500 dark:text-amber-400 text-xs font-black uppercase tracking-wider cursor-pointer active:scale-95">
              {lang === 'EN' ? 'Download Accreditation Badge' : 'ማረጋገጫ ምልክት አውርድ'}
            </button>
          </div>
        </div>
      )}

      {section === 'staff' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-700 dark:text-neutral-300">{lang === 'EN' ? 'Registered Psychology Staff' : 'ሰራተኞች'}</p>
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
                s.status === 'Active' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              }`}>{s.status}</span>
            </div>
          ))}
          <p className="text-xs text-center text-neutral-500">{lang === 'EN' ? 'Up to 5 staff included in corporate plan.' : 'እስከ 5 ሰራተኞች ይካተታሉ።'}</p>
        </div>
      )}

      {section === 'workshops' && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{lang === 'EN' ? 'Book certified EPA CPD workshops for your institution staff.' : 'ለሰራተኞቹ የEPA CPD ወርክሾፖችን ያስፈፅሙ።'}</p>
          {cpdCourses.slice(0, 4).map(c => (
            <div key={c.id} className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5 flex items-start justify-between gap-3">
              <div className="flex-1">
                <h4 className="font-black text-sm text-gray-900 dark:text-white">{c.title}</h4>
                <p className="text-xs text-neutral-500 mt-0.5">{c.instructor} • {c.duration}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] border border-[#d4ff00]/20">{c.mode}</span>
                  <span className="text-[10px] text-neutral-500">{c.points} CPD pts/person</span>
                </div>
              </div>
              <button onClick={() => { onRegisterCPD(c.id); onToast(lang === 'EN' ? 'Workshop booked!' : 'ወርክሾፕ ታቅዷል!', 'success'); }}
                className="shrink-0 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase cursor-pointer active:scale-95">
                {lang === 'EN' ? 'Book' : 'ያዝ'}
              </button>
            </div>
          ))}
        </div>
      )}

      {section === 'jobs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-700 dark:text-neutral-300">{lang === 'EN' ? 'Your Job Postings' : 'የስራ ማስታወቂያዎች'}</p>
            <button onClick={() => onToast(lang === 'EN' ? 'Job posting form opening...' : 'ቅጽ እየተከፈተ ነው...', 'info')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d4ff00] text-black text-xs font-black cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> {lang === 'EN' ? 'Post Job' : 'ስራ ለቀቅ'}
            </button>
          </div>
          <div className="text-center py-12 text-neutral-500">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{lang === 'EN' ? 'No active job postings.' : 'ንቁ ማስታወቂያዎች የሉም።'}</p>
            <p className="text-xs mt-1">{lang === 'EN' ? 'Post a job to reach accredited EPA psychologists.' : 'ሙያተኛ ለመፈለግ ስራ ይለቀቁ።'}</p>
          </div>
        </div>
      )}

      {section === 'news' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-green-700 dark:text-[#d4ff00]" />
            <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white">{lang === 'EN' ? 'All News & Announcements' : 'ሁሉም ዜናዎች'}</h3>
          </div>
          <div className="space-y-3">
            {announcements.map(ann => (
              <div key={ann.id} className="flex flex-col gap-2 p-4 rounded-xl bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-white/10 hover:border-amber-400/40 transition-colors">
                <p className="text-xs font-bold text-gray-900 dark:text-white leading-snug">{lang === 'EN' ? ann.title : (ann.amharic_title || ann.title)}</p>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">{ann.content}</p>
                <p className="text-[10px] text-neutral-500">{ann.category} • {new Date(ann.published_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};



// ── MAIN ROUTER ────────────────────────────────────────────────────────────────
export const MemberPortalView: React.FC<MemberPortalViewProps> = (props) => {
  if (props.member.membership_type === 'STUDENT') return <StudentPortal {...props} />;
  if (props.member.membership_type === 'CORPORATE') return <CorporatePortal {...props} />;
  return <FullMemberPortal {...props} />;
};
