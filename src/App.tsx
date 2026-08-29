import React, { useState, useEffect } from 'react';
import { isSupabaseConfigured } from './lib/supabase';
import { 
  fetchMembers, fetchApplications, fetchAnnouncements, 
  fetchUniversities, fetchCPDCourses, fetchAuditLogs, fetchElectionCandidates,
  submitApplication, updateApplicationStatus, publishAnnouncement
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
  MembershipTypeCode 
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
import { initTelegramApp, getTelegramColorScheme, isTelegramMiniApp } from './lib/telegram';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(true);

  // Load Data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        if (isSupabaseConfigured) {
          const [
            fetchedMembers, fetchedApps, fetchedAnnouncements, 
            fetchedUnivs, fetchedCPDs, fetchedLogs, fetchedCandidates
          ] = await Promise.all([
            fetchMembers(), fetchApplications(), fetchAnnouncements(),
            fetchUniversities(), fetchCPDCourses(), fetchAuditLogs(), fetchElectionCandidates()
          ]);
          setMembers(fetchedMembers);
          setApplications(fetchedApps);
          setAnnouncements(fetchedAnnouncements);
          setUniversities(fetchedUnivs);
          setCpdCourses(fetchedCPDs);
          setAuditLogs(fetchedLogs);
          setCandidates(fetchedCandidates);

          // Telegram Auto-Login
          const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
          if (tgUser && tgUser.id) {
            const matchedMember = fetchedMembers.find(m => m.telegram_id === tgUser.id || m.telegram_id?.toString() === tgUser.id.toString());
            if (matchedMember) {
              setActiveMemberId(matchedMember.id);
            } else {
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

  // Active Logged-in Member
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);

  // Modals and Drawers
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [selectedRegTier, setSelectedRegTier] = useState<MembershipTypeCode>('FULL');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  
  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  const activeMember = members.find(m => m.id === activeMemberId);

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
    const fullApp: Application = {
      ...newApp,
      // Preserve id and application_number from modal if provided, else generate
      id: newApp.id || ('app-' + Date.now()),
      application_number: newApp.application_number || ('EPA-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000)),
      membership_type: (newApp.membership_type || 'STUDENT') as any,
      status: 'SUBMITTED',
      submitted_at: newApp.submitted_at || new Date().toISOString()
    };

    // Always try to save to Supabase (isSupabaseConfigured is now always true)
    const result = await submitApplication(fullApp);
    if (!result.success) {
      console.error('[App] Application submission failed:', result.error);
      showToast(`Submission error: ${result.error}`, 'error');
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


  // Handler: Admin approves application -> generates Member Record & Digital ID
  const handleApproveApplication = async (appId: string) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;

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
      membership_type: app.membership_type,
      status: 'ACTIVE',
      specialty: app.student_profile ? `${app.student_profile.field_of_study}` : (app.qualifications?.[0]?.field || 'Clinical Psychology'),
      workplace: app.student_profile ? `${app.student_profile.university_name}` : 'Accredited Psychological Practice',
      bio: 'Newly registered and accredited member of the Ethiopian Psychologists’ Association.',
      cpd_points: 10,
      issued_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 2).toISOString(),
      is_verified: true,
      license_number: app.membership_type === 'FULL' ? `EPA-LIC-CL-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
      corporate_profile: app.corporate_profile,
      student_profile: app.student_profile
    };

    if (isSupabaseConfigured) {
      await updateApplicationStatus(appId, 'APPROVED');
      await createMember(newMember); // Save to database!
    }

    setMembers(prev => [newMember, ...prev]);
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'APPROVED' } : a));
    
    // For testing/demo purposes, log the user in as the newly approved member 
    // so they can immediately see their digital ID
    setActiveMemberId(newMember.id);
    setCurrentTab('idcard');

    setAuditLogs(prev => [{
      id: 'log-' + Date.now(),
      action: `Approved Application & Issued ID: ${newMembershipNum}`,
      entity_type: 'Member',
      entity_id: newMember.membership_number,
      admin_username: 'superadmin_council',
      created_at: new Date().toISOString()
    }, ...prev]);
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

  const handleRequestCorrection = (appId: string, notes: string) => {
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'CORRECTION_REQUIRED', admin_notes: notes } : a));
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
      likes_count: 0,
      views_count: 1
    };
    if (isSupabaseConfigured) {
      const result = await publishAnnouncement(fullAnn);
      if (!result.success) {
        console.error('[App] Announcement publish failed:', result.error);
        showToast(`Database error: ${result.error}`, 'error');
      } else {
        showToast('Announcement published to database!', 'success');
      }
    }
    setAnnouncements(prev => [fullAnn, ...prev]);
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
        unreadNotificationsCount={2}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenRegisterModal={() => {
          setSelectedRegTier('FULL');
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
          <MemberPortalView
            member={activeMember}
            lang={lang}
            cpdCourses={cpdCourses}
            announcements={announcements}
            onOpenIdCard={() => setCurrentTab('idcard')}
            onOpenVoting={() => setCurrentTab('elections')}
            onOpenDirectory={() => setCurrentTab('directory')}
            onRegisterCPD={handleRegisterCPD}
            onToast={showToast}
          />
        )}

        {currentTab === 'idcard' && (
          <DigitalIdCard
            member={activeMember}
            lang={lang}
            onVerifyClick={handleVerifyClick}
            onToast={showToast}
          />
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
            members={members}
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
            onApproveApplication={handleApproveApplication}
            onRejectApplication={handleRejectApplication}
            onRequestCorrection={handleRequestCorrection}
            onVerifyPayment={handleVerifyPayment}
            onAddAnnouncement={handleAddAnnouncement}
            onAddUniversity={handleAddUniversity}
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
        initialTier={selectedRegTier}
        universities={universities}
        onSubmitApplication={handleApplicationSubmit}
        onToast={showToast}
      />

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        lang={lang}
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
      </footer>

    </div>
  );
}
