import React, { useState } from 'react';
import {
  BookOpen, MessageCircle, ThumbsUp, Plus, Send, X,
  ChevronDown, ChevronUp, Tag, Calendar, User, UploadCloud, FileText, CheckCircle2
} from 'lucide-react';
import { ResearchArticle, Member, ResearchSubmission } from '../types';
import { uploadFile } from '../lib/api';

interface ResearchPortalProps {
  member: Member;
  articles: ResearchArticle[];
  lang: 'EN' | 'AM';
  onSubmitResearch: (submission: Partial<ResearchSubmission>) => Promise<void>;
  onAddComment: (articleId: string, comment: string) => void;
  onLikeArticle: (articleId: string) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const ResearchPortal: React.FC<ResearchPortalProps> = ({
  member,
  articles,
  lang,
  onSubmitResearch,
  onAddComment,
  onLikeArticle,
  onToast,
}) => {
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [newArticle, setNewArticle] = useState({
    title: '',
    abstract: '',
    keywords: '',
    publicationType: 'Research Paper' as ResearchSubmission['publication_type'],
    fileUrl: '',
    fileName: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePublish = async () => {
    if (!newArticle.title.trim() || !newArticle.abstract.trim() || !newArticle.fileUrl) {
      onToast('Title, abstract, and the publication file are required', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmitResearch({
        member_id: member.id,
        title: newArticle.title,
        abstract: newArticle.abstract,
        keywords: newArticle.keywords.split(',').map(k => k.trim()).filter(Boolean),
        publication_type: newArticle.publicationType,
        file_url: newArticle.fileUrl,
        file_name: newArticle.fileName
      });
      setShowPublishForm(false);
      setNewArticle({ title: '', abstract: '', keywords: '', publicationType: 'Research Paper', fileUrl: '', fileName: '' });
      onToast(lang === 'EN' ? 'Research submitted to the EPA review desk.' : 'ምርምርዎ ለEPA ግምገማ ቀርቧል።', 'success');
    } catch (error: any) {
      onToast(error.message || 'Could not submit your research.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = async (file?: File) => {
    if (!file) return;
    const allowed = /\.(pdf|doc|docx)$/i.test(file.name);
    if (!allowed) {
      onToast('Upload a PDF, DOC, or DOCX file.', 'error');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      onToast('Research files must be 3 MB or smaller.', 'error');
      return;
    }
    setIsUploading(true);
    try {
      const fileUrl = await uploadFile(file);
      setNewArticle(current => ({ ...current, fileUrl, fileName: file.name }));
    } catch {
      onToast('The research file could not be prepared.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleComment = (articleId: string) => {
    const text = commentInputs[articleId] || '';
    if (!text.trim()) return;
    onAddComment(articleId, text.trim());
    setCommentInputs(prev => ({ ...prev, [articleId]: '' }));
    onToast('Comment posted!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-green-700 dark:text-[#d4ff00]" />
            <h2 className="text-xl font-black text-gray-900 dark:text-white font-syne uppercase tracking-tight">
              {lang === 'EN' ? 'Research & Articles' : 'ምርምር እና ጽሑፎች'}
            </h2>
          </div>
          <p className="text-xs text-neutral-500">
            {lang === 'EN' ? 'Share and discover research findings from EPA members' : 'ከኢሳይባ አባላት የምርምር ስራዎችን ያዩ'}
          </p>
        </div>
        <button
          onClick={() => setShowPublishForm(!showPublishForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#d4ff00] hover:bg-[#c3eb00] text-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          {lang === 'EN' ? 'Submit Research' : 'ምርምር ያቅርቡ'}
        </button>
      </div>

      {/* Publish Form */}
      {showPublishForm && (
        <div className="bg-gray-50 dark:bg-[#121214] border border-[#d4ff00]/40 rounded-2xl p-6 animate-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">
              {lang === 'EN' ? 'Submit Research for Review' : 'ለግምገማ ምርምር ያቅርቡ'}
            </h3>
            <button onClick={() => setShowPublishForm(false)} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Title *</label>
              <input
                value={newArticle.title}
                onChange={e => setNewArticle(p => ({ ...p, title: e.target.value }))}
                placeholder="Title of your research or article"
                className="w-full bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-700 dark:focus:border-[#d4ff00]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Abstract *</label>
              <textarea
                value={newArticle.abstract}
                onChange={e => setNewArticle(p => ({ ...p, abstract: e.target.value }))}
                rows={3}
                placeholder="A brief summary of your research (150–250 words)"
                className="w-full bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-700 dark:focus:border-[#d4ff00] resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Publication type</label>
                <select value={newArticle.publicationType} onChange={e => setNewArticle(p => ({ ...p, publicationType: e.target.value as ResearchSubmission['publication_type'] }))} className="w-full bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-700 dark:focus:border-[#d4ff00]">
                  {['Research Paper', 'Journal Article', 'Case Study', 'Conference Paper', 'Other'].map(type => <option key={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Publication file *</label>
                <label className={`h-[46px] flex items-center gap-2 px-3 rounded-xl border cursor-pointer transition-colors ${newArticle.fileUrl ? 'border-[#d4ff00]/50 bg-[#d4ff00]/5 text-green-700 dark:text-[#d4ff00]' : 'border-dashed border-gray-300 dark:border-white/20 hover:border-[#d4ff00]/50 text-neutral-500'}`}>
                  {newArticle.fileUrl ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <UploadCloud className={`w-4 h-4 shrink-0 ${isUploading ? 'animate-bounce' : ''}`} />}
                  <span className="text-xs font-bold truncate">{isUploading ? 'Preparing file…' : newArticle.fileName || 'PDF, DOC, or DOCX (max 3 MB)'}</span>
                  <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" disabled={isUploading} onChange={e => handleFileChange(e.target.files?.[0])} />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Keywords (comma-separated)</label>
              <input
                value={newArticle.keywords}
                onChange={e => setNewArticle(p => ({ ...p, keywords: e.target.value }))}
                placeholder="e.g. CBT, trauma, adolescent, Ethiopia"
                className="w-full bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-700 dark:focus:border-[#d4ff00]"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowPublishForm(false)} className="px-5 py-2.5 text-xs font-bold text-neutral-500 hover:text-gray-900 dark:hover:text-white cursor-pointer">Cancel</button>
              <button onClick={handlePublish} disabled={isSubmitting || isUploading} className="px-6 py-2.5 rounded-xl bg-[#d4ff00] hover:bg-[#c3eb00] text-black text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg disabled:opacity-50">
                {isSubmitting ? 'Submitting…' : 'Submit for Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Articles List */}
      {articles.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
          <BookOpen className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-neutral-500">{lang === 'EN' ? 'No articles published yet.' : 'እስካሁን ምንም ጽሑፍ አልቀረበም።'}</p>
          <p className="text-xs text-neutral-400 mt-1">{lang === 'EN' ? 'Be the first to share your research!' : 'ጽሑፍዎን ለማካፈል ይቀዳሚ!'}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {articles.map(article => {
            const isExpanded = expandedArticle === article.id;
            return (
              <div key={article.id} className="bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden hover:border-gray-300 dark:hover:border-white/20 transition-colors">
                {/* Article Header */}
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-gray-900 dark:text-white text-base leading-tight mb-2 font-syne">
                        {article.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-neutral-500 font-mono mb-3">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {article.author_name}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(article.published_at).toLocaleDateString()}</span>
                        <span className="text-green-700 dark:text-[#d4ff00] font-bold">{article.author_membership_number}</span>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-3">
                        {article.abstract}
                      </p>
                      {article.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {article.keywords.map(k => (
                            <span key={k} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400">
                              <Tag className="w-2.5 h-2.5" />
                              {k}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                    <button
                      onClick={() => onLikeArticle(article.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-green-700 dark:hover:text-[#d4ff00] transition-colors cursor-pointer"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      {article.likes_count}
                    </button>
                    <button
                      onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {article.comments.length} {lang === 'EN' ? 'Comments' : 'አስተያየቶች'}
                    </button>
                    <button
                      onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                      className="ml-auto flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {isExpanded ? 'Collapse' : 'Read more'}
                    </button>
                  </div>
                </div>

                {/* Expanded: full content + comments */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-200 dark:border-white/10">
                    {article.content && (
                      <div className="py-5 text-sm text-gray-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap border-b border-gray-200 dark:border-white/10 mb-5">
                        {article.content}
                      </div>
                    )}

                    {/* Comments */}
                    <div className="space-y-3 mb-4">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                        {article.comments.length} {lang === 'EN' ? 'Comments' : 'አስተያየቶች'}
                      </h4>
                      {article.comments.map(c => (
                        <div key={c.id} className="bg-white dark:bg-[#0a0a0c] p-3.5 rounded-xl border border-gray-200 dark:border-white/10">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-green-700 dark:text-[#d4ff00]">{c.author_name}</span>
                            <span className="text-[9px] text-neutral-400 font-mono">{new Date(c.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-gray-700 dark:text-neutral-300">{c.content}</p>
                        </div>
                      ))}
                    </div>

                    {/* Add Comment */}
                    <div className="flex gap-2">
                      <input
                        value={commentInputs[article.id] || ''}
                        onChange={e => setCommentInputs(p => ({ ...p, [article.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleComment(article.id)}
                        placeholder={lang === 'EN' ? 'Write a comment...' : 'አስተያየት ይጻፉ...'}
                        className="flex-1 bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-700 dark:focus:border-[#d4ff00]"
                      />
                      <button
                        onClick={() => handleComment(article.id)}
                        className="p-2.5 rounded-xl bg-[#d4ff00] hover:bg-[#c3eb00] text-black cursor-pointer transition-all"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
