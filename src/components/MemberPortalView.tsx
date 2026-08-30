import React, { useState, useEffect } from 'react';
import {
  Award, CreditCard, FileText, CheckCircle2, Calendar, Users, Vote,
  BookOpen, Clock, ExternalLink, Sparkles, ShieldCheck, Check, Download,
  Search, Heart, Bookmark, GraduationCap, Building2, Briefcase,
  Star, Bell, TrendingUp, AlertCircle, Plus, Shield, Edit3, ChevronRight,
  MessageSquare
} from 'lucide-react';
import {
  Announcement,
  AnnouncementComment,
  AnnouncementVoteChoice,
  AnnouncementVoteSummary,
  CPDCourse,
  Member,
  MemberMessage,
  ResearchArticle,
  ResearchSubmission
} from '../types';
import { ResearchPortal } from './ResearchPortal';
import {
  castAnnouncementVote,
  fetchAnnouncementComments,
  fetchAnnouncementVote,
  fetchAnnouncementVoteSummary,
  fetchMemberMessages,
  notifyCommunityUpdate,
  onCommunityUpdate,
  postAnnouncementComment,
  sendMemberMessage
} from '../lib/community';


interface MemberPortalViewProps {
  member: Member;
  lang: 'EN' | 'AM';
  cpdCourses: CPDCourse[];
  allMembers: Member[];
  announcements: Announcement[];
  onOpenIdCard: () => void;
  onOpenVoting: () => void;
  onOpenDirectory: () => void;
  onRegisterCPD: (courseId: string) => void;
  onSubmitResearch: (submission: Partial<ResearchSubmission>) => Promise<void>;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

// ── ANNOUNCEMENT CARD (shared across all portals) ───────────────────────────
interface AnnCardProps {
  member: Member;
  ann: Announcement;
  lang: 'EN' | 'AM';
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  likedAnn: Record<string, boolean>;
  setLikedAnn: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}
const AnnouncementCard: React.FC<AnnCardProps> = ({ member, ann, lang, onToast, likedAnn, setLikedAnn }) => {
  const [showComment, setShowComment] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<AnnouncementComment[]>([]);
  const [myVote, setMyVote] = useState<AnnouncementVoteChoice | null>(null);
  const [voteSummary, setVoteSummary] = useState<AnnouncementVoteSummary>({ total: 0, approve: 0, adjust: 0, voters: [] });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const [nextComments, nextVote, nextVoteSummary] = await Promise.all([
          fetchAnnouncementComments(ann.id),
          fetchAnnouncementVote(ann.id, member.id),
          fetchAnnouncementVoteSummary(ann.id)
        ]);
        if (active) {
          setComments(nextComments);
          setMyVote(nextVote);
          setVoteSummary(nextVoteSummary);
        }
      } catch (error) {
        console.error('[community] Unable to refresh announcement interactions:', error);
      }
    };
    refresh();
    const removeListener = onCommunityUpdate(refresh);
    const interval = window.setInterval(refresh, 5_000);
    return () => {
      active = false;
      removeListener();
      clearInterval(interval);
    };
  }, [ann.id, member.id]);

  const isVoting = Boolean(ann.is_draft) || ['election', 'vote', 'voting', 'draft'].includes(String(ann.category).toLowerCase());
  const coverImg = ann.cover_image_url || ann.cover_photo_url;

  const handleVote = async (choice: AnnouncementVoteChoice) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const { vote } = await castAnnouncementVote(ann.id, member.id, choice);
      setMyVote(vote.choice);
      setVoteSummary(current => {
        const existing = current.voters.find(voter => voter.member_id === member.id);
        const voters = existing
          ? current.voters.map(voter => voter.member_id === member.id ? { ...voter, choice: vote.choice } : voter)
          : [{ member_id: member.id, choice: vote.choice, name: `${member.first_name} ${member.father_name}`, photo_url: member.photo_url }, ...current.voters];
        const approve = voters.filter(voter => voter.choice === 'approve').length;
        return { total: voters.length, approve, adjust: voters.length - approve, voters };
      });
      notifyCommunityUpdate();
      onToast(lang === 'EN' ? `Vote saved: ${choice}` : `ድምጽ ተቀምጧል: ${choice}`, 'success');
    } catch (error: any) {
      onToast(error.message || 'Could not save your vote.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleComment = async () => {
    const content = commentText.trim();
    if (!content || isSaving) return;
    setIsSaving(true);
    try {
      const { comment } = await postAnnouncementComment(ann.id, member.id, content);
      setComments(current => [...current, comment]);
      setCommentText('');
      notifyCommunityUpdate();
      onToast(lang === 'EN' ? 'Comment posted.' : 'አስተያየት ተልኳል!', 'success');
    } catch (error: any) {
      onToast(error.message || 'Could not post your comment.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <article className="group rounded-2xl bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm hover:border-[#d4ff00]/40 hover:shadow-[0_12px_34px_rgba(0,0,0,0.08)] transition-all">
      {coverImg && <div className="relative"><img src={coverImg} alt={ann.title} className="w-full h-44 object-cover" /><div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" /></div>}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] border border-[#d4ff00]/20 uppercase">{ann.category}</span>
          <span className="text-[10px] text-neutral-500 font-mono shrink-0">{new Date(ann.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <h4 className="font-black text-[15px] text-gray-900 dark:text-white leading-snug group-hover:text-green-800 dark:group-hover:text-[#d4ff00] transition-colors">{lang === 'EN' ? ann.title : (ann.amharic_title || ann.title)}</h4>
        <p className="text-[12px] text-gray-600 dark:text-gray-400 mt-2.5 leading-relaxed line-clamp-4">{ann.content}</p>
        {ann.file_attachment_url && (
          <a href={ann.file_attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-[11px] text-blue-500 hover:underline font-bold">
            <FileText className="w-3.5 h-3.5" /> {lang === 'EN' ? 'Open Attachment' : 'ፋይል ክፈት'}
          </a>
        )}
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-200/80 dark:border-white/5">
          {isVoting ? (
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => handleVote('approve')} disabled={isSaving} className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase cursor-pointer flex items-center gap-1 transition-colors disabled:opacity-50 ${myVote === 'approve' ? 'bg-green-600 text-white' : 'bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400'}`}>
                ✓ Approve {myVote === 'approve' && '(Voted)'}
              </button>
              <button onClick={() => handleVote('adjust')} disabled={isSaving} className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase cursor-pointer flex items-center gap-1 transition-colors disabled:opacity-50 ${myVote === 'adjust' ? 'bg-amber-600 text-white' : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                ↺ Adjust {myVote === 'adjust' && '(Voted)'}
              </button>
              <button onClick={() => setShowComment(v => !v)} className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 text-[11px] font-black uppercase cursor-pointer flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> {comments.length} Comments
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button onClick={() => setLikedAnn(p => ({ ...p, [ann.id]: !p[ann.id] }))} className={`flex items-center gap-1.5 text-[11px] cursor-pointer transition-colors ${likedAnn[ann.id] ? 'text-red-400' : 'text-neutral-500 hover:text-red-400'}`}>
                <Heart className={`w-4 h-4 ${likedAnn[ann.id] ? 'fill-current' : ''}`} />
                <span>{ann.likes_count + (likedAnn[ann.id] ? 1 : 0)}</span>
              </button>
              <button onClick={() => setShowComment(v => !v)} className="flex items-center gap-1.5 text-[11px] text-neutral-500 hover:text-blue-400 cursor-pointer transition-colors">
                <MessageSquare className="w-4 h-4" /> {comments.length} Comments
              </button>
            </div>
          )}
        </div>
        {isVoting && (
          <div className="mt-3.5 rounded-xl bg-black/[0.025] dark:bg-white/[0.035] border border-gray-200/80 dark:border-white/10 px-3 py-2.5 flex flex-wrap items-center gap-3">
            <div className="flex -space-x-2">
              {voteSummary.voters.slice(0, 4).map(voter => (
                voter.photo_url ? <img key={voter.member_id} src={voter.photo_url} title={voter.name} alt={voter.name} className="w-6 h-6 rounded-full object-cover border-2 border-white dark:border-[#121214]" /> :
                <span key={voter.member_id} title={voter.name} className="w-6 h-6 rounded-full bg-[#d4ff00]/25 border-2 border-white dark:border-[#121214] flex items-center justify-center text-[8px] font-black text-gray-900 dark:text-[#d4ff00]">{voter.name.charAt(0)}</span>
              ))}
              {voteSummary.total > 4 && <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-white/15 border-2 border-white dark:border-[#121214] flex items-center justify-center text-[8px] font-black text-gray-700 dark:text-white">+{voteSummary.total - 4}</span>}
            </div>
            <span className="text-[10px] font-bold text-gray-700 dark:text-neutral-300">{voteSummary.total ? `${voteSummary.total} ${voteSummary.total === 1 ? 'member has' : 'members have'} voted` : 'Be the first to vote'}</span>
            {voteSummary.total > 0 && <span className="ml-auto text-[10px] font-mono text-neutral-500"><b className="text-green-700 dark:text-[#d4ff00]">{voteSummary.approve}</b> approve · <b className="text-amber-600 dark:text-amber-400">{voteSummary.adjust}</b> adjust</span>}
          </div>
        )}
        {showComment && (
          <div className="mt-4 pt-4 border-t border-gray-200/80 dark:border-white/5 space-y-4">
            {comments.length ? (
              <div className="space-y-3">
                {comments.map(comment => (
                  <div key={comment.id} className="flex items-start gap-2.5">
                    {comment.author_photo_url ? <img src={comment.author_photo_url} alt={comment.author_name} className="w-7 h-7 rounded-full object-cover border border-[#d4ff00]/40 shrink-0" /> : <div className="w-7 h-7 rounded-full bg-[#d4ff00]/20 flex items-center justify-center text-[9px] font-black text-gray-900 dark:text-[#d4ff00] shrink-0">{comment.author_name.charAt(0)}</div>}
                    <div className="flex-1 bg-white dark:bg-white/5 rounded-xl rounded-tl-sm p-2.5 border border-gray-100 dark:border-white/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-gray-900 dark:text-white">{comment.author_name}</span>
                        <span className="text-[9px] text-neutral-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[11px] text-neutral-700 dark:text-neutral-300">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-[11px] text-neutral-500">{lang === 'EN' ? 'No comments yet. Start the discussion.' : 'ገና አስተያየት የለም።'}</p>}
            <div className="flex gap-2 items-start mt-2">
              {member.photo_url ? <img src={member.photo_url} alt={member.first_name} className="w-7 h-7 rounded-full object-cover border border-[#d4ff00] shrink-0" /> : <div className="w-7 h-7 rounded-full bg-[#d4ff00] flex items-center justify-center text-[9px] font-black text-black shrink-0">{member.first_name.charAt(0)}</div>}
              <div className="flex-1">
                <textarea rows={2} value={commentText} onChange={e => setCommentText(e.target.value)} placeholder={lang === 'EN' ? 'Add a comment...' : 'አስተያየትዎን ይጻፉ...'} className="w-full p-2.5 rounded-xl text-xs border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d4ff00] resize-none" />
                <button onClick={handleComment} disabled={!commentText.trim() || isSaving} className="mt-2 px-4 py-1.5 rounded-lg bg-[#d4ff00] hover:bg-[#c3eb00] text-black text-[10px] font-black uppercase cursor-pointer active:scale-95 disabled:opacity-50">
                  {isSaving ? (lang === 'EN' ? 'Posting…' : 'በመላክ ላይ…') : (lang === 'EN' ? 'Post Comment' : 'አስገባ')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
};
// ── CONNECT & CHAT SECTION (students connect with full members & peers) ────────
interface ConnectProps {
  member: Member;
  lang: 'EN' | 'AM';
  allMembers: Member[];
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}
const ConnectChatSection: React.FC<ConnectProps> = ({ member, lang, allMembers, onToast }) => {
  const [chatPerson, setChatPerson] = useState<{ name: string; role: string; id: string } | null>(null);
  const [msgInput, setMsgInput] = useState('');
  const [allMessages, setAllMessages] = useState<MemberMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'mentors' | 'peers' | 'chat'>('mentors');

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const messages = await fetchMemberMessages(member.id);
        if (active) setAllMessages(messages);
      } catch (error) {
        console.error('[community] Unable to refresh messages:', error);
      }
    };
    refresh();
    const removeListener = onCommunityUpdate(refresh);
    const interval = window.setInterval(refresh, 3_000);
    return () => {
      active = false;
      removeListener();
      clearInterval(interval);
    };
  }, [member.id]);

  const mentors = (allMembers || []).filter(m => m.membership_type === 'FULL' && m.id !== member.id).map(m => ({
    id: m.id,
    name: m.first_name + ' ' + m.father_name,
    specialty: m.specialty || 'General Psychology',
    workplace: m.workplace || m.city || 'Private Practice',
    available: m.is_available_for_consultation ?? true,
    photo: m.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
  }));

  const peers = (allMembers || []).filter(m => m.membership_type === 'STUDENT' && m.id !== member.id).map(m => ({
    id: m.id,
    name: m.first_name + ' ' + m.father_name,
    year: m.student_profile?.academic_year ? `Year ${m.student_profile.academic_year}` : 'Student',
    university: m.student_profile?.university_name || 'Psychology Student',
    photo: m.photo_url || 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200'
  }));

  const openChat = (id: string, name: string, role: string) => {
    setChatPerson({ id, name, role });
    setActiveTab('chat');
  };

  const messages = chatPerson ? allMessages.filter(message =>
    (message.sender_id === member.id && message.recipient_id === chatPerson.id) ||
    (message.sender_id === chatPerson.id && message.recipient_id === member.id)
  ) : [];
  const conversationIds: string[] = [...new Set<string>(allMessages.map(message =>
    message.sender_id === member.id ? message.recipient_id : message.sender_id
  ))];

  const sendMessage = async () => {
    const content = msgInput.trim();
    if (!content || !chatPerson || isSending) return;
    setIsSending(true);
    try {
      const { message } = await sendMemberMessage(member.id, chatPerson.id, content);
      setAllMessages(current => [...current, message]);
      setMsgInput('');
      notifyCommunityUpdate();
    } catch (error: any) {
      onToast(error.message || 'Could not send your message.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-gray-100 dark:bg-[#0c0c0e] p-1 rounded-2xl overflow-x-auto no-scrollbar mb-4">
        {[
          { id: 'mentors', label: lang === 'EN' ? 'Mentors' : 'አማካሪዎች' },
          { id: 'peers', label: lang === 'EN' ? 'Peer Students' : 'የትምህርት ባልደረቦች' },
          { id: 'chat', label: lang === 'EN' ? 'Messages' : 'መልዕክቶች' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
              activeTab === t.id ? 'bg-[#d4ff00] text-black shadow-md' : 'text-gray-600 dark:text-neutral-400'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'mentors' && (
        <div className="space-y-3">
          <p className="text-xs text-neutral-500">{lang === 'EN' ? 'Connect with licensed full members for professional mentorship and guidance.' : 'ለሙያ ምክር ከሙሉ አባላት ጋር ይገናኙ።'}</p>
          {mentors.map((m, i) => (
            <div key={i} className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-4 flex items-center gap-4">
              <div className="relative shrink-0">
                <img src={m.photo} alt={m.name} className="w-14 h-14 rounded-2xl object-cover border border-gray-200 dark:border-white/10" />
                <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#121214] ${m.available ? 'bg-green-400' : 'bg-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-gray-900 dark:text-white truncate">{m.name}</p>
                <p className="text-xs text-green-700 dark:text-[#d4ff00] font-medium truncate">{m.specialty}</p>
                <p className="text-[11px] text-neutral-500 truncate">{m.workplace}</p>
              </div>
              <button onClick={() => openChat(m.id, m.name, m.specialty)}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-[#d4ff00] text-black text-[10px] font-black uppercase cursor-pointer active:scale-95">
                Chat
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'peers' && (
        <div className="space-y-3">
          <p className="text-xs text-neutral-500">{lang === 'EN' ? 'Connect and collaborate with fellow psychology students across Ethiopia.' : 'ከሌሎች ተማሪዎች ጋር ይተባበሩ።'}</p>
          {peers.map((p, i) => (
            <div key={i} className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-4 flex items-center gap-4">
              <img src={p.photo} alt={p.name} className="w-12 h-12 rounded-2xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-gray-900 dark:text-white">{p.name}</p>
                <p className="text-xs text-neutral-500">{p.year} • {p.university}</p>
              </div>
              <button onClick={() => openChat(p.id, p.name, 'Student')}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-black text-gray-900 dark:text-white cursor-pointer active:scale-95">
                Chat
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="flex flex-col h-[420px] bg-gray-50 dark:bg-[#0d0d0f] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
          {chatPerson ? (
            <>
              <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#121214]">
                <div className="w-8 h-8 rounded-full bg-[#d4ff00]/20 flex items-center justify-center text-sm font-black text-[#d4ff00]">{chatPerson.name[0]}</div>
                <div>
                  <p className="text-sm font-black text-gray-900 dark:text-white">{chatPerson.name}</p>
                  <p className="text-[10px] text-neutral-500">{chatPerson.role}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender_id === member.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.sender_id === member.id
                        ? 'bg-[#d4ff00] text-black rounded-br-sm'
                        : 'bg-white dark:bg-white/10 text-gray-900 dark:text-white rounded-bl-sm border border-gray-100 dark:border-white/10'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-gray-200 dark:border-white/10 flex gap-2">
                <input
                  type="text"
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder={lang === 'EN' ? 'Type a message...' : 'መልዕክት ይጻፉ...'}
                  className="flex-1 px-3 py-2 rounded-xl text-xs border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d4ff00]"
                />
                <button onClick={sendMessage} disabled={isSending || !msgInput.trim()}
                  className="px-4 py-2 rounded-xl bg-[#d4ff00] text-black text-xs font-black uppercase cursor-pointer active:scale-95 disabled:opacity-50">
                  {isSending ? '…' : 'Send'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-5 text-neutral-500">
              <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-bold">{lang === 'EN' ? 'No conversation selected' : 'ምንም ንግግር አልተመረጠም'}</p>
              <p className="text-xs mt-1">{lang === 'EN' ? 'Start a chat above or open an existing conversation.' : 'ከላይ ውይይት ይጀምሩ ወይም ያለ ውይይት ይክፈቱ።'}</p>
              {conversationIds.length > 0 && (
                <div className="mt-5 space-y-2 text-left">
                  {conversationIds.map(id => {
                    const other = allMembers.find(candidate => candidate.id === id);
                    if (!other) return null;
                    const name = `${other.first_name} ${other.father_name}`;
                    return <button key={id} onClick={() => openChat(id, name, other.specialty || other.membership_type)} className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-[#d4ff00]/50 text-xs font-bold text-gray-900 dark:text-white text-left">
                      <span className="block">{name}</span>
                      <span className="block text-[10px] mt-0.5 font-normal text-neutral-500">{other.specialty || other.membership_type}</span>
                    </button>;
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── STUDENT PORTAL ─────────────────────────────────────────────────────────────

const StudentPortal: React.FC<MemberPortalViewProps> = ({
  member, lang, allMembers, cpdCourses, announcements, onOpenIdCard, onOpenDirectory, onRegisterCPD, onToast
}) => {
  const [section, setSection] = useState<'overview' | 'cpd' | 'mentor' | 'jobs' | 'news'>('overview');
  const [likedAnn, setLikedAnn] = useState<Record<string, boolean>>({});

  const daysLeft = Math.ceil((new Date(member.expires_at).getTime() - Date.now()) / 86400000);
  const registeredCourses = cpdCourses.filter(c => c.registered);
  const availableCourses = cpdCourses.filter(c => !c.registered && !c.is_completed);

  const tabs = [
    { id: 'overview', label: lang === 'EN' ? 'Dashboard' : 'ዳሽቦርድ', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'cpd', label: lang === 'EN' ? 'Webinars' : 'ዌቢናሮች', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'mentor', label: lang === 'EN' ? 'Connect' : 'ተወዳደሩ', icon: <Users className="w-4 h-4" /> },
    { id: 'jobs', label: lang === 'EN' ? 'Jobs' : 'ስራ', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'news', label: lang === 'EN' ? 'News' : 'ዜና', icon: <Bell className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl mb-6 p-5 sm:p-6 shadow-[0_18px_45px_rgba(5,25,8,0.22)]"
        style={{ background: 'linear-gradient(135deg, #153a1a 0%, #0b1c0e 52%, #071109 100%)', border: '1px solid rgba(212,255,0,0.24)' }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 82% 12%, #d4ff00 0%, transparent 30%), radial-gradient(circle at 5% 105%, #49a85a 0%, transparent 35%)' }} />
        <div className="absolute right-[-32px] top-[-32px] w-40 h-40 rounded-full border-[18px] border-[#d4ff00]/[0.07]" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="relative shrink-0"><img src={member.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt={member.first_name} className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl object-cover border-2 border-[#d4ff00]/70 shadow-lg" /><span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#d4ff00] border-2 border-[#0b1c0e] flex items-center justify-center"><Check className="w-3 h-3 text-black" /></span></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#d4ff00] bg-[#d4ff00]/10 px-2 py-0.5 rounded-full border border-[#d4ff00]/20">
                {lang === 'EN' ? '● Student Member' : '● የተማሪ አባል'}
              </span>
              {member.is_verified && (
                <span className="text-[10px] font-mono font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {lang === 'EN' ? 'Verified' : 'ተረጋግጧል'}
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-white mt-1 uppercase">{member.first_name} {member.father_name}</h2>
            {member.amharic_full_name && <p className="text-[#d4ff00]/70 text-sm">{member.amharic_full_name}</p>}
            <p className="text-neutral-300 text-xs mt-1">{member.student_profile?.university_name || member.city || 'EPA Student Network'}{member.student_profile?.academic_year ? ` · Year ${member.student_profile.academic_year}` : ''}</p>
            <p className="text-neutral-500 text-[10px] font-mono mt-1">MEMBER ID · {member.membership_number}</p>
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-3 mt-5 pt-4 border-t border-white/10">
          {[
            { label: lang === 'EN' ? 'CPD Points' : 'CPD ነጥቦች', value: member.cpd_points, color: 'text-[#d4ff00]' },
            { label: lang === 'EN' ? 'Courses' : 'ኮርሶች', value: registeredCourses.length, color: 'text-white' },
            { label: lang === 'EN' ? 'Days Left' : 'ቀናት', value: `${daysLeft}d`, color: daysLeft < 60 ? 'text-amber-400' : 'text-white' },
          ].map((s, i) => (
            <div key={i} className="text-center rounded-xl bg-white/[0.045] border border-white/[0.07] py-2.5">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[9px] font-mono text-neutral-500 uppercase mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: <FileText className="w-5 h-5" />, label: lang === 'EN' ? 'Digital ID' : 'ዲጂታል ID', action: onOpenIdCard, color: 'text-[#d4ff00]' },
          { icon: <Search className="w-5 h-5" />, label: lang === 'EN' ? 'Find Mentor' : 'አማካሪ ፈልግ', action: () => setSection('mentor'), color: 'text-blue-400' },
          { icon: <BookOpen className="w-5 h-5" />, label: lang === 'EN' ? 'Webinars' : 'ዌቢናሮች', action: () => setSection('cpd'), color: 'text-purple-400' },
          { icon: <Briefcase className="w-5 h-5" />, label: lang === 'EN' ? 'Job Board' : 'የስራ ዝርዝር', action: () => setSection('jobs'), color: 'text-green-400' },
        ].map((item, i) => (
          <button key={i} onClick={item.action}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-white/10 hover:border-[#d4ff00]/40 transition-all active:scale-95 cursor-pointer group">
            <span className={`${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</span>
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-neutral-300 text-center leading-tight">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-[#0c0c0e] p-1 rounded-2xl mb-6 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setSection(tab.id as any)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer flex-1 justify-center ${
              section === tab.id ? 'bg-[#d4ff00] text-black shadow-md' : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
            }`}>
            {tab.icon}<span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {section === 'overview' && (
        <div className="space-y-4">
          {/* Announcements */}
          <div className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-green-700 dark:text-[#d4ff00]" />
              <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white">{lang === 'EN' ? 'Latest News' : 'ወቅታዊ ዜናዎች'}</h3>
            </div>
            <div className="space-y-4">
              {announcements.slice(0, 4).map(ann => (
                <AnnouncementCard key={ann.id} member={member} ann={ann} lang={lang} onToast={onToast} likedAnn={likedAnn} setLikedAnn={setLikedAnn} />
              ))}
            </div>
            <button 
              onClick={() => setSection('news' as any)}
              className="w-full mt-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              {lang === 'EN' ? 'View All News' : 'ሁሉንም ዜናዎች እይ'}
            </button>
          </div>

          {/* Upcoming webinars */}
          {availableCourses.length > 0 && (
            <div className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-700 dark:text-[#d4ff00]" />
                  <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white">{lang === 'EN' ? 'Upcoming Webinars' : 'መጪ ዌቢናሮች'}</h3>
                </div>
                <button onClick={() => setSection('cpd')} className="text-[11px] font-bold text-green-700 dark:text-[#d4ff00] cursor-pointer">{lang === 'EN' ? 'See all' : 'ሁሉም'}</button>
              </div>
              {availableCourses.slice(0, 2).map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 mb-2 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{c.title}</p>
                    <p className="text-[10px] text-neutral-500">{c.mode} • {c.points} CPD pts</p>
                  </div>
                  <button onClick={() => { onRegisterCPD(c.id); onToast(lang === 'EN' ? 'Registered!' : 'ተመዝግበዋል!', 'success'); }}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-[#d4ff00] text-black text-[10px] font-black uppercase cursor-pointer">
                    {lang === 'EN' ? 'Join' : 'ተሳተፍ'}
                  </button>
                </div>
              ))}
            </div>
          )}
        {/* Membership status */}
          <div className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-green-700 dark:text-[#d4ff00]" />
              <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white">{lang === 'EN' ? 'Membership Status' : 'የአባልነት ሁኔታ'}</h3>
            </div>
            {[
              { label: lang === 'EN' ? 'Membership No.' : 'የአባልነት ቁጥር', value: member.membership_number },
              { label: lang === 'EN' ? 'Valid Until' : 'ዋጋ ያለው እስከ', value: new Date(member.expires_at).toLocaleDateString() },
              { label: 'Status', value: member.status },
            ].map((r, i) => (
              <div key={i} className="flex justify-between text-xs py-1.5 border-b border-gray-100 dark:border-white/5 last:border-0">
                <span className="text-neutral-600 dark:text-neutral-400">{r.label}</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{r.value}</span>
              </div>
            ))}
            {daysLeft < 60 && (
              <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-600 dark:text-amber-400">{lang === 'EN' ? `Membership expires in ${daysLeft} days.` : `አባልነትዎ በ${daysLeft} ቀናት ያበቃል።`}</p>
              </div>
            )}
          </div>

          </div>
      )}

      {section === 'cpd' && (
        <div className="space-y-3">
          <p className="text-xs font-black uppercase text-neutral-600 dark:text-neutral-400 mb-2">{lang === 'EN' ? 'All Webinars & Workshops' : 'ሁሉም ዌቢናሮችና ወርክሾፖች'}</p>
          {cpdCourses.map(c => (
            <div key={c.id} className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                      c.is_completed ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' :
                      c.registered ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                      'bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] border-[#d4ff00]/20'
                    }`}>
                      {c.is_completed ? '✓ Done' : c.registered ? 'Registered' : c.mode}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-neutral-500">{c.points} CPD pts</span>
                  </div>
                  <h4 className="font-black text-sm text-gray-900 dark:text-white">{c.title}</h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">{c.instructor_title} {c.instructor}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-neutral-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(c.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.duration}</span>
                  </div>
                </div>
                {c.is_completed ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-1" /> :
                 !c.registered ? (
                  <button onClick={() => { onRegisterCPD(c.id); onToast(lang === 'EN' ? 'Registered!' : 'ተመዝግበዋል!', 'success'); }}
                    className="shrink-0 px-3 py-2 rounded-xl bg-[#d4ff00] text-black text-[10px] font-black uppercase cursor-pointer active:scale-95">
                    {lang === 'EN' ? 'Register' : 'ተመዝገብ'}
                  </button>
                ) : (
                  <span className="text-[10px] font-mono text-blue-500 dark:text-blue-400 shrink-0">✓ Enrolled</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {section === 'mentor' && (
        <ConnectChatSection member={member} lang={lang} allMembers={allMembers} onToast={onToast} />
      )}

      {section === 'jobs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white">{lang === 'EN' ? 'Jobs & Internships' : 'ስራ እና ልምምድ'}</h3>
              <p className="text-xs text-neutral-500 mt-0.5">{lang === 'EN' ? 'Graduate & internship opportunities in psychology across Ethiopia.' : 'የምሩቃን እና ልምምድ እድሎች'}</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 text-center">
            <Briefcase className="w-8 h-8 text-neutral-400 mb-3" />
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">{lang === 'EN' ? 'No active opportunities' : 'ምንም ክፍት የስራ ቦታዎች የሉም'}</h4>
            <p className="text-xs text-neutral-500 mt-1 max-w-xs">{lang === 'EN' ? 'Check back soon for new graduate and internship opportunities posted by EPA partner organizations.' : 'በቅርቡ አዳዲስ የስራ እድሎች ሲወጡ እዚህ ያገኛሉ።'}</p>
          </div>
        </div>
      )}

      {section === 'news' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-green-700 dark:text-[#d4ff00]" />
            <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white">{lang === 'EN' ? 'All News & Announcements' : 'ሁሉም ዜናዎች'}</h3>
          </div>
          <div className="space-y-4">
            {announcements.map(ann => (
              <AnnouncementCard key={ann.id} member={member} ann={ann} lang={lang} onToast={onToast}
                likedAnn={likedAnn} setLikedAnn={setLikedAnn} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};



// ── FULL MEMBER PORTAL ─────────────────────────────────────────────────────────
const FullMemberPortal: React.FC<MemberPortalViewProps> = ({
  member, lang, allMembers, cpdCourses, announcements, onOpenIdCard, onOpenVoting, onOpenDirectory, onRegisterCPD, onSubmitResearch, onToast
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'cpd' | 'announcements' | 'license' | 'research' | 'connect'>('overview');
  const [likedAnn, setLikedAnn] = useState<Record<string, boolean>>({});
  const [bookmarkedAnn, setBookmarkedAnn] = useState<Record<string, boolean>>({});
  const [draftVotes, setDraftVotes] = useState<Record<string, 'approve' | 'adjust' | null>>({});
  const [researchArticles, setResearchArticles] = useState<ResearchArticle[]>([]);

  const cpdTarget = 50;
  const cpdProgress = Math.min((member.cpd_points / cpdTarget) * 100, 100);
  const completedCourses = cpdCourses.filter(c => c.is_completed);

  const handleDownloadCert = () => onToast(lang === 'EN' ? 'EPA Membership Certificate downloaded (PDF)!' : 'የኢሳይባ አባልነት ሰርተፊኬት ወርዷል!', 'success');

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#080808] text-gray-900 dark:text-white">

      {/* ── PROFILE BANNER ── */}
      <div className="bg-gray-50 dark:bg-[#121214] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden mb-8 border border-gray-200 dark:border-white/10 grid-lines-bg">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4ff00]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img src={member.photo_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300'}
                alt={member.first_name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-[#d4ff00] shadow-lg bg-black" />
              <div className="absolute -bottom-1 -right-1 bg-[#d4ff00] text-black p-1 rounded-full border-2 border-black">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] border border-[#d4ff00]/30 text-[10px] font-mono font-black uppercase tracking-wider">
                  ● {member.status} ACCREDITED
                </span>
                <span className="text-xs text-neutral-600 dark:text-neutral-400 font-mono">{member.membership_number}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white uppercase">
                {member.first_name} {member.father_name} {member.grandfather_name || ''}
              </h1>
              {member.amharic_full_name && <p className="text-xs font-semibold text-green-700 dark:text-[#d4ff00]">{member.amharic_full_name}</p>}
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 flex items-center gap-2 font-mono">
                <span>{member.specialty}</span><span>•</span><span>{member.workplace}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button onClick={onOpenIdCard}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#d4ff00] hover:bg-[#c3eb00] text-black text-xs font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 cursor-pointer">
              <CreditCard className="w-4 h-4" />
              <span>{lang === 'EN' ? 'Digital ID Pass' : 'ዲጂታል መታወቂያ'}</span>
            </button>
            <button onClick={handleDownloadCert}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer">
              <Download className="w-4 h-4 text-green-700 dark:text-[#d4ff00]" />
              <span>{lang === 'EN' ? 'Certificate (PDF)' : 'ሰርተፊኬት (PDF)'}</span>
            </button>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { label: lang === 'EN' ? 'Annual CPD Score' : 'CPD ነጥቦች', value: `${member.cpd_points} / 50 PTS`, color: 'text-green-700 dark:text-[#d4ff00]' },
            { label: lang === 'EN' ? 'License Number' : 'የፈቃድ ቁጥር', value: member.license_number || 'LICENSED', color: 'text-gray-900 dark:text-white' },
            { label: lang === 'EN' ? 'Valid Until' : 'ያበቃበት ቀን', value: new Date(member.expires_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), color: 'text-gray-900 dark:text-white' },
            { label: lang === 'EN' ? 'Voting Rights' : 'መምረጥ መብት', value: '✓ Eligible', color: 'text-green-700 dark:text-[#d4ff00]' },
          ].map((s, i) => (
            <div key={i}>
              <span className="text-[10px] uppercase font-mono font-bold text-neutral-600 dark:text-neutral-400 block">{s.label}</span>
              <div className={`text-sm sm:text-base font-black mt-0.5 font-mono ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
        {/* CPD bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-mono font-bold text-neutral-600 dark:text-neutral-400">{lang === 'EN' ? 'Annual CPD Progress' : 'ዓመታዊ CPD ሂደት'}</span>
            <span className="font-mono font-bold text-green-700 dark:text-[#d4ff00]">{Math.round(cpdProgress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-[#d4ff00] transition-all duration-500" style={{ width: `${cpdProgress}%` }} />
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-white/10 mb-8 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: lang === 'EN' ? 'Dashboard Overview' : 'ዳሽቦርድ' },
          { id: 'connect', label: lang === 'EN' ? 'Connect & Chat' : 'ይገናኙ' },
          { id: 'cpd', label: lang === 'EN' ? 'CPD & Continuing Education' : 'CPD ማሻሻያ' },
          { id: 'research', label: lang === 'EN' ? 'Research & Articles' : 'ምርምር' },
          { id: 'announcements', label: lang === 'EN' ? 'News Feed' : 'ዜናዎች' },
          { id: 'license', label: lang === 'EN' ? 'License & Renewal' : 'ፈቃድ / ማደስ' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`pb-3 px-4 text-xs font-mono font-black uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === t.id ? 'border-[#d4ff00] text-green-700 dark:text-[#d4ff00]' : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">

          <div className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-green-700 dark:text-[#d4ff00]" />
                <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white">{lang === 'EN' ? 'Latest News' : 'ወቅታዊ ዜናዎች'}</h3>
              </div>
              <button onClick={() => setActiveTab('announcements')} className="text-[10px] font-black uppercase text-blue-500 hover:underline">
                {lang === 'EN' ? 'View All' : 'ሁሉንም እይ'}
              </button>
            </div>
            <div className="space-y-4">
              {announcements.slice(0, 4).map(ann => (
                <AnnouncementCard key={ann.id} member={member} ann={ann} lang={lang} onToast={onToast} likedAnn={likedAnn} setLikedAnn={setLikedAnn} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div onClick={onOpenVoting} className="bg-[#d4ff00] rounded-2xl p-6 text-black shadow-lg cursor-pointer hover:bg-[#c3eb00] transition-all hover:scale-[1.01]">
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 bg-black/10 rounded-xl"><Vote className="w-5 h-5 text-black" /></span>
                <span className="text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full bg-black text-[#d4ff00]">LIVE BALLOT</span>
              </div>
              <h4 className="font-black text-base uppercase tracking-tight">{lang === 'EN' ? 'EPA Executive Election 2026' : 'የስራ አስፈጻሚ ምርጫ 2026'}</h4>
              <p className="text-xs text-black/80 mt-1">{lang === 'EN' ? 'Cast your verified ballot for President & Board.' : 'ለፕሬዝዳንት እና ለስራ አስፈጻሚ አባላት ድምጽዎን ይስጡ።'}</p>
            </div>
            <div onClick={onOpenDirectory} className="bg-gray-50 dark:bg-[#121214] rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-md cursor-pointer hover:border-[#d4ff00]/30 transition-all hover:scale-[1.01]">
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 bg-black/5 dark:bg-white/5 text-green-700 dark:text-[#d4ff00] border border-gray-200 dark:border-white/10 rounded-xl"><Users className="w-5 h-5" /></span>
                <span className="text-[10px] font-mono font-bold text-neutral-500">1,280+ MEMBERS</span>
              </div>
              <h4 className="font-black text-base text-gray-900 dark:text-white uppercase tracking-tight">{lang === 'EN' ? 'Psychologist Directory' : 'የባለሙያዎች ማውጫ'}</h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">{lang === 'EN' ? 'Find colleagues, clinical supervisors, and referral partners.' : 'የስራ ባልደረቦችን እና ክሊኒኮችን ይፈልጉ።'}</p>
            </div>
            <div onClick={() => setActiveTab('cpd')} className="bg-gray-50 dark:bg-[#121214] rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-md cursor-pointer hover:border-[#d4ff00]/30 transition-all hover:scale-[1.01]">
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 bg-black/5 dark:bg-white/5 text-green-700 dark:text-[#d4ff00] border border-gray-200 dark:border-white/10 rounded-xl"><Award className="w-5 h-5" /></span>
                <span className="text-[10px] font-mono font-black text-green-700 dark:text-[#d4ff00]">{member.cpd_points}/50 PTS</span>
              </div>
              <h4 className="font-black text-base text-gray-900 dark:text-white uppercase tracking-tight">{lang === 'EN' ? 'CPD Progress Hub' : 'CPD ነጥቦች'}</h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">{lang === 'EN' ? 'Register for accredited workshops and earn points.' : 'ነጥቦቹን ያሟሉ።'}</p>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-[#121214] rounded-3xl p-6 sm:p-7 border border-gray-200 dark:border-white/10 shadow-md">
            <h3 className="text-base font-black text-gray-900 dark:text-white uppercase mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-700 dark:text-[#d4ff00]" />{lang === 'EN' ? 'Accreditation Dossier' : 'የሙያ መረጃ ማጠቃለያ'}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">{member.bio || 'Accredited member of the Ethiopian Psychologists\' Association in good standing.'}</p>
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {[
                { label: 'Registered Workplace', value: member.workplace },
                { label: 'Official Email', value: member.email },
                { label: 'City & Region', value: `${member.city}, Ethiopia` },
              ].map((r, i) => (
                <div key={i}>
                  <span className="text-neutral-500 font-mono font-bold block uppercase text-[10px]">{r.label}</span>
                  <span className="font-bold text-neutral-700 dark:text-neutral-200 mt-0.5 block font-mono">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Research & Articles Tab */}
      {activeTab === 'research' && (
        <ResearchPortal
          member={member}
          articles={researchArticles}
          lang={lang}
          onSubmitResearch={onSubmitResearch}
          onAddComment={(articleId, comment) => {
            setResearchArticles(prev => prev.map(a => a.id === articleId ? {
              ...a,
              comments: [...a.comments, {
                id: `c-${Date.now()}`,
                author_name: `${member.first_name} ${member.father_name}`,
                author_membership_number: member.membership_number,
                content: comment,
                created_at: new Date().toISOString()
              }]
            } : a));
          }}
          onLikeArticle={(articleId) => {
            setResearchArticles(prev => prev.map(a => a.id === articleId ? { ...a, likes_count: a.likes_count + 1 } : a));
          }}
          onToast={onToast}
        />
      )}

      {/* Connect Tab */}
      {activeTab === 'connect' && (
        <ConnectChatSection member={member} lang={lang} allMembers={allMembers} onToast={onToast} />
      )}

      {/* CPD Tab */}
      {activeTab === 'cpd' && (
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-black text-gray-900 dark:text-white uppercase text-sm">{lang === 'EN' ? 'Annual CPD Target: 50 Points' : 'ዓመታዊ CPD ግብ: 50 ነጥቦች'}</h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">{lang === 'EN' ? `${member.cpd_points} of 50 accredited points completed.` : `${member.cpd_points} ነጥቦች አጠናቅቀዋል።`}</p>
            </div>
            <div className="w-full sm:w-48">
              <div className="w-full h-3 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#d4ff00] rounded-full" style={{ width: `${cpdProgress}%` }} />
              </div>
              <span className="text-[10px] text-green-700 dark:text-[#d4ff00] font-bold font-mono mt-1 block text-right">{Math.round(cpdProgress)}% Complete</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cpdCourses.map(c => (
              <div key={c.id} className="bg-gray-50 dark:bg-[#121214] rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 border border-gray-200 dark:border-white/10 font-mono font-bold uppercase text-[10px]">{c.category}</span>
                    <span className="font-mono text-xs font-black text-green-700 dark:text-[#d4ff00] bg-[#d4ff00]/10 px-2 py-0.5 rounded-md border border-[#d4ff00]/30">+{c.points} CPD PTS</span>
                  </div>
                  <h4 className="font-black text-base text-gray-900 dark:text-white uppercase leading-snug">{c.title}</h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">Instructor: <span className="font-semibold text-neutral-700 dark:text-neutral-200">{c.instructor}</span> ({c.instructor_title})</p>
                  <div className="flex items-center gap-4 text-xs text-neutral-500 mt-3 pt-3 border-t border-gray-200 dark:border-white/10">
                    <span className="flex items-center gap-1 font-mono text-[11px]"><Calendar className="w-3.5 h-3.5" />{c.date}</span>
                    <span className="flex items-center gap-1 text-[11px] font-mono"><Clock className="w-3.5 h-3.5" />{c.duration}</span>
                  </div>
                </div>
                <div className="mt-5 pt-3 border-t border-gray-100 dark:border-white/5">
                  {c.is_completed ? (
                    <div className="flex items-center gap-1.5 text-green-700 dark:text-[#d4ff00] text-xs font-mono font-bold py-2">
                      <Check className="w-4 h-4" /><span>{lang === 'EN' ? 'Completed • Certificate Issued' : 'ተጠናቋል'}</span>
                    </div>
                  ) : c.registered ? (
                    <div className="flex items-center justify-between text-xs py-2 text-green-700 dark:text-[#d4ff00] font-mono font-bold">
                      <span>✓ {lang === 'EN' ? 'Registered (Zoom Link Sent)' : 'ተመዝግበዋል'}</span>
                      <button className="text-xs text-gray-900 dark:text-white underline font-semibold cursor-pointer">Join Session</button>
                    </div>
                  ) : (
                    <button onClick={() => onRegisterCPD(c.id)}
                      className="w-full py-3 rounded-xl bg-[#d4ff00] hover:bg-[#c3eb00] text-black text-xs font-black uppercase tracking-wider shadow-sm transition-colors cursor-pointer">
                      {lang === 'EN' ? 'Register for Workshop' : 'ለስልጠናው ይመዝገቡ'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {announcements.map(ann => (
            <AnnouncementCard key={ann.id} member={member} ann={ann} lang={lang} onToast={onToast} likedAnn={likedAnn} setLikedAnn={setLikedAnn} />
          ))}
        </div>
      )}

      {/* License & Renewal Tab */}
      {activeTab === 'license' && (
        <div className="space-y-4 max-w-lg">
          <div className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-6">
            <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-700 dark:text-[#d4ff00]" />{lang === 'EN' ? 'License & Renewal' : 'ፈቃድ / ማደስ'}
            </h3>
            {[
              { label: lang === 'EN' ? 'License No.' : 'የፈቃድ ቁጥር', value: member.license_number || 'Not yet assigned' },
              { label: lang === 'EN' ? 'Membership Status' : 'አባልነት ሁኔታ', value: member.status },
              { label: lang === 'EN' ? 'Expires On' : 'ያበቃል', value: new Date(member.expires_at).toLocaleDateString() },
              { label: lang === 'EN' ? 'Renewal Fee' : 'ማደሻ ክፍያ', value: 'ETB 1,500' },
              { label: lang === 'EN' ? 'CPD Requirement' : 'CPD ፍላጎት', value: `${member.cpd_points}/50 pts${cpdProgress >= 100 ? ' ✓ Met' : ' (in progress)'}` },
            ].map((r, i) => (
              <div key={i} className="flex justify-between py-2 text-xs border-b border-gray-100 dark:border-white/5 last:border-0">
                <span className="text-neutral-600 dark:text-neutral-400">{r.label}</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{r.value}</span>
              </div>
            ))}
            <button onClick={() => onToast(lang === 'EN' ? 'Renewal form opened. Complete payment.' : 'ማደሻ ሂደት ተጀምሯል።', 'info')}
              className="w-full mt-4 py-3 rounded-xl bg-[#d4ff00] text-black font-black uppercase tracking-wider text-sm cursor-pointer active:scale-95">
              {lang === 'EN' ? 'Renew Membership (ETB 1,500)' : 'አባልነት አድስ (ብር 1,500)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── CORPORATE PORTAL ───────────────────────────────────────────────────────────
const CorporatePortal: React.FC<MemberPortalViewProps> = ({
  member, lang, cpdCourses, announcements, onOpenDirectory, onRegisterCPD, onToast
}) => {
  const [section, setSection] = useState<'overview' | 'staff' | 'workshops' | 'jobs' | 'news'>('overview');
  const [likedAnn, setLikedAnn] = useState<Record<string, boolean>>({});
  const mockStaff = [
    { name: 'Meron Haile', role: 'Clinical Psychologist', status: 'Active' },
    { name: 'Abebe Tadesse', role: 'Counselor', status: 'Pending' },
    { name: 'Tigist Bekele', role: 'Researcher', status: 'Active' },
  ];
  const daysLeft = Math.ceil((new Date(member.expires_at).getTime() - Date.now()) / 86400000);
  const tabs = [
    { id: 'overview', label: lang === 'EN' ? 'Overview' : 'መነሻ', icon: <Building2 className="w-4 h-4" /> },
    { id: 'staff', label: lang === 'EN' ? 'Staff' : 'ሰራተኞች', icon: <Users className="w-4 h-4" /> },
    { id: 'workshops', label: lang === 'EN' ? 'Workshops' : 'ወርክሾፖች', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'jobs', label: lang === 'EN' ? 'Job Board' : 'ስራ', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'news', label: lang === 'EN' ? 'News' : 'ዜና', icon: <Bell className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Corp Header */}
      <div className="relative overflow-hidden rounded-3xl mb-6 p-6"
        style={{ background: 'linear-gradient(135deg, #1a1200 0%, #120d00 50%, #0a0900 100%)', border: '1px solid rgba(245,158,11,0.3)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 20%, #f59e0b 0%, transparent 50%)' }} />
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Building2 className="w-8 h-8 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                {lang === 'EN' ? 'Corporate Member' : 'ድርጅታዊ አባል'}
              </span>
              <span className="text-[10px] font-mono font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Accredited
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-1 uppercase">{member.corporate_profile?.organization_name || `${member.first_name} Org`}</h2>
            <p className="text-amber-300/70 text-sm">{member.corporate_profile?.org_type || 'Healthcare Institution'}</p>
            <p className="text-neutral-400 text-xs mt-0.5 font-mono">{member.membership_number}</p>
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/10">
          {[
            { label: lang === 'EN' ? 'Active Staff' : 'ሰራተኞች', value: mockStaff.filter(s => s.status === 'Active').length, color: 'text-amber-400' },
            { label: lang === 'EN' ? 'Workshops' : 'ወርክሾፖች', value: cpdCourses.filter(c => c.registered).length, color: 'text-white' },
            { label: lang === 'EN' ? 'Days Left' : 'ቀናት', value: `${daysLeft}d`, color: daysLeft < 60 ? 'text-red-400' : 'text-white' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[9px] font-mono text-neutral-500 uppercase mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: <Plus className="w-5 h-5" />, label: lang === 'EN' ? 'Add Staff' : 'ሰራተኛ ጨምር', action: () => setSection('staff'), color: 'text-amber-400' },
          { icon: <BookOpen className="w-5 h-5" />, label: lang === 'EN' ? 'Book Workshop' : 'ወርክሾፕ ያዝ', action: () => setSection('workshops'), color: 'text-blue-400' },
          { icon: <Briefcase className="w-5 h-5" />, label: lang === 'EN' ? 'Post Job' : 'ስራ ለቀቅ', action: () => setSection('jobs'), color: 'text-green-400' },
          { icon: <Search className="w-5 h-5" />, label: lang === 'EN' ? 'Find Psychologists' : 'ባለሙያ ፈልግ', action: onOpenDirectory, color: 'text-purple-400' },
        ].map((item, i) => (
          <button key={i} onClick={item.action}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-white/10 hover:border-amber-500/40 transition-all active:scale-95 cursor-pointer group">
            <span className={`${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</span>
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-neutral-300 text-center leading-tight">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-[#0c0c0e] p-1 rounded-2xl mb-6 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setSection(tab.id as any)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer flex-1 justify-center ${
              section === tab.id ? 'bg-[#d4ff00] text-black shadow-md' : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
            }`}>
            {tab.icon}<span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {section === 'overview' && (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-green-700 dark:text-[#d4ff00]" />
              <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white">{lang === 'EN' ? 'EPA News' : 'EPA ዜናዎች'}</h3>
            </div>
            <div className="space-y-3">
              {announcements.slice(0, 3).map(ann => (
                <AnnouncementCard key={ann.id} member={member} ann={ann} lang={lang} onToast={onToast} likedAnn={likedAnn} setLikedAnn={setLikedAnn} />
              ))}
            </div>
            {announcements.length > 3 && <button onClick={() => setSection('news')} className="w-full mt-4 py-2 rounded-xl text-xs font-black uppercase text-blue-500 hover:bg-blue-500/10">{lang === 'EN' ? 'View All News' : 'ሁሉንም ዜናዎች እይ'}</button>}
          </div>
          <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 rounded-2xl border border-amber-500/20 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-500/20 rounded-xl"><Shield className="w-5 h-5 text-amber-400" /></div>
              <div>
                <h3 className="font-black text-sm text-gray-900 dark:text-white">{lang === 'EN' ? 'EPA Accreditation Seal' : 'የEPA ማረጋገጫ ምልክት'}</h3>
                <p className="text-[11px] text-neutral-500">{lang === 'EN' ? 'Valid for official publications & documents' : 'ለይፋዊ ሰነዶች ዋጋ አለው'}</p>
              </div>
            </div>
            <button onClick={() => onToast(lang === 'EN' ? 'Accreditation badge downloaded!' : 'ምልክት ወርዷል!', 'success')}
              className="w-full py-2.5 rounded-xl border border-amber-500/30 text-amber-500 dark:text-amber-400 text-xs font-black uppercase tracking-wider cursor-pointer active:scale-95">
              {lang === 'EN' ? 'Download Accreditation Badge' : 'ማረጋገጫ ምልክት አውርድ'}
            </button>
          </div>
        </div>
      )}

      {section === 'staff' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-700 dark:text-neutral-300">{lang === 'EN' ? 'Registered Psychology Staff' : 'ሰራተኞች'}</p>
            <button onClick={() => onToast(lang === 'EN' ? 'Staff invitation sent!' : 'ጥሪ ተልኳል!', 'success')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d4ff00] text-black text-xs font-black cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> {lang === 'EN' ? 'Invite' : 'ጋብዝ'}
            </button>
          </div>
          {mockStaff.map((s, i) => (
            <div key={i} className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-neutral-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{s.name}</p>
                  <p className="text-xs text-neutral-500">{s.role}</p>
                </div>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                s.status === 'Active' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              }`}>{s.status}</span>
            </div>
          ))}
          <p className="text-xs text-center text-neutral-500">{lang === 'EN' ? 'Up to 5 staff included in corporate plan.' : 'እስከ 5 ሰራተኞች ይካተታሉ።'}</p>
        </div>
      )}

      {section === 'workshops' && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{lang === 'EN' ? 'Book certified EPA CPD workshops for your institution staff.' : 'ለሰራተኞቹ የEPA CPD ወርክሾፖችን ያስፈፅሙ።'}</p>
          {cpdCourses.slice(0, 4).map(c => (
            <div key={c.id} className="bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 p-5 flex items-start justify-between gap-3">
              <div className="flex-1">
                <h4 className="font-black text-sm text-gray-900 dark:text-white">{c.title}</h4>
                <p className="text-xs text-neutral-500 mt-0.5">{c.instructor} • {c.duration}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00] border border-[#d4ff00]/20">{c.mode}</span>
                  <span className="text-[10px] text-neutral-500">{c.points} CPD pts/person</span>
                </div>
              </div>
              <button onClick={() => { onRegisterCPD(c.id); onToast(lang === 'EN' ? 'Workshop booked!' : 'ወርክሾፕ ታቅዷል!', 'success'); }}
                className="shrink-0 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase cursor-pointer active:scale-95">
                {lang === 'EN' ? 'Book' : 'ያዝ'}
              </button>
            </div>
          ))}
        </div>
      )}

      {section === 'jobs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-700 dark:text-neutral-300">{lang === 'EN' ? 'Your Job Postings' : 'የስራ ማስታወቂያዎች'}</p>
            <button onClick={() => onToast(lang === 'EN' ? 'Job posting form opening...' : 'ቅጽ እየተከፈተ ነው...', 'info')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d4ff00] text-black text-xs font-black cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> {lang === 'EN' ? 'Post Job' : 'ስራ ለቀቅ'}
            </button>
          </div>
          <div className="text-center py-12 text-neutral-500">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{lang === 'EN' ? 'No active job postings.' : 'ንቁ ማስታወቂያዎች የሉም።'}</p>
            <p className="text-xs mt-1">{lang === 'EN' ? 'Post a job to reach accredited EPA psychologists.' : 'ሙያተኛ ለመፈለግ ስራ ይለቀቁ።'}</p>
          </div>
        </div>
      )}

      {section === 'news' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-green-700 dark:text-[#d4ff00]" />
            <h3 className="font-black text-sm uppercase text-gray-900 dark:text-white">{lang === 'EN' ? 'All News & Announcements' : 'ሁሉም ዜናዎች'}</h3>
          </div>
          <div className="space-y-3">
            {announcements.map(ann => (
              <AnnouncementCard key={ann.id} member={member} ann={ann} lang={lang} onToast={onToast} likedAnn={likedAnn} setLikedAnn={setLikedAnn} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};



// ── MAIN ROUTER ────────────────────────────────────────────────────────────────
export const MemberPortalView: React.FC<MemberPortalViewProps> = (props) => {
  if (props.member.membership_type === 'STUDENT') return <StudentPortal {...props} />;
  if (props.member.membership_type === 'CORPORATE') return <CorporatePortal {...props} />;
  return <FullMemberPortal {...props} />;
};
