import React from 'react';
import { 
  X, 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Award, 
  Calendar,
  Sparkles,
  CreditCard
} from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'success' | 'alert' | 'event' | 'license';
  read: boolean;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'EN' | 'AM';
  onNavigateTab: (tab: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  lang,
  onNavigateTab,
}) => {
  if (!isOpen) return null;

  const notifications: NotificationItem[] = [
    {
      id: 'notif-1',
      title: 'Digital Membership Pass Active',
      description: 'Your biometric QR accreditation has been validated for the 2026 academic & fiscal year.',
      time: '10m ago',
      type: 'success',
      read: false
    },
    {
      id: 'notif-2',
      title: 'Upcoming CPD Webinar: Sept 12',
      description: 'Trauma Counseling in Emergency Settings workshop zoom link has been sent to your email.',
      time: '2h ago',
      type: 'event',
      read: false
    },
    {
      id: 'notif-3',
      title: 'General Assembly Elections Live',
      description: 'The EPA Executive Council 2026-2028 election ballot is now open for voting.',
      time: '1d ago',
      type: 'alert',
      read: true
    },
    {
      id: 'notif-4',
      title: 'Telebirr Payment Slip Confirmed',
      description: 'Annual license renewal fee of 1,500 ETB verified by EPA Finance Directorate.',
      time: '3d ago',
      type: 'license',
      read: true
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-md flex justify-end">
      <div className="w-full max-w-md bg-gray-50 dark:bg-[#121214] border-l border-gray-200 dark:border-white/10 h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#0a0a0c]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] rounded-xl border border-[#d4ff00]/30">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white font-syne uppercase tracking-tight">
                {lang === 'EN' ? 'Notifications & Alerts' : 'ማሳወቂያዎች'}
              </h3>
              <span className="text-[10px] text-stone-600 dark:text-stone-400 font-mono">EPA Secure Activity Stream</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-600 dark:text-stone-400 hover:text-gray-900 dark:text-white hover:bg-black/10 dark:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {notifications.map(item => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3.5 rounded-2xl transition-colors cursor-pointer border ${
                !item.read 
                  ? 'bg-[#d4ff00]/5 border-[#d4ff00]/30' 
                  : 'bg-white dark:bg-[#0a0a0c] border-gray-100 dark:border-white/5 hover:border-gray-200 dark:border-white/15'
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 mt-0.5 border ${
                item.type === 'success' ? 'bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] border-[#d4ff00]/30' :
                item.type === 'event' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                item.type === 'alert' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' :
                'bg-purple-500/10 text-purple-400 border-purple-500/30'
              }`}>
                {item.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                {item.type === 'event' && <Calendar className="w-4 h-4" />}
                {item.type === 'alert' && <Sparkles className="w-4 h-4" />}
                {item.type === 'license' && <CreditCard className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-xs text-gray-900 dark:text-white font-syne uppercase leading-snug truncate">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-stone-600 dark:text-stone-400 font-mono shrink-0">{item.time}</span>
                </div>
                <p className="text-[11px] text-stone-700 dark:text-stone-300 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0c] flex items-center justify-between text-xs">
          <button
            onClick={() => {
              onNavigateTab('portal');
              onClose();
            }}
            className="text-green-700 dark:text-[#d4ff00] font-mono text-[11px] font-bold uppercase hover:underline cursor-pointer"
          >
            Go to Member Dashboard →
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-gray-900 dark:text-white font-mono font-bold text-xs border border-gray-200 dark:border-white/10 cursor-pointer"
          >
            Dismiss
          </button>
        </div>

      </div>
    </div>
  );
};
