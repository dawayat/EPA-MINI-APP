import React from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  CreditCard, 
  Search, 
  LayoutDashboard, 
  CheckCircle2, 
  Bell, 
  Languages, 
  Sparkles,
  Award,
  Sun,
  Moon
} from 'lucide-react';
import { Member } from '../types';
import { useTheme } from './ThemeProvider';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  lang: 'EN' | 'AM';
  setLang: (lang: 'EN' | 'AM') => void;
  activeMember: Member;
  pendingApplicationsCount: number;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onOpenRegisterModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  lang,
  setLang,
  activeMember,
  pendingApplicationsCount,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenRegisterModal,
}) => {
  const { theme, setTheme } = useTheme();

  const navItems = [
    {
      id: 'welcome',
      label: lang === 'EN' ? 'Home & Apply' : 'መነሻ ገጽ',
      icon: <Sparkles className="w-4 h-4" />
    },
    {
      id: 'portal',
      label: lang === 'EN' ? 'Member Portal' : 'የአባላት ገጽ',
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: activeMember ? 'Active' : undefined
    },
    {
      id: 'idcard',
      label: lang === 'EN' ? 'Digital ID' : 'ዲጂታል መታወቂያ',
      icon: <CreditCard className="w-4 h-4" />
    },
    {
      id: 'directory',
      label: lang === 'EN' ? 'Directory' : 'የባለሙያዎች ማውጫ',
      icon: <Search className="w-4 h-4" />
    },
    {
      id: 'verify',
      label: lang === 'EN' ? 'Verify' : 'አረጋግጥ',
      icon: <ShieldCheck className="w-4 h-4" />
    },
    {
      id: 'admin',
      label: lang === 'EN' ? 'Admin Portal' : 'አስተዳዳሪ',
      icon: <UserCheck className="w-4 h-4" />,
      badge: pendingApplicationsCount > 0 ? `${pendingApplicationsCount}` : undefined,
      badgeColor: 'bg-[#d4ff00] text-black font-black'
    }
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-[#080808]/95 backdrop-blur-md border-b border-gray-200 dark:border-white/10 shadow-lg">
      {/* Top micro bar for Ethiopian Psychologists Association Banner */}
      <div className="bg-gray-50 dark:bg-black border-b border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <span className="flex h-2 w-2 rounded-full bg-[#d4ff00] animate-pulse"></span>
          <span className="font-black tracking-widest text-[11px] text-gray-900 dark:text-white uppercase font-syne">
            {lang === 'EN' ? 'Ethiopian Psychologists’ Association' : 'የኢትዮጵያ ሳይኮሎጂ ባለሙያዎች ማኅበር (ኢሳይባ)'}
          </span>
          <span className="hidden sm:inline text-neutral-600">•</span>
          <span className="hidden sm:inline text-[11px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
            {lang === 'EN' ? 'Official Accreditation Registry' : 'ብሔራዊ የሙያ ፈቃድና ምዝገባ መድረክ'}
          </span>

          <div className="ml-auto flex items-center gap-3">
            <button 
              id="lang-toggle-btn"
              onClick={() => setLang(lang === 'EN' ? 'AM' : 'EN')}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors text-gray-900 dark:text-white text-[11px] font-bold uppercase tracking-wider cursor-pointer border border-gray-200 dark:border-white/10"
              title="Switch Language"
            >
              <Languages className="w-3 h-3 text-green-700 dark:text-[#d4ff00]" />
              <span>{lang === 'EN' ? 'አማርኛ' : 'English'}</span>
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors text-gray-900 dark:text-white text-[11px] font-bold uppercase tracking-wider cursor-pointer border border-gray-200 dark:border-white/10"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-3 h-3 text-green-700 dark:text-[#d4ff00]" /> : <Moon className="w-3 h-3 text-green-700 dark:text-[#d4ff00]" />}
              <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main navigation container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Association Name */}
          <div 
            id="nav-brand-logo"
            onClick={() => setCurrentTab('welcome')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-transparent transition-colors">
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                <img src="/epa-logo.png" alt="EPA Logo" className="w-full h-full object-contain" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#d4ff00] border-2 border-black rounded-full flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-2.5 h-2.5 text-black" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 hidden md:flex">
                <span className="font-black text-lg tracking-wider text-gray-900 dark:text-white font-syne uppercase">
                  EPA Portal
                </span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] border border-[#d4ff00]/30 uppercase font-mono">
                  V2.4
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium line-clamp-1 hidden md:block">
                {lang === 'EN' ? 'Psychology Practitioners of Ethiopia' : 'የኢትዮጵያ ስነ-ልቦና ባለሙያዎች ማኅበር'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-50 dark:bg-[#121214] p-1.5 rounded-2xl border border-gray-200 dark:border-white/10">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => setCurrentTab(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#d4ff00] text-black shadow-md font-black'
                      : 'text-neutral-700 dark:text-neutral-300 hover:text-gray-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <span className={isActive ? 'text-black' : 'text-neutral-600 dark:text-neutral-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>

                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-black text-green-700 dark:text-[#d4ff00]' : (item.badgeColor || 'bg-[#d4ff00] text-black')
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Notification Bell */}
            <button
              id="notifications-bell-btn"
              onClick={onOpenNotifications}
              className="relative p-2.5 rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-gray-900 dark:text-white hover:bg-black/10 dark:bg-white/10 border border-gray-100 dark:border-white/5 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#d4ff00] text-black rounded-full text-[10px] font-black flex items-center justify-center ring-2 ring-black">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Quick Apply CTA button */}
            <button
              id="nav-apply-btn"
              onClick={onOpenRegisterModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#d4ff00] hover:bg-[#c3eb00] text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-[#d4ff00]/10 hover:shadow-[#d4ff00]/25 transition-all active:scale-95 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-black" />
              <span>{lang === 'EN' ? 'Join EPA' : 'አባል ይሁኑ'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation is now in BottomBar.tsx */}
    </header>
  );
};
