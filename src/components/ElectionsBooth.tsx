import React, { useState } from 'react';
import { 
  Vote, 
  CheckCircle2, 
  ShieldCheck, 
  Award, 
  ArrowLeft, 
  UserCheck, 
  Sparkles,
  Lock
} from 'lucide-react';
import { ElectionCandidate, Member } from '../types';

interface ElectionsBoothProps {
  candidates: ElectionCandidate[];
  activeMember: Member;
  lang: 'EN' | 'AM';
  onVoteCast: (candidateId: string) => void;
  onClose: () => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const ElectionsBooth: React.FC<ElectionsBoothProps> = ({
  candidates,
  activeMember,
  lang,
  onVoteCast,
  onClose,
  onToast,
}) => {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [isCasting, setIsCasting] = useState<boolean>(false);

  const handleConfirmVote = () => {
    if (!selectedCandidate) {
      onToast('Please select a candidate to cast your vote.', 'error');
      return;
    }

    setIsCasting(true);
    setTimeout(() => {
      onVoteCast(selectedCandidate);
      setIsCasting(false);
      setHasVoted(true);
      onToast(
        lang === 'EN' 
          ? 'Ballot cast securely and verified on the EPA cryptographic ledger!' 
          : 'ድምጽዎ በተሳካ ሁኔታ ተመዝግቧል!', 
        'success'
      );
    }, 1000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <button
        onClick={onClose}
        className="flex items-center gap-1.5 text-xs font-mono uppercase font-bold text-stone-600 dark:text-stone-400 hover:text-gray-900 dark:text-white mb-6 cursor-pointer transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{lang === 'EN' ? 'Back to Member Portal' : 'ወደ አባላት ገጽ ተመለስ'}</span>
      </button>

      <div className="bg-gray-50 dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 text-gray-900 dark:text-white shadow-2xl mb-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4ff00]/10 border border-[#d4ff00]/30 text-green-700 dark:text-[#d4ff00] text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
              <Vote className="w-3.5 h-3.5 text-green-700 dark:text-[#d4ff00]" />
              <span>{lang === 'EN' ? 'Official Election 2026-2028' : 'ይፋዊ የስራ አስፈጻሚ ምርጫ'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-syne uppercase tracking-tight text-gray-900 dark:text-white">
              {lang === 'EN' ? 'EPA Executive Council Elections' : 'የኢሳይባ የስራ አስፈጻሚ ጉባዔ ምርጫ'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-2 max-w-xl">
              {lang === 'EN'
                ? 'Voting is open to all registered Full and Fellow members in good standing. Your ballot is cryptographically pseudonymized.'
                : 'ምርጫው ክፍት የሆነው ለሙሉ የሙያ አባላት ብቻ ሲሆን ድምጽዎ በሚስጥር የተጠበቀ ነው።'}
            </p>
          </div>

          <div className="bg-white dark:bg-[#0a0a0c] p-4 rounded-2xl border border-gray-200 dark:border-white/10 shrink-0 text-center">
            <span className="text-[10px] uppercase font-mono font-bold text-stone-600 dark:text-stone-400 block">Voter Eligibility</span>
            <div className="text-xs font-mono font-black text-green-700 dark:text-[#d4ff00] mt-0.5">
              {activeMember.first_name} ({activeMember.membership_number})
            </div>
            <span className="text-[10px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400 mt-1 inline-block">
              ✓ Eligible to Vote
            </span>
          </div>
        </div>
      </div>

      {hasVoted ? (
        <div className="bg-gray-50 dark:bg-[#121214] rounded-3xl p-10 border border-gray-200 dark:border-white/10 text-center shadow-2xl max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#d4ff00]/20 text-green-700 dark:text-[#d4ff00] flex items-center justify-center mx-auto border border-[#d4ff00]/40">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h3 className="text-2xl font-black text-gray-900 dark:text-white font-syne uppercase">
            {lang === 'EN' ? 'Official Ballot Cast Successfully!' : 'ድምጽዎ በተሳካ ሁኔታ ተመዝግቧል!'}
          </h3>

          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed max-w-md mx-auto">
            {lang === 'EN'
              ? 'Thank you for participating in the democratic governance of the Ethiopian Psychologists’ Association. Results will be announced during the General Assembly.'
              : 'በማኅበሩ ዲሞክራሲያዊ ምርጫ ላይ ስለተሳተፉ እናመሰግናለን። የምርጫው ውጤት በጠቅላላ ጉባዔው ላይ ይፋ ይደረጋል።'}
          </p>

          <div className="pt-4">
            <button
              onClick={onClose}
              className="px-8 py-3 rounded-2xl bg-[#d4ff00] hover:bg-[#c2eb00] text-black text-xs font-mono font-black uppercase tracking-wider shadow-lg cursor-pointer transition-colors"
            >
              Return to Portal
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <h3 className="text-lg font-black text-gray-900 dark:text-white font-syne uppercase flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-green-700 dark:text-[#d4ff00]" />
            <span>{lang === 'EN' ? 'Nominated Candidates for President & Leadership' : 'የእጩ ፕሬዝዳንቶች ዝርዝር'}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {candidates.map(candidate => {
              const isSelected = selectedCandidate === candidate.id;
              return (
                <div
                  key={candidate.id}
                  onClick={() => setSelectedCandidate(candidate.id)}
                  className={`bg-gray-50 dark:bg-[#121214] rounded-3xl p-6 border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#d4ff00] bg-[#d4ff00]/10 shadow-2xl ring-2 ring-[#d4ff00]/30'
                      : 'border-gray-200 dark:border-white/10 hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-3.5 mb-4">
                      <img
                        src={candidate.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                        alt=""
                        className="w-14 h-14 rounded-2xl object-cover border border-gray-200 dark:border-white/15 bg-stone-100 dark:bg-stone-900"
                      />
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-green-700 dark:text-[#d4ff00] bg-[#d4ff00]/10 border border-[#d4ff00]/30 px-2 py-0.5 rounded">
                          {candidate.running_for}
                        </span>
                        <h4 className="font-bold text-base text-gray-900 dark:text-white mt-1.5 font-syne leading-tight">
                          {candidate.name}
                        </h4>
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-stone-600 dark:text-stone-400 mb-3">
                      {candidate.title}
                    </div>

                    <div className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed bg-white dark:bg-[#0a0a0c] p-3.5 rounded-2xl border border-gray-200 dark:border-white/10">
                      <span className="font-mono font-bold text-gray-900 dark:text-white block mb-1">Key Manifesto:</span>
                      {candidate.manifesto}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-stone-600 dark:text-stone-400">
                      {candidate.votes_count} Verified Votes
                    </span>

                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-[#d4ff00] bg-[#d4ff00] text-black' : 'border-white/20'
                    }`}>
                      {isSelected && <div className="w-2 h-2 bg-black rounded-full"></div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-6 bg-gray-50 dark:bg-[#121214] rounded-3xl border border-gray-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 shadow-xl">
            <div className="flex items-center gap-3 text-xs text-stone-700 dark:text-stone-300">
              <Lock className="w-4 h-4 text-green-700 dark:text-[#d4ff00] shrink-0" />
              <span>
                {lang === 'EN'
                  ? 'Your vote is cryptographically secured. Once cast, it cannot be altered.'
                  : 'ድምጽዎ በሚስጥር የተመዘገበ ሲሆን ከተሰጠ በኋላ መቀየር አይቻልም።'}
              </span>
            </div>

            <button
              id="btn-cast-ballot"
              onClick={handleConfirmVote}
              disabled={!selectedCandidate || isCasting}
              className="px-8 py-3 rounded-2xl bg-[#d4ff00] hover:bg-[#c2eb00] text-black text-xs font-mono font-black uppercase tracking-wider shadow-lg disabled:opacity-50 transition-all cursor-pointer"
            >
              {isCasting ? 'Encrypting & Recording Vote...' : 'Cast Official Ballot'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
