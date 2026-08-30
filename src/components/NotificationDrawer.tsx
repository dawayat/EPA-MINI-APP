import React, { useState } from 'react';
import { 
  X, Bell, CheckCircle2, AlertCircle, Calendar, Sparkles,
  Megaphone, ExternalLink, FileText
} from 'lucide-react';
import { Announcement } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'EN' | 'AM';
  announcements: Announcement[];
  onNavigateTab: (tab: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen, onClose, lang, announcements, onNavigateTab,
}) => {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  if (!isOpen) return null;

  const markRead = (id: string) => setReadIds(prev => new Set([...prev, id]));
  const markAllRead = () => setReadIds(new Set(announcements.map(a => a.id)));

  const unreadCount = announcements.filter(a => !readIds.has(a.id)).length;

  const categoryIcon = (cat: string) => {
    if (cat === 'Event') return <Calendar className="w-4 h-4" />;
    if (cat === 'Circular') return <AlertCircle className="w-4 h-4" />;
    if (cat === 'Vote') return <Sparkles className="w-4 h-4" />;
    return <Megaphone className="w-4 h-4" />;
  };

  const categoryColor = (cat: string) => {
    if (cat === 'Event') return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    if (cat === 'Circular') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    if (cat === 'Vote') return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    return 'bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] border-[#d4ff00]/30';
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-md flex justify-end" onClick={onClose}>
      <div className="w-full max-w-md bg-gray-50 dark:bg-[#121214] border-l border-gray-200 dark:border-white/10 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#0a0a0c]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] rounded-xl border border-[#d4ff00]/30 relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white font-syne uppercase tracking-tight">
                {lang === 'EN' ? 'Notifications & News' : 'ማሳወቂያዎች እና ዜናዎች'}
              </h3>
              <span className="text-[10px] text-stone-600 dark:text-stone-400 font-mono">
                {announcements.length} {lang === 'EN' ? 'published items' : 'ይፋ የሆኑ'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-[10px] font-bold text-green-700 dark:text-[#d4ff00] hover:underline cursor-pointer">
                {lang === 'EN' ? 'Mark all read' : 'ሁሉም ተነቢቧል'}
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-xl text-stone-600 dark:text-stone-400 hover:text-gray-900 dark:text-white hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Bell className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mb-3" />
              <p className="text-sm text-neutral-500">{lang === 'EN' ? 'No announcements yet' : 'ምንም ማስታወቂያ የለም'}</p>
            </div>
          ) : (
            announcements.map(ann => {
              const isUnread = !readIds.has(ann.id);
              return (
                <button
                  key={ann.id}
                  onClick={() => { markRead(ann.id); setSelectedAnnouncement(ann); }}
                  className={`w-full text-left flex items-start gap-3 p-3.5 rounded-2xl transition-all cursor-pointer border ${
                    isUnread
                      ? 'bg-[#d4ff00]/5 border-[#d4ff00]/30 dark:bg-[#d4ff00]/5 hover:-translate-y-0.5'
                      : 'bg-white dark:bg-[#0a0a0c] border-gray-100 dark:border-white/5 hover:border-[#d4ff00]/30 hover:-translate-y-0.5'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 border ${categoryColor(ann.category)}`}>
                    {categoryIcon(ann.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-xs text-gray-900 dark:text-white font-syne uppercase leading-snug">
                        {lang === 'EN' ? ann.title : (ann.amharic_title || ann.title)}
                        {isUnread && <span className="ml-2 inline-block w-2 h-2 bg-[#d4ff00] rounded-full align-middle" />}
                      </h4>
                      <span className="text-[10px] text-stone-500 font-mono shrink-0">{timeAgo(ann.published_at)}</span>
                    </div>
                    {ann.content && (
                      <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1 leading-relaxed line-clamp-2">{ann.content}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase">{ann.category}</span>
                      {(ann as any).file_attachment_url && <span className="text-[10px] flex items-center gap-1 text-blue-500"><FileText className="w-3 h-3" /> {lang === 'EN' ? 'Attachment' : 'ፋይል'}</span>}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0c] flex items-center justify-between text-xs">
          <button onClick={() => { onNavigateTab('portal'); onClose(); }}
            className="text-green-700 dark:text-[#d4ff00] font-mono text-[11px] font-bold uppercase hover:underline cursor-pointer">
            {lang === 'EN' ? 'Go to Member Dashboard →' : 'ወደ ዳሽቦርድ →'}
          </button>
          <button onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-gray-900 dark:text-white font-mono font-bold text-xs border border-gray-200 dark:border-white/10 cursor-pointer">
            {lang === 'EN' ? 'Dismiss' : 'ዝጋ'}
          </button>
        </div>
      </div>

      {selectedAnnouncement && (
        <div className="absolute inset-0 z-10 bg-gray-50 dark:bg-[#121214] flex flex-col animate-in slide-in-from-right duration-200">
          <div className="p-5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#0a0a0c]">
            <button onClick={() => setSelectedAnnouncement(null)} className="text-[11px] font-black uppercase text-green-700 dark:text-[#d4ff00] hover:underline">← {lang === 'EN' ? 'All news' : 'ሁሉም ዜና'}</button>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10"><X className="w-5 h-5" /></button>
          </div>
          <div className="overflow-y-auto flex-1">
            {(selectedAnnouncement.cover_image_url || selectedAnnouncement.cover_photo_url) && <img src={selectedAnnouncement.cover_image_url || selectedAnnouncement.cover_photo_url} alt="" className="w-full h-48 object-cover" />}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4"><span className={`px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold uppercase ${categoryColor(selectedAnnouncement.category)}`}>{selectedAnnouncement.category}</span><span className="text-[10px] font-mono text-neutral-500">{new Date(selectedAnnouncement.published_at).toLocaleDateString()}</span></div>
              <h3 className="text-xl font-black font-syne uppercase tracking-tight text-gray-900 dark:text-white leading-tight">{lang === 'EN' ? selectedAnnouncement.title : (selectedAnnouncement.amharic_title || selectedAnnouncement.title)}</h3>
              <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">{selectedAnnouncement.content}</p>
              {(selectedAnnouncement as any).file_attachment_url && <a href={(selectedAnnouncement as any).file_attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold"><FileText className="w-4 h-4" />{lang === 'EN' ? 'Open attachment' : 'ፋይሉን ክፈት'}</a>}
            </div>
          </div>
          <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0c]">
            <button onClick={() => { onNavigateTab('portal'); onClose(); }} className="w-full py-3 rounded-xl bg-[#d4ff00] text-black text-xs font-black uppercase tracking-wider">{lang === 'EN' ? 'Open News & Discussion' : 'ዜና እና ውይይት ክፈት'}</button>
          </div>
        </div>
      )}
    </div>
  );
};
