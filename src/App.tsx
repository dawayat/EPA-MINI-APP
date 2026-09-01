import React, { useState, useEffect, useRef } from 'react';
import { isSupabaseConfigured } from './lib/supabase';
import { 
  fetchMembers, fetchDirectoryMembers, fetchApplications, fetchApplicationDetail, fetchAnnouncements,
  fetchUniversities, fetchAuditLogs, fetchResearchSubmissions,
  submitApplication, updateApplicationStatus, publishAnnouncement, createMember, deleteMember, deleteAnnouncement, submitResearchSubmission, updateResearchSubmission
} from './lib/api';
import { 
  Member, 
  Application, 
  Announcement, 
  University, 
  CPDCourse, 
  ElectionCandidate, 
  Election,
  AuditLog, 
  MembershipTypeCode,
  ResearchSubmission
} from './types';

import { Navbar } from './components/Navbar';
import { WelcomeView } from './components/WelcomeView';
import { DigitalIdCard } from './components/DigitalIdCard';
import { MemberPortalView } from './components/MemberPortalView';
import { AdminPortalView } from './components/AdminPortalView';
import { PublicVerifyView } from './components/PublicVerifyView';
import { PsychologistDirectory } from './components/PsychologistDirectory';
import { ElectionsBooth } from './components/ElectionsBooth';
import RegistrationModal from './components/RegistrationModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { SplashScreen } from './components/SplashScreen';
import { BottomBar } from './components/BottomBar';
import { initTelegramApp, getTelegramColorScheme, getTelegramUser, isTelegramMiniApp } from './lib/telegram';
import { CheckCircle2, AlertCircle, Info, ShieldCheck, CreditCard } from 'lucide-react';
import { PhoneLoginModal } from './components/PhoneLoginModal';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export default function App() {
  // Splash screen
  const [showSplash, setShowSplash] = useState(true);

  // App Global State
  const [lang, setLang] = useState<'EN' | 'AM'>('EN');
  const [currentTab, setCurrentTab] = useState<string>('welcome');
  const [activeVerifyToken, setActiveVerifyToken] = useState<string>('epa_tok_9942a17b');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('verify');
    if (token) {
      setActiveVerifyToken(token);
      setCurrentTab('verify');
    }
  }, []);

  // Initialize Telegram Mini App
  useEffect(() => {
    initTelegramApp();
    // Sync theme with Telegram if inside Mini App
    if (isTelegramMiniApp()) {
      const tgScheme = getTelegramColorScheme();
      const html = document.documentElement;
      if (tgScheme === 'dark') {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    }
  }, []);

  // Core Data Stores
  const [members, setMembers] = useState<Member[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [cpdCourses, setCpdCourses] = useState<CPDCourse[]>([]);
  const [candidates, setCandidates] = useState<ElectionCandidate[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [researchSubmissions, setResearchSubmissions] = useState<ResearchSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [directoryLoaded, setDirectoryLoaded] = useState(false);
  const [adminLoaded, setAdminLoaded] = useState(false);
  const directoryLoadingRef = useRef(false);
  const adminLoadingRef = useRef(false);

  const loadDirectoryMembers = async () => {
    if (directoryLoaded || directoryLoadingRef.current) return;
    directoryLoadingRef.current = true;
    try {
      const directory = await fetchDirectoryMembers();
      setMembers(current => {
        const existing = new Map<string, Member>(current.map((member): [string, Member] => [member.id, member]));
        return directory.map((member: Member) => {
          const previous = existing.get(member.id);
          return previous ? Object.assign({}, member, previous) as Member : member;
        });
      });
      setDirectoryLoaded(true);
    } finally {
      directoryLoadingRef.current = false;
    }
  };

  const loadAdminData = async () => {
    if (adminLoaded || adminLoadingRef.current) return;
    adminLoadingRef.current = true;
    try {
      // Admin data can contain private records and document-bearing rows, so it
      // must never be part of every public app launch.
      const [fetchedMembers, fetchedApps, fetchedLogs, fetchedResearchSubmissions] = await Promise.all([
        fetchMembers(), fetchApplications(), fetchAuditLogs(), fetchResearchSubmissions()
      ]);
      setMembers(fetchedMembers);
      setApplications(fetchedApps);
      setAuditLogs(fetchedLogs);
      setResearchSubmissions(fetchedResearchSubmissions);
      setDirectoryLoaded(true);
      setAdminLoaded(true);
    } finally {
      adminLoadingRef.current = false;
    }
  };

  // Public startup data only. Private/admin datasets are loaded when their
  // screen is explicitly opened instead of for every visitor.
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        if (isSupabaseConfigured) {
          const [fetchedAnnouncements, fetchedUnivs] = await Promise.all([
            fetchAnnouncements(), fetchUniversities()
          ]);
          setAnnouncements(fetchedAnnouncements);
          setUniversities(fetchedUnivs);

          // Telegram Auto-Login: resolve the active account from the server so
          // approval and login use the same persisted member record.
          const tgUser = getTelegramUser();
          if (tgUser && tgUser.id) {
            try {
              const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'telegram-login', telegramId: tgUser.id })
              });
              const data = await response.json();
              if (data.success && data.member) {
                const telegramMember = data.member as Member;
                setMembers([telegramMember]);
                setActiveMemberId(telegramMember.id);
                setCurrentTab('portal');
              } else {
                setActiveMemberId(null);
              }
            } catch (error) {
              console.warn('[App] Telegram login could not be completed:', error);
              setActiveMemberId(null);
            }
          } else {
            setActiveMemberId(null);
          }
        } else {
          // If Supabase isn't configured, we leave the app empty!
          // No more mock data demo mode.
          setActiveMemberId(null);
        }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Load heavier datasets only after a user actually enters the relevant area.
  useEffect(() => {
    if (currentTab === 'directory' || (currentTab === 'portal' && activeMemberId)) {
      void loadDirectoryMembers();
    }
    if (currentTab === 'admin') void loadAdminData();
  }, [currentTab, activeMemberId]);

  // Modals and Drawers
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [selectedRegTier, setSelectedRegTier] = useState<MembershipTypeCode>('FULL');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isPhoneLoginOpen, setIsPhoneLoginOpen] = useState<boolean>(false);
  
  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  const activeMember = members.find(m => m.id === activeMemberId);

  // Handler: Phone login success - add member to state if not already there
  const handlePhoneLoginSuccess = (member: Member) => {
    setMembers(prev => {
      const exists = prev.find(m => m.id === member.id);
      if (exists) return prev.map(existing => existing.id === member.id ? { ...existing, ...member } : existing);
      return [member, ...prev];
    });
    setActiveMemberId(member.id);
    setCurrentTab('portal');
  };


  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    if (!message) return;
    const id = 'toast-' + Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Handler: Application submission from registration modal
  const handleApplicationSubmit = async (newApp: Partial<Application>) => {
    const tgUser = getTelegramUser();
    
    const fullApp: Application = {
      ...newApp,
      // Preserve id and application_number from modal if provided, else generate
      id: newApp.id || ('app-' + Date.now()),
      application_number: newApp.application_number || ('EPA-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000)),
      membership_type: (newApp.membership_type || 'STUDENT') as any,
      status: 'SUBMITTED',
      submitted_at: newApp.submitted_at || new Date().toISOString(),
      telegram_id: tgUser?.id?.toString() || newApp.telegram_id || undefined,
      first_name: newApp.first_name || '',
      father_name: newApp.father_name || ''
    };

    // Always try to save to Supabase (isSupabaseConfigured is now always true)
    const result = await submitApplication(fullApp);
    if (!result.success) {
      console.error('[App] Application submission failed:', result.error);
      showToast(`Submission error: ${result.error}`, 'error');
      throw new Error(result.error || 'Application submission failed.');
    } else {
      showToast('Application submitted and saved successfully!', 'success');
    }

    setApplications(prev => [fullApp, ...prev]);

    // Add audit log
    setAuditLogs(prev => [{
      id: 'log-' + Date.now(),
      action: `New Application Submitted (${fullApp.membership_type})`,
      entity_type: 'Application',
      entity_id: fullApp.application_number,
      admin_username: 'system_gateway',
      created_at: new Date().toISOString()
    }, ...prev]);
  };


  const loadApplicationDossier = async (applicationId: string): Promise<Application> => {
    const application = await fetchApplicationDetail(applicationId);
    if (!application) throw new Error('The application dossier could not be found.');
    setApplications(current => current.map(item => item.id === application.id ? { ...item, ...application } : item));
    return application;
  };

  // Handler: Admin approves application -> generates Member Record & Digital ID
  const handleApproveApplication = async (appId: string) => {
    if (!applications.some(application => application.id === appId)) return false;
    let app: Application;
    try {
      // The table deliberately omits large, embedded documents. Fetch the
      // complete record only for this explicit approval action.
      app = await loadApplicationDossier(appId);
    } catch (error: any) {
      showToast(error.message || 'The application dossier could not be loaded.', 'error');
      return false;
    }

    const newMembershipNum = `EPA-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newVerificationToken = `epa_tok_${Math.random().toString(36).substring(2, 10)}`;

    const newMember: Member = {
      id: 'mem-' + Date.now(),
      membership_number: newMembershipNum,
      verification_token: newVerificationToken,
      telegram_id: app.telegram_id,
      first_name: app.first_name,
      father_name: app.father_name,
      grandfather_name: app.grandfather_name,
      amharic_full_name: app.amharic_full_name,
      photo_url: app.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      email: app.email,
      phone: app.phone,
      city: app.city,
      gender: app.gender,
      date_of_birth: app.date_of_birth,
      membership_type: app.membership_type,
      status: 'ACTIVE',
      specialty: app.membership_type === 'STUDENT' ? undefined : (app.current_specialty || app.qualifications?.[0]?.field || 'Psychology'),
      workplace: app.membership_type === 'STUDENT' ? app.student_profile?.university_name : app.membership_type === 'CORPORATE' ? app.corporate_profile?.organization_name : (app.current_workplace || 'Psychology practice or institution'),
      bio: "Newly registered member of the Ethiopian Psychologists' Association.",
      cpd_points: 10,
      issued_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      is_verified: true,
      license_number: app.license_number || undefined,
      corporate_profile: app.corporate_profile,
      student_profile: app.student_profile,
      phone_password: (app as any).phone_password,
      email_verified: Boolean(app.email_verified)
    };

    // Persist first. A member must never appear approved locally if their
    // account cannot be found after a refresh or by the Telegram sign-in flow.
    try {
      const memberResult = await createMember(newMember);
      if (!memberResult.success) throw new Error(memberResult.error || 'Member account could not be created.');
      const approvalUpdate = await updateApplicationStatus(appId, 'APPROVED');

      setMembers(prev => [newMember, ...prev]);
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'APPROVED' } : a));
      setActiveMemberId(newMember.id);
      setCurrentTab('idcard');
      if (approvalUpdate.email?.delivered) {
        showToast('Application approved, member account created, and approval email sent.', 'success');
      } else {
        showToast(`Application approved and member account created. Approval email was not delivered: ${approvalUpdate.email?.error || 'email service is not configured in Vercel.'}`, 'error');
      }

      setAuditLogs(prev => [{
        id: 'log-' + Date.now(),
        action: `Approved Application & Issued ID: ${newMembershipNum}`,
        entity_type: 'Member',
        entity_id: newMember.membership_number,
        admin_username: 'superadmin_council',
        created_at: new Date().toISOString()
      }, ...prev]);
      return true;
    } catch (err: any) {
      console.error('[App] Approval failed before completion:', err);
      showToast(`Approval was not completed: ${err.message || 'Please try again.'}`, 'error');
      return false;
    }
  };

  const handleResendApprovalEmail = async (appId: string) => {
    try {
      const result = await updateApplicationStatus(appId, 'APPROVED');
      if (result.email?.delivered) {
        showToast('Approval email sent again.', 'success');
        return true;
      }
      showToast(`Approval email could not be delivered: ${result.email?.error || 'email service is not configured in Vercel.'}`, 'error');
      return false;
    } catch (err: any) {
      showToast(`Approval email could not be resent: ${err.message || 'Please try again.'}`, 'error');
      return false;
    }
  };


  const handleRejectApplication = async (appId: string, reason: string) => {
    if (isSupabaseConfigured) {
      await updateApplicationStatus(appId, 'REJECTED', reason);
    }
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'REJECTED', rejection_reason: reason } : a));
    setAuditLogs(prev => [{
      id: 'log-' + Date.now(),
      action: `Rejected Application (Reason: ${reason})`,
      entity_type: 'Application',
      entity_id: appId,
      admin_username: 'superadmin_council',
      created_at: new Date().toISOString()
    }, ...prev]);
  };

  const handleRequestCorrection = async (appId: string, notes: string) => {
    if (isSupabaseConfigured) await updateApplicationStatus(appId, 'CORRECTION_REQUIRED', notes);
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'CORRECTION_REQUIRED', admin_notes: notes } : a));
    showToast('Sent revision request to applicant', 'info');
  };

  const handleDeleteMember = async (memberId: string) => {
    // 1. Update local state
    const member = members.find(m => m.id === memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
    if (activeMemberId === memberId) {
      setActiveMemberId(null);
      setCurrentTab('welcome');
    }
    showToast('Member deleted successfully', 'success');

    // 2. Persist to DB
    if (isSupabaseConfigured) {
      try {
        const { success, error } = await deleteMember(memberId);
        if (!success) throw new Error(error);
      } catch (err: any) {
        console.error('Failed to delete member in DB:', err.message);
        showToast('DB Error: ' + err.message, 'error');
      }
    }
  };

  const handleDeleteAnnouncement = async (annId: string) => {
    // 1. Update local state
    setAnnouncements(prev => prev.filter(a => a.id !== annId));
    showToast('Announcement deleted', 'success');

    // 2. Persist to DB
    if (isSupabaseConfigured) {
      try {
        const { success, error } = await deleteAnnouncement(annId);
        if (!success) throw new Error(error);
      } catch (err: any) {
        console.error('Failed to delete announcement in DB:', err.message);
        showToast('DB Error: ' + err.message, 'error');
      }
    }
  };

  const handleResearchSubmission = async (submission: Partial<ResearchSubmission>) => {
    const result = await submitResearchSubmission(submission);
    if (!result.success) throw new Error(result.error || 'Research submission failed.');
    setAuditLogs(prev => [{
      id: `log-${Date.now()}`,
      action: `Research submitted: ${submission.title || 'Untitled research'}`,
      entity_type: 'ResearchSubmission',
      entity_id: submission.member_id || '',
      admin_username: 'member_portal',
      created_at: new Date().toISOString()
    }, ...prev]);
  };

  const handleResearchStatusChange = async (id: string, status: ResearchSubmission['status'], reviewNotes?: string) => {
    const result = await updateResearchSubmission(id, status, reviewNotes);
    if (!result.success) throw new Error(result.error || 'Could not update the research review.');
    setResearchSubmissions(prev => prev.map(submission => submission.id === id ? { ...submission, status, review_notes: reviewNotes } : submission));
  };

  const handleVerifyPayment = (appId: string) => {
    setApplications(prev => prev.map(a => {
      if (a.id === appId && a.payment) {
        return { ...a, payment: { ...a.payment, status: 'VERIFIED' } };
      }
      return a;
    }));
  };

  const handleAddAnnouncement = async (ann: Partial<Announcement>) => {
    const fullAnn: Announcement = {
      id: 'ann-' + Date.now(),
      title: ann.title || 'Untitled Announcement',
      amharic_title: ann.amharic_title,
      category: ann.category || 'General',
      content: ann.content || '',
      published_at: new Date().toISOString(),
      author: ann.author || 'EPA Executive Directorate',
      cover_photo_url: ann.cover_photo_url,
      file_attachment_url: ann.file_attachment_url,
      target_audience: ann.target_audience,
      is_draft: ann.is_draft,
      telegram_media_url: ann.telegram_media_url,
      telegram_media_type: ann.telegram_media_type,
      publish_to_telegram: ann.publish_to_telegram,
      telegram_button_label: ann.telegram_button_label,
      telegram_button_url: ann.telegram_button_url,
      likes_count: 0,
      views_count: 1
    };
    if (isSupabaseConfigured) {
      const result = await publishAnnouncement(fullAnn);
      if (!result.success) {
        console.error('[App] Announcement publish failed:', result.error);
        showToast(`Database error: ${result.error}`, 'error');
        return false;
      } else {
        if (ann.publish_to_telegram) {
          showToast(result.telegram?.posted ? 'Announcement published to the portal, email list, and Telegram channel.' : `Announcement published to the portal. Telegram was not posted: ${result.telegram?.error || 'Telegram is not configured.'}`, result.telegram?.posted ? 'success' : 'error');
        } else showToast('Announcement published to the member portal and email list.', 'success');
      }
    }
    setAnnouncements(prev => [fullAnn, ...prev]);
    return true;
  };

  const handleAddUniversity = (uni: Partial<University>) => {
    const fullUni: University = {
      id: 'uni-' + Date.now(),
      name: uni.name || 'New University',
      city: uni.city || 'Addis Ababa',
      type: uni.type || 'Public',
      is_accredited: true,
      departments: uni.departments || ['Psychology Department']
    };
    setUniversities(prev => [...prev, fullUni]);
  };

  const handleRegisterCPD = (courseId: string) => {
    setCpdCourses(prev => prev.map(c => c.id === courseId ? { ...c, registered: true } : c));
    showToast(
      lang === 'EN' 
        ? 'Successfully registered for CPD session! Zoom confirmation link generated.' 
        : 'ለስልጠናው በተሳካ ሁኔታ ተመዝግበዋል!',
      'success'
    );
  };

  const handleVoteCast = (candidateId: string) => {
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, votes_count: c.votes_count + 1 } : c));
  };

  const handleVerifyClick = (token: string) => {
    setActiveVerifyToken(token);
    setCurrentTab('verify');
  };

  const pendingAppsCount = applications.filter(a => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW' || a.status === 'PAYMENT_PENDING').length;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#080808] text-gray-900 dark:text-white selection:bg-[#d4ff00] selection:text-black font-sans">
      {/* Animated Splash Screen */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      
      {/* Primary Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        lang={lang}
        setLang={setLang}
        activeMember={activeMember}
        pendingApplicationsCount={pendingAppsCount}
        unreadNotificationsCount={announcements.length}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenRegisterModal={() => {
          setSelectedRegTier(null as any); // null = show tier selection step
          setIsRegisterModalOpen(true);
        }}
      />

      {/* Main Tab Content Display */}
      <main className="flex-1 flex flex-col pb-20 md:pb-0">
        {currentTab === 'welcome' && (
          <WelcomeView
            lang={lang}
            announcements={announcements}
            onSelectMembership={(code) => {
              setSelectedRegTier(code);
              setIsRegisterModalOpen(true);
            }}
            onOpenDirectory={() => setCurrentTab('directory')}
            onOpenVerify={() => setCurrentTab('verify')}
            onOpenIdCard={() => setCurrentTab('idcard')}
          />
        )}

        {currentTab === 'portal' && (
          activeMember ? (
            <MemberPortalView
              member={activeMember}
              lang={lang}
              allMembers={members}
              cpdCourses={cpdCourses}
              announcements={announcements}
              onOpenIdCard={() => setCurrentTab('idcard')}
              onOpenVoting={() => setCurrentTab('elections')}
              onOpenDirectory={() => setCurrentTab('directory')}
              onRegisterCPD={handleRegisterCPD}
              onSubmitResearch={handleResearchSubmission}
              onToast={showToast}
            />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 border border-gray-200 dark:border-white/10">
                <ShieldCheck className="w-10 h-10 text-neutral-400 dark:text-neutral-500" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-3 font-syne">
                {lang === 'EN' ? 'Access Restricted' : 'መግባት አይቻልም'}
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mb-6 leading-relaxed">
                {lang === 'EN' 
                  ? 'This portal is for approved members only. Log in with your phone and password, or submit an application.'
                  : 'ይህ ገጽ ለተረጋገጡ አባላት ብቻ ነው። ስልክ ቁጥርዎ እና የይለፍ ቃልዎን ይጠቀሙ።'}
              </p>
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button 
                  onClick={() => setIsPhoneLoginOpen(true)} 
                  className="px-8 py-3.5 bg-[#d4ff00] text-black font-black uppercase text-xs rounded-xl shadow-[0_0_20px_rgba(212,255,0,0.3)] hover:shadow-[0_0_30px_rgba(212,255,0,0.5)] transition-all active:scale-95"
                >
                  🔐 {lang === 'EN' ? 'Login with Phone & Password' : 'ስልክ ቁጥርዎ በመጠቀም ግባ'}
                </button>
                <button 
                  onClick={() => setCurrentTab('welcome')} 
                  className="px-8 py-3 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-bold uppercase text-xs rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 transition-all active:scale-95"
                >
                  {lang === 'EN' ? 'Return Home' : 'ወደ መነሻ ተመለስ'}
                </button>
              </div>
            </div>
          )
        )}


        {currentTab === 'idcard' && (
          activeMember ? (
            <DigitalIdCard
              member={activeMember}
              lang={lang}
              onVerifyClick={handleVerifyClick}
              onToast={showToast}
            />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 border border-gray-200 dark:border-white/10">
                <CreditCard className="w-10 h-10 text-neutral-400 dark:text-neutral-500" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-3 font-syne">
                {lang === 'EN' ? 'No Digital ID Found' : 'መታወቂያ አልተገኘም'}
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mb-6 leading-relaxed">
                {lang === 'EN' 
                  ? 'Log in with your phone and password to view your Digital ID, or submit an application to become a member.'
                  : 'ስልክ ቁጥርዎን እና የይለፍ ቃልዎን ይጠቀሙ ወይም ማመልከቻ ያስገቡ።'}
              </p>
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button 
                  onClick={() => setIsPhoneLoginOpen(true)} 
                  className="px-8 py-3.5 bg-[#d4ff00] text-black font-black uppercase text-xs rounded-xl shadow-[0_0_20px_rgba(212,255,0,0.3)] hover:shadow-[0_0_30px_rgba(212,255,0,0.5)] transition-all active:scale-95"
                >
                  🔐 {lang === 'EN' ? 'Login with Phone & Password' : 'ስልክ ቁጥርዎ በመጠቀም ግባ'}
                </button>
                <button 
                  onClick={() => setCurrentTab('welcome')} 
                  className="px-8 py-3 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-bold uppercase text-xs rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 transition-all active:scale-95"
                >
                  {lang === 'EN' ? 'Return Home' : 'ወደ መነሻ ተመለስ'}
                </button>
              </div>
            </div>
          )
        )}

        {currentTab === 'directory' && (
          <PsychologistDirectory
            members={members}
            lang={lang}
            onVerifyMember={handleVerifyClick}
            onToast={showToast}
          />
        )}

        {currentTab === 'verify' && (
          <PublicVerifyView
            lang={lang}
            initialToken={activeVerifyToken}
            onToast={showToast}
          />
        )}

        {currentTab === 'admin' && (
          <AdminPortalView
            lang={lang}
            applications={applications}
            members={members}
            universities={universities}
            announcements={announcements}
            auditLogs={auditLogs}
            researchSubmissions={researchSubmissions}
            onApproveApplication={handleApproveApplication}
            onResendApprovalEmail={handleResendApprovalEmail}
            onRejectApplication={handleRejectApplication}
            onRequestCorrection={handleRequestCorrection}
            onVerifyPayment={handleVerifyPayment}
            onAddAnnouncement={handleAddAnnouncement}
            onDeleteMember={handleDeleteMember}
            onDeleteAnnouncement={handleDeleteAnnouncement}
            onAddUniversity={handleAddUniversity}
            onUpdateResearchSubmission={handleResearchStatusChange}
            onOpenApplication={loadApplicationDossier}
            onMembersImported={async () => setMembers(await fetchMembers())}
            onToast={showToast}
          />
        )}

        {currentTab === 'elections' && (
          <ElectionsBooth
            candidates={candidates}
            activeMember={activeMember}
            lang={lang}
            onVoteCast={handleVoteCast}
            onClose={() => setCurrentTab('portal')}
            onToast={showToast}
          />
        )}
      </main>

      {/* Demo Mode Switcher — hidden in production Telegram env */}
      {!isTelegramMiniApp() && (
        <div className="fixed bottom-4 right-4 z-40 bg-white/90 dark:bg-[#121214]/95 backdrop-blur-md text-gray-900 dark:text-white p-2 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 flex items-center gap-1.5">
          <span className="text-[9px] font-mono font-black uppercase text-green-700 dark:text-[#d4ff00] tracking-wider hidden sm:inline pl-1">DEMO:</span>
          {[
            { id: 'mem-001', label: 'Full', tab: 'portal' },
            { id: 'mem-002', label: 'Student', tab: 'portal' },
            { id: 'mem-003', label: 'Corp', tab: 'portal' },
          ].map(p => (
            <button key={p.id}
              onClick={() => { setActiveMemberId(p.id); setCurrentTab(p.tab); }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeMemberId === p.id ? 'bg-[#d4ff00] text-black' : 'bg-black/5 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 border border-gray-100 dark:border-white/5'
              }`}
            >{p.label}</button>
          ))}
          <button
            onClick={() => setCurrentTab('admin')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              currentTab === 'admin' ? 'bg-amber-400 text-black' : 'bg-black/5 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 border border-gray-100 dark:border-white/5'
            }`}
          >Admin</button>
        </div>
      )}

      {/* Registration Wizard Modal */}
      <RegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        lang={lang}
        initialTier={selectedRegTier || null}
        universities={universities}
        onSubmitApplication={handleApplicationSubmit}
        onToast={showToast}
      />

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        lang={lang}
        announcements={announcements}
        onNavigateTab={(tab) => setCurrentTab(tab)}
      />

      {/* Mobile Bottom Navigation Bar */}
      <BottomBar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        lang={lang} 
        activeMember={activeMember} 
        pendingApplicationsCount={pendingAppsCount} 
      />

      {/* Toast Stack */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-bold uppercase tracking-wide animate-in slide-in-from-top duration-200 ${
              toast.type === 'success' 
                ? 'bg-gray-50 dark:bg-[#121214] text-gray-900 dark:text-white border-[#d4ff00]/60' 
                : toast.type === 'error'
                ? 'bg-red-50 dark:bg-[#180a0a] text-gray-900 dark:text-white border-red-500/60' 
                : 'bg-gray-50 dark:bg-[#121214] text-gray-900 dark:text-white border-gray-200 dark:border-white/15'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-green-700 dark:text-[#d4ff00] shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-amber-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-[#050505] text-gray-900 dark:text-white pt-14 pb-10 px-4 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-white/10 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-8 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#d4ff00] p-1 flex items-center justify-center text-black font-black text-xs font-syne shadow-lg">
              EPA
            </div>
            <div>
              <div className="font-black text-sm uppercase tracking-wider text-gray-900 dark:text-white">Ethiopian Psychologists’ Association</div>
              <div className="text-xs font-bold text-green-700 dark:text-[#d4ff00]">የኢትዮጵያ ሳይኮሎጂ ባለሙያዎች ማኅበር (ኢሳይባ)</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
            <button onClick={() => setCurrentTab('welcome')} className="hover:text-green-700 dark:text-[#d4ff00] transition-colors cursor-pointer">Home</button>
            <button onClick={() => setCurrentTab('portal')} className="hover:text-green-700 dark:text-[#d4ff00] transition-colors cursor-pointer">Member Portal</button>
            <button onClick={() => setCurrentTab('idcard')} className="hover:text-green-700 dark:text-[#d4ff00] transition-colors cursor-pointer">Digital ID</button>
            <button onClick={() => setCurrentTab('directory')} className="hover:text-green-700 dark:text-[#d4ff00] transition-colors cursor-pointer">Psychologist Directory</button>
            <button onClick={() => setCurrentTab('verify')} className="hover:text-green-700 dark:text-[#d4ff00] transition-colors cursor-pointer">QR Verification</button>
            <button onClick={() => setCurrentTab('admin')} className="hover:text-green-700 dark:text-[#d4ff00] transition-colors cursor-pointer">Council Admin</button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono uppercase text-neutral-500 dark:text-neutral-500">
          <div>
            © 2026 Ethiopian Psychologists’ Association. Federal Proclamation No. 1113/2019.
          </div>
          <div className="flex items-center gap-4">
            <span>Addis Ababa, Ethiopia</span>
            <span>•</span>
            <span>Tel: +251 11 123 4567</span>
            <span>•</span>
            <span className="text-green-700 dark:text-[#d4ff00] font-bold">REGISTRY V2.4.0</span>
          </div>
        </div>
        <PhoneLoginModal
          isOpen={isPhoneLoginOpen}
          onClose={() => setIsPhoneLoginOpen(false)}
          lang={lang}
          onSuccess={handlePhoneLoginSuccess}
          onToast={showToast}
        />
      </footer>
    </div>
  );
}
