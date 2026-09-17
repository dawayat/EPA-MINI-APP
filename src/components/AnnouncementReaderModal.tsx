import React from 'react';
import { ExternalLink, FileText, X } from 'lucide-react';
import { Announcement } from '../types';

interface AnnouncementReaderModalProps {
  announcement: Announcement;
  lang: 'EN' | 'AM';
  onClose: () => void;
}

export const AnnouncementReaderModal: React.FC<AnnouncementReaderModalProps> = ({ announcement, lang, onClose }) => {
  const cover = announcement.cover_image_url || announcement.cover_photo_url;
  return (
    <div className="fixed inset-0 z-[55] bg-black/80 backdrop-blur-md flex items-center justify-center p-0 sm:p-5">
      <article className="w-full h-[100dvh] sm:h-auto sm:max-h-[calc(100dvh-2.5rem)] max-w-3xl rounded-none sm:rounded-3xl bg-gray-50 dark:bg-[#121214] border border-white/20 shadow-2xl overflow-hidden flex flex-col">
        <header className="shrink-0 flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0c]">
          <div className="min-w-0"><span className="inline-flex px-2.5 py-1 rounded-full bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] border border-[#d4ff00]/30 text-[10px] font-mono font-black uppercase">{announcement.category}</span><h2 className="mt-3 text-xl sm:text-2xl font-black font-syne uppercase leading-tight text-gray-900 dark:text-white">{lang === 'EN' ? announcement.title : announcement.amharic_title || announcement.title}</h2><p className="mt-2 text-[11px] font-mono text-neutral-500">{announcement.author} · {new Date(announcement.published_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p></div>
          <button onClick={onClose} className="shrink-0 p-2 rounded-xl text-neutral-500 hover:bg-black/5 dark:hover:bg-white/10" aria-label="Close announcement"><X className="w-5 h-5" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
          {cover && <img src={cover} alt="" className="mb-6 w-full max-h-96 object-cover rounded-2xl border border-gray-200 dark:border-white/10" />}
          <p className="whitespace-pre-wrap text-sm leading-7 text-neutral-700 dark:text-neutral-300">{announcement.content}</p>
          {announcement.file_attachment_url && <a href={announcement.file_attachment_url} target="_blank" rel="noopener noreferrer" className="mt-7 flex items-center justify-between gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-blue-700 dark:text-blue-300"><span className="flex items-center gap-2 text-xs font-black"><FileText className="w-4 h-4" />Open attached file</span><ExternalLink className="w-4 h-4" /></a>}
        </div>
      </article>
    </div>
  );
};
