import React from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  CreditCard, 
  Search, 
  LayoutDashboard, 
  Sparkles,
  BookOpen,
  Users,
  Briefcase
} from 'lucide-react';
import { Member } from '../types';
import { isTelegramMiniApp } from '../lib/telegram';

interface BottomBarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  lang: 'EN' | 'AM';
  activeMember?: Member;
  pendingApplicationsCount: number;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  currentTab,
  setCurrentTab,
  lang,
  activeMember,
  pendingApplicationsCount,
}) => {
  const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
  const adminIds = (import.meta.env.VITE_ADMIN_TELEGRAM_IDS || '').split(',').filter(Boolean);
  const isAdmin = tgUser && adminIds.includes(tgUser.id.toString());

  // Build nav items — mirrors the top-bar navItems exactly
  const navItems: { id: string; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'welcome',
      label: lang === 'EN' ? 'Home' : 'መነሻ',
      icon: <Sparkles className="w-4 h-4" />
    },
    {
      id: 'portal',
      label: lang === 'EN' ? 'Portal' : 'ገጽ',
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: activeMember ? 'Active' : undefined
    },
    {
      id: 'idcard',
      label: lang === 'EN' ? 'Digital ID' : 'መታወቂያ',
      icon: <CreditCard className="w-4 h-4" />
    },
    {
      id: 'directory',
      label: lang === 'EN' ? 'Directory' : 'ማውጫ',
      icon: <Search className="w-4 h-4" />
    },
    {
      id: 'verify',
      label: lang === 'EN' ? 'Verify' : 'አረጋግጥ',
      icon: <ShieldCheck className="w-4 h-4" />
    },
  ];

  // Dynamic membership tab
  if (activeMember) {
    if (activeMember.membership_type === 'STUDENT') {
      navItems.splice(2, 0, { id: 'portal', label: lang === 'EN' ? 'Mentors' : 'አማካሪ', icon: <Users className="w-4 h-4" /> });
    } else if (activeMember.membership_type === 'FULL') {
      navItems.splice(2, 0, { id: 'portal', label: lang === 'EN' ? 'My CPD' : 'ትምህርት', icon: <BookOpen className="w-4 h-4" /> });
    } else if (activeMember.membership_type === 'CORPORATE') {
      navItems.splice(2, 0, { id: 'portal', label: lang === 'EN' ? 'Staff' : 'ሰራተኞች', icon: <Briefcase className="w-4 h-4" /> });
    }
  }

  // Admin tab — secured
  if (isAdmin || (!isTelegramMiniApp() && import.meta.env.MODE === 'development')) {
    navItems.push({
      id: 'admin',
      label: lang === 'EN' ? 'Admin' : 'አስተዳዳሪ',
      icon: <UserCheck className="w-4 h-4" />,
      badge: pendingApplicationsCount > 0 ? `${pendingApplicationsCount}` : undefined,
    });
  }

  return (
    // Only visible on mobile, hidden on md+, same background as header
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#080808]/95 backdrop-blur-md border-t border-gray-200 dark:border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
      {/* Safe area padding for iPhone home indicator */}
      <div className="flex items-center justify-around overflow-x-auto no-scrollbar px-1 pt-1.5 pb-safe-or-2">
        {navItems.map((item, idx) => {
          const isActive = currentTab === item.id && (idx < 2 || item.id !== 'portal' || idx === navItems.findIndex(n => n.id === 'portal'));
          const activeByTab = currentTab === item.id;
          return (
            <button
              key={`${item.id}-${idx}`}
              id={`bottom-nav-${item.id}-${idx}`}
              onClick={() => setCurrentTab(item.id)}
              className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] whitespace-nowrap font-black uppercase tracking-wider transition-all cursor-pointer min-w-[52px] ${
                activeByTab
                  ? 'bg-[#d4ff00] text-black shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span className={activeByTab ? 'text-black' : 'text-neutral-500 dark:text-neutral-400'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.badge && (
                <span className={`absolute -top-1 right-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeByTab ? 'bg-black text-[#d4ff00]' : 'bg-[#d4ff00] text-black'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
