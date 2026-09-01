import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Award, 
  ShieldCheck, 
  Mail, 
  Phone, 
  CheckCircle2, 
  Filter, 
  ExternalLink, 
  Building,
  UserCheck
} from 'lucide-react';
import { Member } from '../types';
import { memberPhotoUrl, useFallbackMemberPhoto } from '../lib/media';

interface PsychologistDirectoryProps {
  members: Member[];
  lang: 'EN' | 'AM';
  onVerifyMember: (token: string) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const PsychologistDirectory: React.FC<PsychologistDirectoryProps> = ({
  members,
  lang,
  onVerifyMember,
  onToast,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('ALL');
  const [selectedMembershipType, setSelectedMembershipType] = useState<'ALL' | 'FULL' | 'STUDENT' | 'CORPORATE'>('ALL');
  const [selectedMemberModal, setSelectedMemberModal] = useState<Member | null>(null);

  const cities = ['ALL', 'Addis Ababa', 'Hawassa', 'Bahir Dar', 'Jimma', 'Mekelle', 'Gondar'];
  const specialties = [
    'ALL', 
    'Clinical & Trauma Psychology', 
    'Educational & Developmental Psychology', 
    'Neuropsychology & Psychometrics', 
    'Child & Adolescent Counseling',
    'Industrial & Organizational Psychology'
  ];

  // This is a membership directory. Students are explicitly shown as student
  // members rather than being labelled with a professional specialty.
  const directoryMembers = members.filter(member => member.status === 'ACTIVE');
  const filtered = directoryMembers.filter(m => {
    const matchesCity = selectedCity === 'ALL' || m.city === selectedCity;
    const matchesType = selectedMembershipType === 'ALL' || m.membership_type === selectedMembershipType;
    const matchesSpec = selectedSpecialty === 'ALL' || m.membership_type === 'STUDENT' || (m.specialty || '').includes(selectedSpecialty);
    const searchString = `${m.first_name} ${m.father_name} ${m.specialty || ''} ${m.student_profile?.field_of_study || ''} ${m.workplace || ''} ${m.student_profile?.university_name || ''} ${m.city}`.toLowerCase();
    const matchesSearch = !searchQuery || searchString.includes(searchQuery.toLowerCase());
    return matchesCity && matchesType && matchesSpec && matchesSearch;
  });

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-green-700 dark:text-[#d4ff00] bg-[#d4ff00]/10 px-3 py-1 rounded-full border border-[#d4ff00]/30">
          {lang === 'EN' ? 'EPA Member Directory' : 'የEPA አባላት ማውጫ'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white font-syne uppercase tracking-tight mt-3">
          {lang === 'EN' ? 'Find EPA Members' : 'የEPA አባላትን ይፈልጉ'}
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-2">
          {lang === 'EN'
            ? 'Discover active EPA full, student, and corporate members by name, field, institution, or city.'
            : 'በአዲስ አበባ እና በክልል ከተሞች የሚገኙ የተመሰከረላቸውን የስነ-ልቦና ባለሙያዎች በቀላሉ ያግኙ።'}
        </p>
      </div>

      {/* Filter and Search Section */}
      <div className="bg-gray-50 dark:bg-[#121214] rounded-3xl p-5 border border-gray-200 dark:border-white/10 shadow-xl mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full flex-1">
            <Search className="w-4 h-4 text-stone-600 dark:text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={lang === 'EN' ? 'Search by member name, institution, or keyword...' : 'በስም ወይም በተቋም ይፈልጉ...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs sm:text-sm focus:outline-none focus:border-[#d4ff00] bg-gray-50 dark:bg-[#09090b] text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-mono font-semibold text-stone-700 dark:text-stone-300 bg-gray-50 dark:bg-[#09090b]"
            >
              {cities.map(c => (
                <option key={c} value={c} className="bg-gray-50 dark:bg-[#121214]">{c === 'ALL' ? 'All Cities (ሁሉም ከተሞች)' : c}</option>
              ))}
            </select>
            <select value={selectedMembershipType} onChange={(e) => setSelectedMembershipType(e.target.value as typeof selectedMembershipType)} className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-mono font-semibold text-stone-700 dark:text-stone-300 bg-gray-50 dark:bg-[#09090b]">
              <option value="ALL">All members</option><option value="FULL">Full members</option><option value="STUDENT">Student members</option><option value="CORPORATE">Corporate members</option>
            </select>
          </div>
        </div>

        {/* Specialty Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-[10px] font-mono font-bold uppercase text-stone-600 dark:text-stone-400 mr-1 shrink-0">Specialty:</span>
          {specialties.map(spec => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3 py-1 rounded-full whitespace-nowrap text-[11px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                selectedSpecialty === spec
                  ? 'bg-[#d4ff00] text-black font-black'
                  : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 text-stone-600 dark:text-stone-400 border border-gray-100 dark:border-white/5'
              }`}
            >
              {spec === 'ALL' ? 'All Disciplines' : spec}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(member => (
          <div
            key={member.id}
            className="bg-gray-50 dark:bg-[#121214] rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-lg hover:border-[#d4ff00]/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start gap-4 mb-4">
                <div className="relative">
                  <img
                    src={memberPhotoUrl(member.id)}
                    alt=""
                    loading="lazy"
                    onError={useFallbackMemberPhoto}
                    className="w-16 h-16 rounded-2xl object-cover border border-gray-200 dark:border-white/15 shadow-md bg-stone-100 dark:bg-stone-900"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-[#d4ff00] text-black p-0.5 rounded-full shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white truncate font-syne">
                      {member.first_name} {member.father_name}
                    </h3>
                  </div>
                  {member.amharic_full_name && (
                    <p className="text-xs font-semibold text-green-700 dark:text-[#d4ff00] truncate">
                      {member.amharic_full_name}
                    </p>
                  )}
                  <div className="text-[11px] font-mono text-stone-600 dark:text-stone-400 mt-0.5">
                    {member.membership_number}
                  </div>
                  <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase ${member.membership_type === 'STUDENT' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-300' : member.membership_type === 'CORPORATE' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300' : 'bg-[#d4ff00]/10 text-green-700 dark:text-[#d4ff00]'}`}>{member.membership_type === 'STUDENT' ? 'Student Member' : member.membership_type === 'CORPORATE' ? 'Corporate Member' : 'Full Professional Member'}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="font-semibold text-stone-700 dark:text-stone-200 flex items-start gap-1.5">
                  <Award className="w-3.5 h-3.5 text-green-700 dark:text-[#d4ff00] shrink-0 mt-0.5" />
                  <span>{member.membership_type === 'STUDENT' ? (member.student_profile?.field_of_study || 'Psychology student') : (member.specialty || 'Psychology')}</span>
                </div>

                <div className="text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-stone-600 dark:text-stone-500 shrink-0" />
                  <span className="truncate">{member.membership_type === 'STUDENT' ? (member.student_profile?.university_name || 'EPA student member') : (member.workplace || member.corporate_profile?.organization_name || 'EPA member')}</span>
                </div>

                <div className="text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-stone-600 dark:text-stone-500 shrink-0" />
                  <span>{member.city}, Ethiopia</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between gap-2">
              <button
                onClick={() => setSelectedMemberModal(member)}
                className="px-3.5 py-1.5 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-gray-900 dark:text-white text-xs font-mono font-bold transition-colors cursor-pointer border border-gray-200 dark:border-white/10"
              >
                View Profile
              </button>

              <button
                onClick={() => onVerifyMember(member.verification_token)}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#d4ff00] hover:bg-[#c2eb00] text-black text-xs font-mono font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-black" />
                <span>Verify Live</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Member Profile Quick Modal */}
      {selectedMemberModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gray-50 dark:bg-[#121214] rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-gray-200 dark:border-white/10">
            <div className="flex items-start gap-4">
              <img
                src={memberPhotoUrl(selectedMemberModal.id)}
                alt=""
                onError={useFallbackMemberPhoto}
                className="w-18 h-18 rounded-2xl object-cover border-2 border-[#d4ff00] shadow-md bg-stone-100 dark:bg-stone-900"
              />
              <div className="flex-1">
                <h3 className="font-black text-xl text-gray-900 dark:text-white font-syne uppercase">
                  {selectedMemberModal.first_name} {selectedMemberModal.father_name}
                </h3>
                <p className="text-xs font-semibold text-green-700 dark:text-[#d4ff00]">
                  {selectedMemberModal.amharic_full_name}
                </p>
                <div className="text-[11px] text-stone-600 dark:text-stone-400 font-mono mt-0.5">
                  ID: {selectedMemberModal.membership_number}
                </div>
              </div>
            </div>

            <div className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed bg-white dark:bg-[#0a0a0c] p-3.5 rounded-2xl border border-gray-200 dark:border-white/10">
              {selectedMemberModal.bio}
            </div>

            <div className="space-y-2 text-xs pt-2">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-white/5">
                <span className="text-stone-600 dark:text-stone-400 font-mono">{selectedMemberModal.membership_type === 'STUDENT' ? 'Programme:' : 'Professional Field:'}</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedMemberModal.membership_type === 'STUDENT' ? (selectedMemberModal.student_profile?.field_of_study || 'Psychology student') : (selectedMemberModal.specialty || 'Psychology')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-white/5">
                <span className="text-stone-600 dark:text-stone-400 font-mono">{selectedMemberModal.membership_type === 'STUDENT' ? 'University:' : 'Workplace / Institution:'}</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedMemberModal.membership_type === 'STUDENT' ? (selectedMemberModal.student_profile?.university_name || 'Not listed') : (selectedMemberModal.workplace || selectedMemberModal.corporate_profile?.organization_name || 'Not listed')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-white/5">
                <span className="text-stone-600 dark:text-stone-400 font-mono">EPA Membership:</span>
                <span className="font-mono font-bold text-green-700 dark:text-[#d4ff00]">Active {selectedMemberModal.membership_type === 'STUDENT' ? 'Student' : selectedMemberModal.membership_type === 'CORPORATE' ? 'Corporate' : 'Full'} Member</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone-600 dark:text-stone-400 font-mono">Email:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{selectedMemberModal.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3">
              <button
                onClick={() => setSelectedMemberModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-black/10 dark:bg-white/10 text-gray-900 dark:text-white text-xs font-mono uppercase font-bold hover:bg-black/20 dark:hover:bg-white/20 border border-gray-200 dark:border-white/10 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onToast(`Referral inquiry requested for ${selectedMemberModal.first_name}`, 'success');
                  setSelectedMemberModal(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#d4ff00] text-black text-xs font-mono font-black uppercase tracking-wider hover:bg-[#c2eb00] cursor-pointer"
              >
                Request Referral
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
