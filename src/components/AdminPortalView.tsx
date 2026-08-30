import React, { useState } from 'react';
import { 
  Users, Clock, CreditCard, CheckCircle2, XCircle, AlertTriangle,
  Search, FileText, Plus, Building, ShieldCheck, Send, Eye, Check,
  X, ExternalLink, History, GraduationCap, Vote, BookOpen, BarChart2,
  Award, ChevronDown, Trash2, Image, TrendingUp, UploadCloud, Settings, Mail, Phone, ClipboardCheck
} from 'lucide-react';
import { uploadFile } from '../lib/api';
import { Application, Member, University, Announcement, AuditLog, ApplicationStatus, ResearchSubmission } from '../types';

interface AdminPortalViewProps {
  lang: 'EN' | 'AM';
  applications: Application[];
  members: Member[];
  universities: University[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
  researchSubmissions: ResearchSubmission[];
  onApproveApplication: (appId: string) => void;
  onRejectApplication: (appId: string, reason: string) => void;
  onRequestCorrection: (appId: string, notes: string) => void;
  onVerifyPayment: (appId: string) => void;
  onAddAnnouncement: (ann: Partial<Announcement>) => void;
  onDeleteMember?: (memberId: string) => void;
  onDeleteAnnouncement?: (annId: string) => void;
  onAddUniversity: (uni: Partial<University>) => void;
  onUpdateResearchSubmission: (id: string, status: ResearchSubmission['status'], reviewNotes?: string) => Promise<void>;
  onMembersImported: () => Promise<void>;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  lang,
  applications,
  members,
  universities,
  announcements,
  auditLogs,
  researchSubmissions,
  onApproveApplication,
  onRejectApplication,
  onRequestCorrection,
  onVerifyPayment,
  onAddAnnouncement,
  onDeleteMember,
  onDeleteAnnouncement,
  onAddUniversity,
  onUpdateResearchSubmission,
  onMembersImported,
  onToast,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'applications' | 'members' | 'cpd' | 'elections' | 'universities' | 'audit' | 'announcements' | 'research'>('applications');
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
  const [selectedResearch, setSelectedResearch] = useState<ResearchSubmission | null>(null);
  const [researchNotes, setResearchNotes] = useState('');
  const [isSavingResearch, setIsSavingResearch] = useState(false);
  const csvImportRef = React.useRef<HTMLInputElement>(null);
  const [isImportingMembers, setIsImportingMembers] = useState(false);
  const [memberImportResult, setMemberImportResult] = useState<{ created: number; errors: string[] } | null>(null);

  const openDatabaseSetup = () => {
    alert('Database setup is completed in Supabase, not from the public website. In Supabase SQL Editor, apply supabase/migrations/20260830_member_community.sql from this project. This keeps migrations protected from public access.');
  };

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

  const handleOpenResearch = (submission: ResearchSubmission) => {
    setSelectedResearch(submission);
    setResearchNotes(submission.review_notes || '');
  };

  const saveResearchReview = async (status: ResearchSubmission['status']) => {
    if (!selectedResearch) return;
    setIsSavingResearch(true);
    try {
      await onUpdateResearchSubmission(selectedResearch.id, status, researchNotes);
      setSelectedResearch(current => current ? { ...current, status, review_notes: researchNotes } : null);
      onToast(`Research marked ${status.replace('_', ' ').toLowerCase()}.`, 'success');
    } catch (error: any) {
      onToast(error.message || 'Could not save the research review.', 'error');
    } finally {
      setIsSavingResearch(false);
    }
  };

  const parseCsv = (content: string) => {
    const rows: string[][] = [];
    let field = '';
    let row: string[] = [];
    let inQuotes = false;
    for (let index = 0; index < content.length; index += 1) {
      const char = content[index];
      if (char === '"') {
        if (inQuotes && content[index + 1] === '"') { field += '"'; index += 1; }
        else inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) { row.push(field.trim()); field = ''; }
      else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && content[index + 1] === '\n') index += 1;
        row.push(field.trim());
        if (row.some(cell => cell)) rows.push(row);
        row = []; field = '';
      } else field += char;
    }
    row.push(field.trim());
    if (row.some(cell => cell)) rows.push(row);
    const [headers, ...values] = rows;
    return values.map(value => Object.fromEntries(headers.map((header, index) => [header.trim().toLowerCase(), value[index]?.trim() || ''])));
  };

  const downloadMemberCsvSample = () => {
    const sample = 'email,temporary_password,first_name,father_name,grandfather_name,phone,city,membership_type,membership_number,membership_start_date,membership_expiry_date,specialty,workplace,license_number,cpd_points\nmember@example.com,TempPass2026!,Alem,Tesfaye,Kebede,0911223344,Addis Ababa,FULL,EPA-1998-0042,2018-06-15,2027-06-14,Counseling Psychology,Addis Wellness Centre,EPA-LIC-0042,24\nstudent@example.com,TempPass2026!,Marta,Getachew,,0922334455,Hawassa,STUDENT,EPA-S-2024-0081,2024-09-01,2027-08-31,,, ,0';
    const url = URL.createObjectURL(new Blob([sample], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'epa-member-import-sample.csv'; anchor.click(); URL.revokeObjectURL(url);
  };

  const importMemberCsv = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) { onToast('Choose a CSV file.', 'error'); return; }
    setIsImportingMembers(true); setMemberImportResult(null);
    try {
      const content = await file.text();
      const rows = parseCsv(content);
      const resultResponse = await fetch('/api/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'bulk-import', rows }) });
      const result = await resultResponse.json();
      if (!resultResponse.ok || !result.success) throw new Error(result.error || 'Member import failed.');
      const errors = (result.errors || []).map((error: { row: number; error: string }) => `Row ${error.row}: ${error.error}`);
      setMemberImportResult({ created: result.created?.length || 0, errors });
      await onMembersImported();
      onToast(`${result.created?.length || 0} member accounts imported.`, errors.length ? 'info' : 'success');
    } catch (error: any) {
      onToast(error.message || 'Member import failed.', 'error');
    } finally {
      setIsImportingMembers(false);
      if (csvImportRef.current) csvImportRef.current.value = '';
    }
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
              onClick={openDatabaseSetup}
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
          { id: 'research', label: lang === 'EN' ? `Research Review (${researchSubmissions.filter(item => item.status === 'SUBMITTED' || item.status === 'UNDER_REVIEW').length})` : 'የምርምር ግምገማ' },
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
          <div className="rounded-2xl p-5 bg-gradient-to-br from-[#d4ff00]/10 to-transparent dark:from-[#d4ff00]/[0.08] border border-[#d4ff00]/25 flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1"><div className="flex items-center gap-2"><UploadCloud className="w-5 h-5 text-green-700 dark:text-[#d4ff00]" /><h3 className="font-black text-sm uppercase text-gray-900 dark:text-white">Import existing members</h3></div><p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">Create active member accounts without payment or re-registration. The membership start date in the CSV becomes the ID issue date—not the upload date. Imported members receive a temporary password and must set a new password and profile photo at first sign-in.</p></div>
            <div className="flex flex-wrap gap-2"><input ref={csvImportRef} type="file" accept=".csv,text/csv" className="hidden" onChange={event => importMemberCsv(event.target.files?.[0])} /><button onClick={downloadMemberCsvSample} className="px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs font-black uppercase text-gray-900 dark:text-white">Download CSV sample</button><button onClick={() => csvImportRef.current?.click()} disabled={isImportingMembers} className="px-3.5 py-2.5 rounded-xl bg-[#d4ff00] text-black text-xs font-black uppercase disabled:opacity-50">{isImportingMembers ? 'Importing…' : 'Upload member CSV'}</button></div>
          </div>
          {memberImportResult && <div className={`p-4 rounded-2xl border text-xs ${memberImportResult.errors.length ? 'bg-amber-500/10 border-amber-500/25 text-amber-800 dark:text-amber-300' : 'bg-green-500/10 border-green-500/25 text-green-800 dark:text-green-300'}`}><b>{memberImportResult.created} account(s) created.</b>{memberImportResult.errors.length > 0 && <details className="mt-2"><summary className="cursor-pointer font-bold">{memberImportResult.errors.length} row issue(s) — review details</summary><ul className="mt-2 space-y-1 list-disc pl-5">{memberImportResult.errors.map(error => <li key={error}>{error}</li>)}</ul></details>}</div>}
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
                  <th className="p-4">Actions</th>
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
                    <td className="p-4">
                      {onDeleteMember && (
                        <button onClick={() => { if(window.confirm('Delete member? This will force them to re-register.')) onDeleteMember(m.id); }}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 cursor-pointer" title="Delete Member">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
              <button onClick={openDatabaseSetup} className="px-4 py-2 bg-gray-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-300 font-bold text-xs rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center gap-2">
                Database setup guide
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
                        <div className="text-right shrink-0 flex flex-col items-end gap-2">
                          {onDeleteAnnouncement && (
                            <button onClick={() => { if(window.confirm('Delete announcement?')) onDeleteAnnouncement(ann.id); }}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 cursor-pointer" title="Delete Announcement">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                          <div>
                            <span className="text-[10px] font-mono text-neutral-400 block">{ann.views_count} views</span>
                            <span className="text-[10px] font-mono text-green-700 dark:text-[#d4ff00] block">{ann.likes_count} likes</span>
                          </div>
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

      {/* ════════ TAB: RESEARCH REVIEW DESK ════════ */}
      {activeAdminTab === 'research' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h3 className="font-black text-base text-gray-900 dark:text-white font-syne uppercase flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-green-700 dark:text-[#d4ff00]" />Research Review Desk</h3>
              <p className="mt-1 text-xs text-neutral-500">Review member uploads, reach the author directly, and keep a visible editorial decision trail.</p>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-[#d4ff00]/10 border border-[#d4ff00]/30 text-[10px] font-mono font-black uppercase text-green-700 dark:text-[#d4ff00]">{researchSubmissions.length} total submissions</span>
          </div>
          {researchSubmissions.length === 0 ? <div className="p-12 rounded-3xl bg-gray-50 dark:bg-[#121214] border border-dashed border-gray-200 dark:border-white/10 text-center"><FileText className="w-9 h-9 mx-auto text-neutral-400 mb-3" /><p className="font-bold text-sm text-neutral-500">No research submissions yet.</p><p className="text-xs text-neutral-400 mt-1">Member uploads will appear here for council review.</p></div> :
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {researchSubmissions.map(submission => (
                <button key={submission.id} onClick={() => handleOpenResearch(submission)} className="text-left rounded-2xl bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-white/10 p-5 hover:border-[#d4ff00]/45 hover:-translate-y-0.5 transition-all">
                  <div className="flex items-start justify-between gap-3"><span className="px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5 text-[10px] font-mono font-black uppercase text-neutral-600 dark:text-neutral-300">{submission.publication_type}</span><span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-black uppercase border ${submission.status === 'ACCEPTED' ? 'bg-green-500/10 text-green-700 dark:text-[#d4ff00] border-green-500/20' : submission.status === 'DECLINED' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'}`}>{submission.status.replace('_', ' ')}</span></div>
                  <h4 className="mt-3 font-black text-sm text-gray-900 dark:text-white leading-snug">{submission.title}</h4>
                  <p className="mt-2 text-xs text-neutral-500 line-clamp-2 leading-relaxed">{submission.abstract}</p>
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-white/10 flex items-center justify-between text-[10px] font-mono text-neutral-500"><span>{submission.author_name} · {submission.author_membership_number}</span><span>{new Date(submission.submitted_at).toLocaleDateString()}</span></div>
                </button>
              ))}
            </div>}
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

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Application', value: reviewingApp.application_number },
                  { label: 'Submitted', value: new Date(reviewingApp.submitted_at).toLocaleDateString() },
                  { label: 'Email', value: reviewingApp.email || 'Not provided' },
                  { label: 'Phone', value: reviewingApp.phone || 'Not provided' },
                ].map(item => <div key={item.label} className="min-w-0 p-3 rounded-xl bg-gray-50 dark:bg-black/60 border border-gray-200 dark:border-white/10"><div className="text-[9px] font-mono font-bold uppercase text-neutral-500">{item.label}</div><div title={item.value} className="mt-1 text-[11px] font-mono font-bold text-gray-900 dark:text-white truncate">{item.value}</div></div>)}
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
                      <div className="font-black text-gray-900 dark:text-white uppercase font-syne">{reviewingApp.corporate_profile.organization_name || 'N/A'}</div>
                      <div className="text-neutral-700 dark:text-neutral-300 mt-0.5">Type: {reviewingApp.corporate_profile.org_type || 'N/A'}</div>
                      <div className="text-neutral-600 dark:text-neutral-500 font-mono text-[10px] mt-1">TIN: {reviewingApp.corporate_profile.tin_number || 'N/A'} | HQ: {reviewingApp.corporate_profile.headquarters_city || 'N/A'}</div>
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-600 dark:text-neutral-300"><span><b>Contact:</b> {reviewingApp.corporate_profile.contact_person || 'N/A'} · {reviewingApp.corporate_profile.contact_title || 'N/A'}</span><span><b>Direct:</b> {reviewingApp.corporate_profile.contact_phone || 'N/A'} · {reviewingApp.corporate_profile.contact_email || 'N/A'}</span><span><b>Staff:</b> {reviewingApp.corporate_profile.staff_count ?? 'N/A'}</span>{reviewingApp.corporate_profile.services_description && <span className="sm:col-span-2"><b>Services:</b> {reviewingApp.corporate_profile.services_description}</span>}</div>
                      {reviewingApp.corporate_profile.website && (
                        <div className="text-blue-500 text-[10px] mt-1 break-all">{reviewingApp.corporate_profile.website}</div>
                      )}
                    </div>
                  ) : reviewingApp.membership_type === 'STUDENT' && reviewingApp.student_profile ? (
                    <div className="p-4 bg-gray-50 dark:bg-black/60 rounded-xl border border-gray-200 dark:border-white/10 space-y-2">
                      <div className="font-black text-gray-900 dark:text-white uppercase font-syne">{reviewingApp.student_profile.university_name || 'N/A'}</div>
                      <div className="text-neutral-700 dark:text-neutral-300">
                        {reviewingApp.student_profile.field_of_study || 'N/A'}
                        {reviewingApp.student_profile.academic_year ? ` — Year ${reviewingApp.student_profile.academic_year}` : ''}
                        {reviewingApp.student_profile.expected_graduation_year ? ` (Graduating ${reviewingApp.student_profile.expected_graduation_year})` : ''}
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-500 font-mono text-[10px]">Student ID: {reviewingApp.student_profile.student_id_number || 'N/A'}</div>
                      {reviewingApp.student_profile.student_id_url && (
                        <a href={reviewingApp.student_profile.student_id_url} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-500 underline text-xs font-bold pt-1">
                          📎 View Student ID Card
                        </a>
                      )}
                    </div>
                  ) : reviewingApp.membership_type === 'FULL' && reviewingApp.qualifications && reviewingApp.qualifications.length > 0 ? (
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
                  ) : (
                    <div className="text-xs text-neutral-500 italic">No additional details provided.</div>
                  )}
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
                      {reviewingApp.payment.receipt_url && (
                        <div className="mt-2">
                          <a href={reviewingApp.payment.receipt_url} target="_blank" rel="noreferrer" className="text-blue-500 underline text-xs font-bold">
                            View Receipt Attachment
                          </a>
                        </div>
                      )}
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

      {/* ════════ RESEARCH REVIEW MODAL ════════ */}
      {selectedResearch && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-3xl rounded-3xl bg-gray-50 dark:bg-[#121214] border border-white/20 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 flex items-start justify-between border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0c]">
              <div><span className="text-[10px] font-mono font-black uppercase text-green-700 dark:text-[#d4ff00]">{selectedResearch.publication_type} · {selectedResearch.status.replace('_', ' ')}</span><h3 className="mt-1 text-lg font-black font-syne uppercase tracking-tight text-gray-900 dark:text-white">Research dossier</h3></div>
              <button onClick={() => setSelectedResearch(null)} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              <div className="rounded-2xl p-4 bg-[#d4ff00]/5 border border-[#d4ff00]/20"><h4 className="font-black text-base text-gray-900 dark:text-white">{selectedResearch.title}</h4><p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{selectedResearch.abstract}</p>{selectedResearch.keywords.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{selectedResearch.keywords.map(keyword => <span key={keyword} className="px-2 py-1 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[10px] font-mono text-neutral-600 dark:text-neutral-300">{keyword}</span>)}</div>}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl p-4 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10"><p className="text-[10px] font-mono uppercase text-neutral-500">Submitting member</p><p className="mt-1 font-black text-sm text-gray-900 dark:text-white">{selectedResearch.author_name}</p><p className="mt-1 text-[11px] font-mono text-neutral-500">{selectedResearch.author_membership_number}</p></div>
                <div className="rounded-2xl p-4 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10"><p className="text-[10px] font-mono uppercase text-neutral-500">Contact author</p><div className="mt-2 space-y-1.5 text-xs">{selectedResearch.author_email && <a href={`mailto:${selectedResearch.author_email}?subject=${encodeURIComponent(`EPA Research Review: ${selectedResearch.title}`)}`} className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"><Mail className="w-3.5 h-3.5" />{selectedResearch.author_email}</a>}{selectedResearch.author_phone && <a href={`tel:${selectedResearch.author_phone}`} className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300 hover:underline"><Phone className="w-3.5 h-3.5" />{selectedResearch.author_phone}</a>}</div></div>
              </div>
              <a href={selectedResearch.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 text-blue-700 dark:text-blue-300"><span className="flex min-w-0 items-center gap-3"><FileText className="w-5 h-5 shrink-0" /><span className="min-w-0"><span className="block text-xs font-black truncate">{selectedResearch.file_name}</span><span className="block mt-0.5 text-[10px] opacity-70">Open submitted publication</span></span></span><ExternalLink className="w-4 h-4 shrink-0" /></a>
              <div><label className="block text-[10px] font-mono font-black uppercase text-neutral-500 mb-2">Editorial note visible in the review record</label><textarea rows={4} value={researchNotes} onChange={event => setResearchNotes(event.target.value)} placeholder="Add review feedback or revision instructions…" className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d4ff00] resize-none" /></div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0c] flex flex-wrap justify-end gap-2"><button disabled={isSavingResearch} onClick={() => saveResearchReview('REVISION_REQUESTED')} className="px-3.5 py-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase disabled:opacity-50">Request revision</button><button disabled={isSavingResearch} onClick={() => saveResearchReview('DECLINED')} className="px-3.5 py-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-black uppercase disabled:opacity-50">Decline</button><button disabled={isSavingResearch} onClick={() => saveResearchReview('ACCEPTED')} className="px-4 py-2 rounded-xl bg-[#d4ff00] text-black text-[10px] font-black uppercase disabled:opacity-50">{isSavingResearch ? 'Saving…' : 'Accept submission'}</button></div>
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
