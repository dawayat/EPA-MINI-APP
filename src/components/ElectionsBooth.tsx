import React from 'react';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import type { Member } from '../types';
import type { MemberSession } from '../lib/api';
import { GovernancePortal } from './GovernancePortal';

type Props = { activeMember?: Member; session: MemberSession | null; lang: 'EN' | 'AM'; onClose: () => void };
export function ElectionsBooth({ activeMember, session, lang, onClose }: Props) {
  return <div className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8"><button onClick={onClose} className="flex items-center gap-2 text-sm font-bold mb-6"><ArrowLeft size={16}/>{lang === 'AM' ? 'ወደ አባላት ገጽ ተመለስ' : 'Back to member portal'}</button>{activeMember && session ? <GovernancePortal member={activeMember} session={session} showEmpty/> : <div className="gov-card"><LockKeyhole size={25}/><h3>Member sign-in required</h3><p className="gov-description">Sign in to your member portal to view voting and nominations.</p></div>}</div>;
}
