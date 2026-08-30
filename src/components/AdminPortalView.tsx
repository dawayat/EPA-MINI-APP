import React, { useState } from 'react';
import { 
  Users, Clock, CreditCard, CheckCircle2, XCircle, AlertTriangle,
  Search, FileText, Plus, Building, ShieldCheck, Send, Eye, Check,
  X, ExternalLink, History, GraduationCap, Vote, BookOpen, BarChart2,
  Award, ChevronDown, Trash2, Image, TrendingUp, UploadCloud, Settings
} from 'lucide-react';
import { uploadFile } from '../lib/api';
import { Application, Member, University, Announcement, AuditLog, ApplicationStatus } from '../types';

interface AdminPortalViewProps {
  lang: 'EN' | 'AM';
  applications: Application[];
  members: Member[];
  universities: University[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
  onApproveApplication: (appId: string) => void;
  onRejectApplication: (appId: string, reason: string) => void;
  onRequestCorrection: (appId: string, notes: string) => void;
  onVerifyPayment: (appId: string) => void;
  onAddAnnouncement: (ann: Partial<Announcement>) => void;
  onAddUniversity: (uni: Partial<University>) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  lang,
  applications,
  members,
  universities,
  announcements,
  auditLogs,
  onApproveApplication,
  onRejectApplication,
  onRequestCorrection,
  onVerifyPayment,
  onAddAnnouncement,
  onAddUniversity,
  onToast,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'applications' | 'members' | 'cpd' | 'elections' | 'universities' | 'audit' | 'announcements'>('applications');
  const [selectedAppFilter, setSelectedAppFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('Send Reminder');
  const [electionOpen, setElectionOpen] = useState<boolean>(false);
  const [electionVotes, setElectionVotes] = useState({ yonas: 34, selamawit: 51, dawit: 22 });

  // Review Modal state
  const [reviewingApp, setReviewingApp] = useState<Application | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState<string>('');
  const [rejectReasonInput, setRejectReasonInput] = useState<string>('');
  const [isRejecting, setIsRejecting] = useState<boolean>(false);

  // New Announcement Modal state
  const [showAnnModal, setShowAnnModal] = useState<boolean>(false);
  const [newAnn, setNewAnn] = useState({
    title: '',
    amharic_title: '',
    category: 'General' as Announcement['category'],
    content: '',
    author: 'EPA Executive Directorate',
    cover_photo_url: '',
    is_draft: false,              // If true, opens voting before publishing
    file_attachment_url: '',      // Optional PDF/doc attachment
    target_audience: [] as string[]
  });
  
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const annFileInputRef = React.useRef<HTMLInputElement>(null);
  const annCoverInputRef = React.useRef<HTMLInputElement>(null);

  // Draft votes local state: announcementId -> { approve: number, adjust: number, userVote: string | null }
  const [draftVotes, setDraftVotes] = useState<Record<string, { approve: number; adjust: number; userVote: string | null }>>({});

  const toggleDraftVote = (annId: string, choice: 'approve' | 'adjust') => {
    setDraftVotes(prev => {
      const current = prev[annId] || { approve: 0, adjust: 0, userVote: null };
      if (current.userVote === choice) {
        // Undo vote
        return { ...prev, [annId]: { ...current, [choice]: current[choice] - 1, userVote: null } };
      }
      // Switch or new vote
      const undo = current.userVote ? { [current.userVote]: (current[current.userVote as 'approve' | 'adjust'] || 1) - 1 } : {};
      return { ...prev, [annId]: { ...current, ...undo, [choice]: current[choice] + 1, userVote: choice } };
    });
  };

  const totalVotes = electionVotes.yonas + electionVotes.selamawit + electionVotes.dawit;
  const toggleMemberSelect = (id: string) => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const selectAllMembers = () => {
    if (selectedMembers.length === members.length) setSelectedMembers([]);
    else setSelectedMembers(members.map(m => m.id));
  };

  // Filter applications
  const filteredApps = applications.filter(app => {
    const matchesFilter = selectedAppFilter === 'ALL' || app.status === selectedAppFilter;
    const fullName = `${app.first_name} ${app.father_name} ${app.application_number} ${app.email}`.toLowerCase();
    const matchesSearch = !searchQuery || fullName.includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingAppsCount = applications.filter(a => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW' || a.status === 'PAYMENT_PENDING').length;
  const unverifiedPaymentsCount = applications.filter(a => a.payment && a.payment.status === 'PENDING').length;

  const handleOpenReview = (app: Application) => {
    setReviewingApp(app);
    setAdminNoteInput(app.admin_notes || '');
    setIsRejecting(false);
  };

  const handlePublishAnnouncement = () => {
    if (!newAnn.title || !newAnn.content) {
      onToast(lang === 'EN' ? 'Title and content are required' : 'ርዕስ እና ይዘት ያስፈልጋል', 'error');
      return;
    }
    onAddAnnouncement(newAnn);
    setShowAnnModal(false);
    setNewAnn({ title: '', amharic_title: '', category: 'General', content: '', author: 'EPA Executive Directorate', cover_photo_url: '' });
    onToast(lang === 'EN' ? 'Announcement published live to member portal!' : 'ማስታወቂያው ይፋ ሆኗል!', 'success');
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#080808] text-gray-900 dark:text-white">
      
      {/* ════════ ADMIN HEADER & STATS ════════ */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-green-700 dark:text-[#d4ff00] bg-[#d4ff00]/10 px-3 py-1 rounded-full border border-[#d4ff00]/30">
                {lang === 'EN' ? 'Accreditation Board Access' : 'የአስተዳዳሪ መቆጣጠሪያ ገጽ'}
              </span>
              <span className="text-xs text-neutral-600 dark:text-neutral-500 dark:text-neutral-500 font-mono">ID: EPA-ADMIN-SECURE</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white font-syne uppercase tracking-tight mt-2">
              {lang === 'EN' ? 'EPA Accreditation & Council Admin' : 'የማኅበሩ አስተዳደር መድረክ'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={async () => {
                try {
                  onToast('Checking database...', 'info');
                  const res = await fetch('/api/migrate');
                  const data = await res.json();
                  if (data.success) {
                    onToast('✅ Database schema is correct!', 'success');
                  } else {
                    // Show the SQL in an alert for easy copying
                    const sqlMsg = data.sql_to_run || 'Check /api/migrate for details';
                    alert(`⚠️ DATABASE NEEDS UPDATING\n\n${data.message}\n\nCOPY AND RUN THIS IN SUPABASE SQL EDITOR:\n\n${sqlMsg}\n\nGo to: https://supabase.com/dashboard → Your Project → SQL Editor → Paste & Run`);
                    onToast(`DB needs SQL update — check the popup!`, 'error');
                  }
                } catch (e: any) {
                  onToast(`Error: ${e.message}`, 'error');
                }
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              Check DB
            </button>

            <button
              onClick={() => setShowAnnModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#d4ff00] hover:bg-[#c3eb00] text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-[#d4ff00]/15 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-black" />
              <span>{lang === 'EN' ? 'New Announcement' : 'አዲስ ማስታወቂያ'}</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {[
            { label: lang === 'EN' ? 'Active Members' : 'ንቁ አባላት', value: members.length, sub: '✓ Verified & Licensed', icon: <Users className="w-4 h-4" />, color: 'text-green-700 dark:text-[#d4ff00]' },
            { label: lang === 'EN' ? 'Pending Review' : 'በግምገማ ላይ', value: pendingAppsCount, sub: lang === 'EN' ? 'Awaiting council' : 'ውሳኔ የሚጠብቁ', icon: <Clock className="w-4 h-4" />, color: 'text-green-700 dark:text-[#d4ff00]' },
            { label: lang === 'EN' ? 'Unverified Payments' : 'ያልተረጋገጡ ክፍያዎች', value: unverifiedPaymentsCount, sub: 'Telebirr & CBE Slips', icon: <CreditCard className="w-4 h-4" />, color: 'text-amber-600 dark:text-amber-400' },
            { label: lang === 'EN' ? 'MoE Universities' : 'ተቋማት', value: universities.length, sub: 'Accredited Departments', icon: <GraduationCap className="w-4 h-4" />, color: 'text-gray-900 dark:text-white' },
          ].map((s, i) => (
            <div key={i} className="bg-gray-50 dark:bg-[#121214] rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-400 uppercase">{s.label}</span>
                <div className={`p-2.5 bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl ${s.color}`}>{s.icon}</div>
              </div>
              <div className={`text-3xl font-black font-syne ${s.color}`}>{s.value}</div>
              <div className="text-[11px] text-neutral-600 dark:text-neutral-400 font-mono mt-1">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Analytics mini bar chart */}
        <div className="bg-gray-50 dark:bg-[#121214] rounded-2xl p-5 border border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-green-700 dark:text-[#d4ff00]" />
            <span className="text-xs font-black uppercase text-gray-900 dark:text-white">{lang === 'EN' ? 'Member Distribution by Tier' : 'አባላት ስርጭት'}</span>
          </div>
          <div className="flex items-end gap-4">
            {[
              { label: 'Full', count: members.filter(m => m.membership_type === 'FULL').length, max: members.length, color: 'bg-[#d4ff00]' },
              { label: 'Student', count: members.filter(m => m.membership_type === 'STUDENT').length, max: members.length, color: 'bg-blue-500' },
              { label: 'Corporate', count: members.filter(m => m.membership_type === 'CORPORATE').length, max: members.length, color: 'bg-amber-500' },
            ].map((bar, i) => (
              <div key={i} className="flex-1 text-center">
                <div className="text-xs font-black text-gray-900 dark:text-white mb-1">{bar.count}</div>
                <div className="w-full rounded-t-lg" style={{ height: `${Math.max(8, Math.round((bar.count / (bar.max || 1)) * 80))}px`, background: bar.color === 'bg-[#d4ff00]' ? '#d4ff00' : bar.color === 'bg-blue-500' ? '#3b82f6' : '#f59e0b' }} />
                <div className="text-[10px] font-mono text-neutral-500 mt-1">{bar.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════ ADMIN SUB-TABS ════════ */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-white/10 mb-6 overflow-x-auto no-scrollbar">
        {[
          { id: 'applications', label: `${lang === 'EN' ? 'Applications' : 'ማመልከቻዎች'} (${applications.length})` },
          { id: 'members', label: lang === 'EN' ? 'Members' : 'አባላት' },
          { id: 'announcements', label: lang === 'EN' ? `Announcements (${announcements.length})` : 'ማስታወቂያዎች' },
          { id: 'cpd', label: 'CPD Manager' },
          { id: 'elections', label: lang === 'EN' ? 'Elections' : 'ምርጫ' },
          { id: 'universities', label: lang === 'EN' ? 'Universities' : 'ዩኒቨርሲቲዎች' },
          { id: 'audit', label: lang === 'EN' ? 'Audit Logs' : 'ኦዲት' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveAdminTab(t.id as any)}
            className={`pb-3 px-4 text-xs font-mono font-black uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeAdminTab === t.id ? 'border-[#d4ff00] text-green-700 dark:text-[#d4ff00]' : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════ TAB: APPLICATIONS ════════ */}
      {activeAdminTab === 'applications' && (
        <div className="bg-gray-50 dark:bg-[#121214] rounded-3xl border border-gray-200 dark:border-white/10 shadow-md overflow-hidden">
          {/* Filter and Search Bar */}
          <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-100 dark:bg-[#18181b]/50">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
              {['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'PAYMENT_PENDING', 'APPROVED', 'CORRECTION_REQUIRED', 'REJECTED'].map(status => (
                <button
                  key={status}
                  onClick={() => setSelectedAppFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
                    selectedAppFilter === status
                      ? 'bg-[#d4ff00] text-black shadow-sm'
                      : 'bg-black/5 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 border border-gray-200 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-neutral-600 dark:text-neutral-500 dark:text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={lang === 'EN' ? 'Search applicant name/ref...' : 'ፈልግ...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#d4ff00] bg-black text-gray-900 dark:text-white font-mono placeholder:text-neutral-600"
              />
            </div>
          </div>

          {/* Applications Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black border-b border-gray-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 font-mono font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Applicant</th>
                  <th className="p-4">Track</th>
                  <th className="p-4">Submitted</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-600 dark:text-neutral-500 dark:text-neutral-500 font-mono">
                      No applications found matching the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredApps.map(app => (
                    <tr key={app.id} className="hover:bg-black/5 dark:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={app.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                            alt=""
                            className="w-9 h-9 rounded-xl object-cover border border-white/20"
                          />
                          <div>
                            <div className="font-black text-gray-900 dark:text-white font-syne uppercase">
                              {app.first_name} {app.father_name}
                            </div>
                            <div className="text-[11px] text-neutral-600 dark:text-neutral-400 font-mono">
                              {app.application_number} • {app.city}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border ${
                          app.membership_type === 'STUDENT' ? 'bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] border-[#d4ff00]/30' :
                          app.membership_type === 'FULL' ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' :
                          'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}>
                          {app.membership_type}
                        </span>
                      </td>

                      <td className="p-4 text-neutral-600 dark:text-neutral-400 font-mono text-[11px]">
                        {new Date(app.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>

                      <td className="p-4 font-mono">
                        {app.payment ? (
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                              app.payment.status === 'VERIFIED' ? 'bg-[#d4ff00]' : 'bg-amber-400'
                            }`}></span>
                            <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                              {app.payment.amount} ETB ({app.payment.provider})
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-600 dark:text-neutral-500 dark:text-neutral-500">—</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                          app.status === 'APPROVED' ? 'bg-[#d4ff00]/15 text-green-700 dark:text-[#d4ff00] border-[#d4ff00]/40' :
                          app.status === 'REJECTED' ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30' :
                          app.status === 'CORRECTION_REQUIRED' ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' :
                          'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        }`}>
                          {app.status}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenReview(app)}
                            className="px-3.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
                          >
                            Review Dossier
                          </button>
                          
                          {app.status !== 'APPROVED' && (
                            <button
                              onClick={() => {
                                onApproveApplication(app.id);
                                onToast(lang === 'EN' ? `Approved ${app.first_name} and issued digital ID!` : 'ተፈቅዷል!', 'success');
                              }}
                              className="p-1.5 rounded-lg bg-[#d4ff00] hover:bg-[#c3eb00] text-black transition-colors cursor-pointer"
                              title="Quick Approve"
                            >
                              <Check className="w-4 h-4 text-black" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════ TAB: UNIVERSITIES ════════ */}
      {activeAdminTab === 'universities' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {universities.map(u => (
            <div key={u.id} className="bg-gray-50 dark:bg-[#121214] p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-black/5 dark:bg-white/5 text-green-700 dark:text-[#d4ff00] border border-[#d4ff00]/30 uppercase">
                  {u.type}
                </span>
                <span className="text-green-700 dark:text-[#d4ff00] text-xs font-mono font-bold">✓ MoE Accredited</span>
              </div>
              <h4 className="font-black text-base text-gray-900 dark:text-white font-syne uppercase mt-2">{u.name}</h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 font-mono">{u.city}, Ethiopia</p>
              
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-white/10 flex flex-wrap gap-1.5">
                {u.departments.map((d, idx) => (
                  <span key={idx} className="text-[10px] font-mono bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 px-2 py-0.5 rounded">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════════ TAB: MEMBERS ════════ */}
      {activeAdminTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={selectedMembers.length === members.length && members.length > 0}
                onChange={selectAllMembers} className="w-4 h-4 rounded cursor-pointer" />
              <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400">{selectedMembers.length} selected</span>
            </div>
            {selectedMembers.length > 0 && (
              <div className="flex items-center gap-2">
                <select value={bulkAction} onChange={e => setBulkAction(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121214] text-gray-900 dark:text-white cursor-pointer">
                  <option>Send Reminder</option>
                  <option>Mark for Review</option>
                  <option>Export CSV</option>
                </select>
                <button onClick={() => { setSelectedMembers([]); onToast(`${bulkAction} applied to ${selectedMembers.length} members!`, 'success'); }}
                  className="px-3 py-1.5 rounded-lg bg-[#d4ff00] text-black text-xs font-black cursor-pointer">
                  Apply
                </button>
              </div>
            )}
          </div>
          <div className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 dark:bg-black border-b border-gray-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 font-mono font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4 w-10"></th>
                  <th className="p-4">Member</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">CPD</th>
                  <th className="p-4">Expires</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {members.map(m => (
                  <tr key={m.id} className={`hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${selectedMembers.includes(m.id) ? 'bg-[#d4ff00]/5' : ''}`}>
                    <td className="p-4">
                      <input type="checkbox" checked={selectedMembers.includes(m.id)} onChange={() => toggleMemberSelect(m.id)} className="w-4 h-4 rounded cursor-pointer" />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={m.photo_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100'}
                          alt="" className="w-8 h-8 rounded-xl object-cover border border-gray-200 dark:border-white/10" />
                        <div>
                          <div className="font-black text-gray-900 dark:text-white">{m.first_name} {m.father_name}</div>
                          <div className="text-[10px] text-neutral-500 font-mono">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                        m.membership_type === 'STUDENT' ? 'bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00]' :
                        m.membership_type === 'FULL' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>{m.membership_type}</span>
                    </td>
                    <td className="p-4 font-mono text-gray-900 dark:text-white font-bold">{m.cpd_points}</td>
                    <td className="p-4 font-mono text-[11px] text-neutral-500">{new Date(m.expires_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-mono font-bold ${m.status === 'ACTIVE' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>{m.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════ TAB: CPD MANAGER ════════ */}
      {activeAdminTab === 'cpd' && (
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-6">
            <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-green-700 dark:text-[#d4ff00]" />{lang === 'EN' ? 'Create New CPD Course' : 'አዲስ CPD ኮርስ ፍጠር'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[{label:'Course Title', ph:'e.g. Trauma-Informed CBT Workshop'},{label:'Instructor Name', ph:'Dr. Firstname Lastname'}].map((f,i) => (
                <div key={i}>
                  <label className="block text-[10px] font-mono font-bold text-neutral-600 dark:text-neutral-400 uppercase mb-1">{f.label}</label>
                  <input type="text" placeholder={f.ph} className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#080808] text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d4ff00]" />
                </div>
              ))}
              {[{label:'CPD Points', ph:'e.g. 6'},{label:'Date', ph:'YYYY-MM-DD'},{label:'Duration', ph:'e.g. 3 hours'},{label:'Mode', ph:'Online / In-Person'}].map((f,i) => (
                <div key={i}>
                  <label className="block text-[10px] font-mono font-bold text-neutral-600 dark:text-neutral-400 uppercase mb-1">{f.label}</label>
                  <input type="text" placeholder={f.ph} className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#080808] text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d4ff00]" />
                </div>
              ))}
            </div>
            <button onClick={() => onToast(lang === 'EN' ? 'CPD Course created and published!' : 'CPD ኮርስ ተፈጥሯል!', 'success')}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#d4ff00] text-black text-xs font-black uppercase cursor-pointer active:scale-95">
              <Plus className="w-4 h-4" />{lang === 'EN' ? 'Create & Publish Course' : 'ኮርስ ፍጠርና አሳትም'}
            </button>
          </div>
          <div className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-4">
            <h4 className="text-xs font-black uppercase text-neutral-600 dark:text-neutral-400 mb-3">{lang === 'EN' ? 'Existing Courses' : 'ያሉ ኮርሶች'}</h4>
            <p className="text-xs text-neutral-500 italic">{lang === 'EN' ? 'CPD courses from mock data will appear here.' : 'ኮርሶች ዝርዝር ይታያሉ።'}</p>
          </div>
        </div>
      )}

      {/* ════════ TAB: ELECTIONS ════════ */}
      {activeAdminTab === 'elections' && (
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white flex items-center gap-2">
                <Vote className="w-4 h-4 text-green-700 dark:text-[#d4ff00]" />{lang === 'EN' ? 'Election Control' : 'ምርጫ ቁጥጥር'}
              </h3>
              <button onClick={() => { setElectionOpen(!electionOpen); onToast(electionOpen ? 'Election closed.' : 'Election is now LIVE!', electionOpen ? 'info' : 'success'); }}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase cursor-pointer transition-all ${
                  electionOpen ? 'bg-red-500 text-white' : 'bg-[#d4ff00] text-black'
                }`}>
                {electionOpen ? (lang === 'EN' ? 'Close Election' : 'ምርጫ ዝጋ') : (lang === 'EN' ? 'Open Election' : 'ምርጫ ክፈት')}
              </button>
            </div>
            <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 ${electionOpen ? 'bg-green-500/10 border border-green-500/20' : 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10'}`}>
              <div className={`w-2 h-2 rounded-full ${electionOpen ? 'bg-green-500 animate-pulse' : 'bg-neutral-400'}`} />
              <span className={`text-xs font-mono font-bold ${electionOpen ? 'text-green-600 dark:text-green-400' : 'text-neutral-500'}`}>
                {electionOpen ? 'ELECTION LIVE — Accepting votes' : 'Election is closed'}
              </span>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-6 space-y-4">
            <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-700 dark:text-[#d4ff00]" />{lang === 'EN' ? 'Real-time Tally' : 'ቅጽበታዊ ድምጽ ቆጠራ'}
            </h3>
            <p className="text-xs text-neutral-500 font-mono">{lang === 'EN' ? 'Presidential Candidates — Total votes:' : 'ጠቅላላ ድምጾች:'} {totalVotes}</p>
            {[
              { name: 'Dr. Yonas Alemu', votes: electionVotes.yonas, color: '#3b82f6' },
              { name: 'Dr. Selamawit Bekele', votes: electionVotes.selamawit, color: '#d4ff00' },
              { name: 'Dr. Dawit Mekonnen', votes: electionVotes.dawit, color: '#f59e0b' },
            ].map((c, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-gray-900 dark:text-white">{c.name}</span>
                  <span className="font-mono font-bold" style={{ color: c.color }}>{c.votes} votes ({Math.round((c.votes / totalVotes) * 100)}%)</span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(c.votes / totalVotes) * 100}%`, background: c.color }} />
                </div>
              </div>
            ))}
            {electionOpen && (
              <button onClick={() => setElectionVotes(v => ({ ...v, yonas: v.yonas + Math.floor(Math.random()*3), selamawit: v.selamawit + Math.floor(Math.random()*3), dawit: v.dawit + Math.floor(Math.random()*2) }))}
                className="text-xs font-mono text-neutral-500 underline cursor-pointer">
                [Simulate incoming vote]
              </button>
            )}
          </div>
        </div>
      )}

      {/* ════════ TAB: ANNOUNCEMENTS & DRAFTS ════════ */}
      {activeAdminTab === 'announcements' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base text-gray-900 dark:text-white font-syne uppercase flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-700 dark:text-[#d4ff00]" />
              {lang === 'EN' ? 'Published Announcements & Drafts' : 'ማስታወቂያዎች እና ረቂቆች'}
            </h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={async () => {
                  try {
                    onToast('Running database migration...', 'info');
                    const res = await fetch('/api/migrate');
                    const data = await res.json();
                    if (data.success) {
                      onToast(data.message, 'success');
                    } else {
                      onToast(`Migration failed: ${data.error}`, 'error');
                    }
                  } catch (e: any) {
                    onToast('Error running migration', 'error');
                  }
                }}
                className="px-4 py-2 bg-red-600/20 text-red-600 dark:text-red-400 font-bold text-xs rounded-lg hover:bg-red-600/30 transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Fix Database Schema
              </button>
              <button
                onClick={() => setShowAnnModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#d4ff00] hover:bg-[#c3eb00] text-black text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {lang === 'EN' ? 'New' : 'አዲስ'}
              </button>
            </div>
          </div>

          {announcements.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-[#121214] border border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
              <p className="text-sm font-bold text-neutral-500">No announcements yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map(ann => {
                const votes = draftVotes[ann.id] || { approve: 0, adjust: 0, userVote: null };
                const totalDraftVotes = votes.approve + votes.adjust;
                return (
                  <div key={ann.id} className="bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
                    {/* Cover image */}
                    {(ann.cover_image_url || ann.cover_photo_url) && (
                      <img src={ann.cover_image_url || ann.cover_photo_url} alt={ann.title}
                        className="w-full h-40 object-cover"
                        onError={e => (e.currentTarget.style.display = 'none')} />
                    )}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-mono font-bold uppercase text-green-700 dark:text-[#d4ff00] bg-[#d4ff00]/10 px-2 py-0.5 rounded-full border border-[#d4ff00]/30">{ann.category}</span>
                          <h4 className="font-black text-gray-900 dark:text-white font-syne mt-2 mb-1">{ann.title}</h4>
                          <p className="text-xs text-neutral-500 line-clamp-2">{ann.content}</p>
                          <p className="text-[10px] font-mono text-neutral-400 mt-1">{ann.author} · {new Date(ann.published_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono text-neutral-400 block">{ann.views_count} views</span>
                          <span className="text-[10px] font-mono text-green-700 dark:text-[#d4ff00] block">{ann.likes_count} likes</span>
                        </div>
                      </div>

                      {/* Draft Voting Section */}
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">Member Vote on this draft</p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleDraftVote(ann.id, 'approve')}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase cursor-pointer transition-all ${
                              votes.userVote === 'approve'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-green-500/10 text-gray-900 dark:text-white'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve ({votes.approve})
                          </button>
                          <button
                            onClick={() => toggleDraftVote(ann.id, 'adjust')}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase cursor-pointer transition-all ${
                              votes.userVote === 'adjust'
                                ? 'bg-amber-500 text-white'
                                : 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-amber-500/10 text-gray-900 dark:text-white'
                            }`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Needs Adjustment ({votes.adjust})
                          </button>
                          {totalDraftVotes > 0 && (
                            <span className="text-[10px] font-mono text-neutral-400 ml-auto">
                              {Math.round((votes.approve / totalDraftVotes) * 100)}% approval
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════ TAB: AUDIT LOGS ════════ */}
      {activeAdminTab === 'audit' && (
        <div className="bg-gray-50 dark:bg-[#121214] rounded-3xl border border-gray-200 dark:border-white/10 shadow-md p-6 space-y-4">
          <h3 className="font-black text-base text-gray-900 dark:text-white font-syne uppercase flex items-center gap-2">
            <History className="w-4 h-4 text-green-700 dark:text-[#d4ff00]" />
            <span>Immutable Council Audit Trail</span>
          </h3>
          <div className="divide-y divide-gray-100 dark:divide-white/10 font-mono">
            {auditLogs.map(log => (
              <div key={log.id} className="py-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-gray-900 dark:text-white">{log.action}</span>
                  <div className="text-[11px] text-neutral-500 mt-0.5">Entity: {log.entity_id} • Admin: {log.admin_username}</div>
                </div>
                <div className="text-[11px] text-neutral-500">{new Date(log.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════ APPLICATION REVIEW MODAL ════════ */}
      {reviewingApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="relative bg-white dark:bg-[#121214] rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-white/20 overflow-hidden flex flex-col max-h-[90vh] text-gray-900 dark:text-white">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-gray-50 dark:bg-black">
              <div>
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-green-700 dark:text-[#d4ff00]">
                  Dossier Inspection
                </span>
                <h3 className="text-base font-black text-gray-900 dark:text-white font-syne uppercase">
                  {reviewingApp.first_name} {reviewingApp.father_name} ({reviewingApp.application_number})
                </h3>
              </div>
              <button
                onClick={() => setReviewingApp(null)}
                className="p-1.5 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-gray-900 dark:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-900 dark:text-white">
              {/* Applicant Header summary */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-black/60 rounded-2xl border border-gray-200 dark:border-white/10">
                <img
                  src={reviewingApp.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover border border-[#d4ff00] shadow-xs"
                />
                <div className="flex-1">
                  <div className="font-black text-base text-gray-900 dark:text-white font-syne uppercase">
                    {reviewingApp.first_name} {reviewingApp.father_name} {reviewingApp.grandfather_name || ''}
                  </div>
                  {reviewingApp.amharic_full_name && (
                    <div className="text-sm font-bold text-gray-900 dark:text-white/80 mt-0.5">
                      {reviewingApp.amharic_full_name}
                    </div>
                  )}
                  <div className="text-neutral-600 dark:text-neutral-400 font-mono text-[11px] mt-1">
                    {reviewingApp.email} • {reviewingApp.phone}
                  </div>
                  {reviewingApp.telegram_id && (
                    <div className="text-neutral-500 dark:text-neutral-400 font-mono text-[11px] mt-0.5 flex items-center gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Telegram ID:</span>
                      <span className="text-blue-500 font-bold">{reviewingApp.telegram_id}</span>
                    </div>
                  )}
                  {!reviewingApp.telegram_id && (
                    <div className="text-orange-500 dark:text-orange-400 font-mono text-[10px] mt-0.5 font-bold">
                      ⚠ No Telegram ID captured — user may use phone/password login
                    </div>
                  )}
                  <div className="mt-1 flex items-center gap-2 font-mono">
                    <span className="px-2.5 py-0.5 rounded bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] border border-[#d4ff00]/30 font-bold text-[10px]">
                      {reviewingApp.membership_type}
                    </span>
                    <span className="text-neutral-600">•</span>
                    <span className="text-neutral-600 dark:text-neutral-400">City: {reviewingApp.city}</span>
                  </div>
                </div>
              </div>

              {/* Detailed Personal & Professional Info */}
              {reviewingApp.membership_type !== 'CORPORATE' && (
                <div>
                  <h4 className="font-mono font-bold text-xs text-green-700 dark:text-[#d4ff00] uppercase tracking-wider mb-2">
                    Personal & Professional Details
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-gray-50 dark:bg-black/60 rounded-xl border border-gray-200 dark:border-white/10">
                      <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Gender</div>
                      <div className="font-mono text-gray-900 dark:text-white mt-1">{reviewingApp.gender === 'M' ? 'Male' : reviewingApp.gender === 'F' ? 'Female' : 'N/A'}</div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-black/60 rounded-xl border border-gray-200 dark:border-white/10">
                      <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Date of Birth</div>
                      <div className="font-mono text-gray-900 dark:text-white mt-1">{reviewingApp.date_of_birth || 'N/A'}</div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-black/60 rounded-xl border border-gray-200 dark:border-white/10">
                      <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">National ID</div>
                      <div className="font-mono text-gray-900 dark:text-white mt-1">{reviewingApp.national_id_number || 'N/A'}</div>
                    </div>
                    {reviewingApp.membership_type === 'FULL' && (
                      <>
                        <div className="p-3 bg-gray-50 dark:bg-black/60 rounded-xl border border-gray-200 dark:border-white/10">
                          <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Current Workplace</div>
                          <div className="font-mono text-gray-900 dark:text-white mt-1 truncate" title={reviewingApp.current_workplace || ''}>{reviewingApp.current_workplace || 'N/A'}</div>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-black/60 rounded-xl border border-gray-200 dark:border-white/10">
                          <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Specialty</div>
                          <div className="font-mono text-gray-900 dark:text-white mt-1 truncate" title={reviewingApp.current_specialty || ''}>{reviewingApp.current_specialty || 'N/A'}</div>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-black/60 rounded-xl border border-gray-200 dark:border-white/10">
                          <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Experience</div>
                          <div className="font-mono text-gray-900 dark:text-white mt-1">{reviewingApp.years_of_experience ? `${reviewingApp.years_of_experience} years` : 'N/A'}</div>
                        </div>
                        {reviewingApp.license_number && (
                          <div className="col-span-2 sm:col-span-3 p-3 bg-gray-50 dark:bg-black/60 rounded-xl border border-gray-200 dark:border-white/10">
                            <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Existing License Number</div>
                            <div className="font-mono text-gray-900 dark:text-white mt-1">{reviewingApp.license_number}</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Education / Qualifications breakdown */}
              {(reviewingApp.student_profile || (reviewingApp.qualifications && reviewingApp.qualifications.length > 0) || reviewingApp.corporate_profile) && (
                <div>
                  <h4 className="font-mono font-bold text-xs text-green-700 dark:text-[#d4ff00] uppercase tracking-wider mb-2">
                    {reviewingApp.membership_type === 'CORPORATE' ? 'Corporate Profile' : 'Academic Record & Specialization'}
                  </h4>
                  {reviewingApp.membership_type === 'CORPORATE' && reviewingApp.corporate_profile ? (
                    <div className="p-4 bg-gray-50 dark:bg-black/60 rounded-xl border border-gray-200 dark:border-white/10">
                      <div className="font-black text-gray-900 dark:text-white uppercase font-syne">{reviewingApp.corporate_profile.organization_name}</div>
                      <div className="text-neutral-700 dark:text-neutral-300 mt-0.5">Type: {reviewingApp.corporate_profile.org_type}</div>
                      <div className="text-neutral-600 dark:text-neutral-500 font-mono text-[10px] mt-1">TIN: {reviewingApp.corporate_profile.tin_number} | HQ: {reviewingApp.corporate_profile.headquarters_city}</div>
                      {reviewingApp.corporate_profile.website && (
                        <div className="text-blue-500 text-[10px] mt-1 break-all">{reviewingApp.corporate_profile.website}</div>
                      )}
                    </div>
                  ) : reviewingApp.student_profile ? (
                    <div className="p-4 bg-gray-50 dark:bg-black/60 rounded-xl border border-gray-200 dark:border-white/10">
                      <div className="font-black text-gray-900 dark:text-white uppercase font-syne">{reviewingApp.student_profile.university_name}</div>
                      <div className="text-neutral-700 dark:text-neutral-300 mt-0.5">{reviewingApp.student_profile.field_of_study} (Year {reviewingApp.student_profile.academic_year})</div>
                      <div className="text-neutral-600 dark:text-neutral-500 font-mono text-[10px] mt-1">Student ID: {reviewingApp.student_profile.student_id_number}</div>
                    </div>
                  ) : reviewingApp.qualifications && reviewingApp.qualifications.length > 0 ? (
                    <div className="space-y-2">
                      {reviewingApp.qualifications.map((q: any, idx: number) => (
                        <div key={idx} className="p-4 bg-gray-50 dark:bg-black/60 rounded-xl border border-gray-200 dark:border-white/10 flex justify-between">
                          <div>
                            <div className="font-black text-gray-900 dark:text-white uppercase font-syne">{q.degree_level} in {q.field}</div>
                            <div className="text-neutral-600 dark:text-neutral-400 text-[11px]">{q.institution}</div>
                          </div>
                          <span className="font-mono text-green-700 dark:text-[#d4ff00] text-[11px]">Class of {q.graduation_year}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Uploaded Documents */}
              {(reviewingApp.degree_certificate_url || reviewingApp.id_document_url) && (
                <div>
                  <h4 className="font-mono font-bold text-xs text-green-700 dark:text-[#d4ff00] uppercase tracking-wider mb-2">
                    Attached Documents
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {reviewingApp.degree_certificate_url && (
                      <div className="p-3 bg-gray-50 dark:bg-black/60 rounded-xl border border-gray-200 dark:border-white/10">
                        <div className="font-bold text-gray-900 dark:text-white mb-2">Degree Certificate</div>
                        {reviewingApp.degree_certificate_url.startsWith('data:image') || reviewingApp.degree_certificate_url.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                          <img src={reviewingApp.degree_certificate_url} alt="Degree" className="w-full max-h-40 object-contain rounded bg-black/5" />
                        ) : (
                          <a href={reviewingApp.degree_certificate_url} target="_blank" rel="noreferrer" className="text-blue-500 underline break-all">View Document</a>
                        )}
                      </div>
                    )}
                    {reviewingApp.id_document_url && (
                      <div className="p-3 bg-gray-50 dark:bg-black/60 rounded-xl border border-gray-200 dark:border-white/10">
                        <div className="font-bold text-gray-900 dark:text-white mb-2">ID Document</div>
                        {reviewingApp.id_document_url.startsWith('data:image') || reviewingApp.id_document_url.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                          <img src={reviewingApp.id_document_url} alt="ID" className="w-full max-h-40 object-contain rounded bg-black/5" />
                        ) : (
                          <a href={reviewingApp.id_document_url} target="_blank" rel="noreferrer" className="text-blue-500 underline break-all">View Document</a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Receipt Verification */}
              {reviewingApp.payment && (
                <div>
                  <h4 className="font-mono font-bold text-xs text-green-700 dark:text-[#d4ff00] uppercase tracking-wider mb-2">
                    Payment Verification Slip
                  </h4>
                  <div className="p-4 bg-[#d4ff00]/10 rounded-xl border border-[#d4ff00]/30 flex items-center justify-between">
                    <div>
                      <div className="font-black text-gray-900 dark:text-white font-syne">
                        {reviewingApp.payment.amount} ETB via {reviewingApp.payment.provider}
                      </div>
                      <div className="font-mono text-[11px] text-neutral-700 dark:text-neutral-300 mt-0.5">
                        Ref: {reviewingApp.payment.transaction_number}
                      </div>
                    </div>
                    {reviewingApp.payment.status === 'VERIFIED' ? (
                      <span className="px-3 py-1 rounded-lg bg-[#d4ff00] text-black font-mono font-black text-[10px] uppercase">
                        ✓ Payment Verified
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          onVerifyPayment(reviewingApp.id);
                          setReviewingApp({
                            ...reviewingApp,
                            payment: { ...reviewingApp.payment!, status: 'VERIFIED' }
                          });
                          onToast('Payment verified successfully!', 'success');
                        }}
                        className="px-4 py-2 rounded-lg bg-[#d4ff00] hover:bg-[#c3eb00] text-black font-mono font-black uppercase text-[10px] cursor-pointer"
                      >
                        Verify Payment Now
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Council Notes */}
              <div>
                <label className="block font-mono font-bold text-xs text-neutral-700 dark:text-neutral-300 mb-1">
                  Accreditation Board Notes (Visible to Applicant)
                </label>
                <textarea
                  rows={2}
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  placeholder="Add feedback or specific instructions for corrections..."
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#d4ff00] bg-white dark:bg-black text-gray-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                />
              </div>

              {/* If rejecting form */}
              {isRejecting && (
                <div className="p-4 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-500/40">
                  <label className="block font-mono font-bold text-xs text-red-600 dark:text-red-400 mb-1">
                    Formal Rejection Reason *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ineligible degree program from unaccredited institution..."
                    value={rejectReasonInput}
                    onChange={(e) => setRejectReasonInput(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-red-200 dark:border-red-500/40 text-xs bg-white dark:bg-black text-gray-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black flex items-center justify-between">
              <button
                onClick={() => {
                  onRequestCorrection(reviewingApp.id, adminNoteInput);
                  setReviewingApp(null);
                  onToast('Correction request sent to applicant', 'info');
                }}
                className="px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-white/20 hover:bg-black/10 dark:bg-white/10 text-gray-900 dark:text-white text-xs font-mono font-bold uppercase cursor-pointer"
              >
                Request Correction
              </button>

              <div className="flex items-center gap-2">
                {!isRejecting ? (
                  <button
                    onClick={() => setIsRejecting(true)}
                    className="px-4 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-500/10 text-xs font-mono font-bold uppercase cursor-pointer"
                  >
                    Reject
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (!rejectReasonInput) {
                        onToast('Please enter a rejection reason', 'error');
                        return;
                      }
                      onRejectApplication(reviewingApp.id, rejectReasonInput);
                      setReviewingApp(null);
                      onToast('Application rejected', 'info');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-gray-900 dark:text-white text-xs font-mono font-black uppercase cursor-pointer"
                  >
                    Confirm Rejection
                  </button>
                )}

                <button
                  onClick={() => {
                    onApproveApplication(reviewingApp.id);
                    setReviewingApp(null);
                    onToast(`Approved ${reviewingApp.first_name} and generated Digital ID!`, 'success');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#d4ff00] hover:bg-[#c3eb00] text-black text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Issue ID</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════ NEW ANNOUNCEMENT MODAL ════════ */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-gray-50 dark:bg-[#121214] rounded-3xl w-full max-w-lg shadow-2xl border border-white/20 p-6 space-y-4 text-gray-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10">
              <h3 className="text-base font-black text-gray-900 dark:text-white font-syne uppercase">
                {lang === 'EN' ? 'Publish Association Announcement' : 'አዲስ ማስታወቂያ ያውጡ'}
              </h3>
              <button onClick={() => setShowAnnModal(false)} className="text-neutral-600 dark:text-neutral-400 hover:text-gray-900 dark:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 mb-1">Announcement Title (English) *</label>
              <input type="text" required placeholder="e.g. Call for Papers 2026..."
                value={newAnn.title} onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#d4ff00] bg-white dark:bg-black text-gray-900 dark:text-white placeholder:text-neutral-400" />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 mb-1">Amharic Title (Optional)</label>
              <input type="text" placeholder="ለምሳሌ፡ የጥናት ጥሪ 2026..."
                value={newAnn.amharic_title} onChange={(e) => setNewAnn({ ...newAnn, amharic_title: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#d4ff00] bg-white dark:bg-black text-gray-900 dark:text-white placeholder:text-neutral-400" />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 mb-1">Cover Photo (Optional)</label>
              <div 
                className="border-2 border-dashed border-gray-300 dark:border-white/20 bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer" 
                onClick={() => !isUploadingCover && annCoverInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  accept="image/*"
                  ref={annCoverInputRef}
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setIsUploadingCover(true);
                      try {
                        const url = await uploadFile(file);
                        setNewAnn({ ...newAnn, cover_photo_url: url });
                      } catch (err) {
                        onToast('Failed to upload cover photo', 'error');
                      } finally {
                        setIsUploadingCover(false);
                      }
                    }
                  }} 
                />
                <UploadCloud className={`w-6 h-6 ${isUploadingCover ? 'animate-bounce text-green-700 dark:text-[#d4ff00]' : 'text-neutral-400'} mb-2`} />
                <span className="text-xs text-gray-900 dark:text-white font-bold">
                  {isUploadingCover ? 'Uploading Cover...' : 'Click to upload Cover Photo'}
                </span>
              </div>
              {newAnn.cover_photo_url && (
                <div className="relative mt-2">
                  <img src={newAnn.cover_photo_url} alt="cover preview" className="w-full h-32 object-cover rounded-xl" onError={e => (e.currentTarget.style.display = 'none')} />
                  <button 
                    onClick={() => setNewAnn({ ...newAnn, cover_photo_url: undefined })}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/80 rounded-lg text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 mb-1">Category</label>
              <select value={newAnn.category} onChange={(e) => setNewAnn({ ...newAnn, category: e.target.value as any })}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 text-xs bg-white dark:bg-black text-gray-900 dark:text-white font-mono">
                <option value="General">General Announcement</option>
                <option value="Event">Event / Symposium</option>
                <option value="Research">Research & Journal</option>
                <option value="Policy">Policy & Ethics</option>
                <option value="Training">CPD Workshop</option>
                <option value="Election">Council Election</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 mb-1">Content Body *</label>
              <textarea rows={4} required placeholder="Detailed announcement text..."
                value={newAnn.content} onChange={(e) => setNewAnn({ ...newAnn, content: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#d4ff00] bg-white dark:bg-black text-gray-900 dark:text-white placeholder:text-neutral-400" />
            </div>

            {/* File Attachment */}
              <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 mb-1">Attach File (PDF / DOCX) — Optional</label>
              <div 
                className="border-2 border-dashed border-gray-300 dark:border-white/20 bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer" 
                onClick={() => !isUploadingFile && annFileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={annFileInputRef}
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setIsUploadingFile(true);
                      try {
                        const url = await uploadFile(file);
                        setNewAnn({ ...newAnn, file_attachment_url: url });
                      } catch (err) {
                        onToast('Failed to upload file', 'error');
                      } finally {
                        setIsUploadingFile(false);
                      }
                    }
                  }} 
                />
                <UploadCloud className={`w-6 h-6 ${isUploadingFile ? 'animate-bounce text-green-700 dark:text-[#d4ff00]' : 'text-neutral-400'} mb-2`} />
                <span className="text-xs text-gray-900 dark:text-white font-bold">
                  {isUploadingFile ? 'Uploading File...' : (newAnn.file_attachment_url ? 'File Attached (Click to replace)' : 'Click to attach Document')}
                </span>
                {newAnn.file_attachment_url && !isUploadingFile && (
                  <span className="text-xs text-green-700 dark:text-[#d4ff00] mt-1 break-all px-4">{newAnn.file_attachment_url.split('/').pop() || 'Attachment'}</span>
                )}
              </div>

            {/* Target Audience */}
            <div>
              <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 mb-2">Target Audience</label>
              <div className="flex gap-2 flex-wrap">
                {(['Students', 'Full Members', 'Corporate Members', 'All Members'] as string[]).map(aud => (
                  <button key={aud}
                    onClick={() => setNewAnn(p => ({
                      ...p,
                      target_audience: p.target_audience.includes(aud)
                        ? p.target_audience.filter(a => a !== aud)
                        : [...p.target_audience, aud]
                    }))}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border cursor-pointer transition-all ${
                      newAnn.target_audience.includes(aud)
                        ? 'bg-[#d4ff00] text-black border-[#d4ff00]'
                        : 'bg-white dark:bg-black border-gray-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >{aud}</button>
                ))}
              </div>
            </div>

            {/* Draft/Vote Toggle */}
            <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
              <input
                type="checkbox"
                id="draft-toggle"
                checked={newAnn.is_draft}
                onChange={e => setNewAnn(p => ({ ...p, is_draft: e.target.checked }))}
                className="w-4 h-4 accent-[#d4ff00]"
              />
              <label htmlFor="draft-toggle" className="text-xs font-bold cursor-pointer text-amber-700 dark:text-amber-400">
                Publish as a Draft — Allow members to vote (Approve / Needs Adjustment) before finalizing
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-white/10">
              <button
                onClick={() => setShowAnnModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishAnnouncement}
                className="px-5 py-2.5 rounded-xl bg-[#d4ff00] hover:bg-[#c3eb00] text-black text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-4 h-4 text-black" />
                <span>{newAnn.is_draft ? 'Publish as Draft for Voting' : 'Publish Announcement'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
