import React, { useState } from 'react';
import { 
  X, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  Camera, 
  GraduationCap, 
  UserCheck, 
  Building2, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { MembershipTypeCode, Application, University } from '../types';
import { MEMBERSHIP_TYPES } from '../data/mockData';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'EN' | 'AM';
  initialTier?: MembershipTypeCode;
  universities: University[];
  onSubmitApplication: (app: Partial<Application>) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  lang,
  initialTier = 'FULL',
  universities,
  onSubmitApplication,
  onToast,
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedTier, setSelectedTier] = useState<MembershipTypeCode>(initialTier);
  
  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    fatherName: '',
    grandfatherName: '',
    amharicName: '',
    gender: 'M' as 'M' | 'F',
    email: '',
    phone: '',
    dateOfBirth: '1998-05-15',
    city: 'Addis Ababa',
    
    // Academic & Professional
    universityName: universities[0]?.name || 'Addis Ababa University',
    degreeLevel: 'BSc',
    fieldOfStudy: 'Clinical Psychology',
    graduationYear: 2024,
    studentIdNumber: '',
    academicYear: 4,

    // Corporate
    orgName: '',
    tinNumber: '',

    // Payment Proof
    paymentProvider: 'Telebirr' as 'Telebirr' | 'CBE',
    transactionNumber: 'TB' + Math.floor(1000000000 + Math.random() * 9000000000),
    photoPreview: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedAppNumber, setCompletedAppNumber] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentTierObj = MEMBERSHIP_TYPES.find(t => t.code === selectedTier) || MEMBERSHIP_TYPES[1];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData(prev => ({ ...prev, photoPreview: event.target!.result as string }));
          onToast(lang === 'EN' ? 'Digital ID photo uploaded!' : 'የመታወቂያ ፎቶ ተጭኗል!', 'info');
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleFinalSubmit = () => {
    if (!formData.firstName || !formData.fatherName || !formData.phone || !formData.email) {
      onToast(lang === 'EN' ? 'Please complete all required fields.' : 'እባክዎን ሁሉንም አስፈላጊ መረጃዎች ይሙሉ::', 'error');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const generatedAppNum = `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const newApp: Partial<Application> = {
        application_number: generatedAppNum,
        first_name: formData.firstName,
        father_name: formData.fatherName,
        grandfather_name: formData.grandfatherName,
        amharic_full_name: formData.amharicName,
        gender: formData.gender,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth,
        city: formData.city,
        membership_type: selectedTier,
        status: 'SUBMITTED',
        photo_url: formData.photoPreview,
        submitted_at: new Date().toISOString(),
        payment: {
          id: 'pay-' + Date.now(),
          amount: currentTierObj.fee,
          currency: 'ETB',
          provider: formData.paymentProvider,
          transaction_number: formData.transactionNumber,
          payment_date: new Date().toISOString(),
          status: 'PENDING'
        },
        student_profile: selectedTier === 'STUDENT' ? {
          university_name: formData.universityName,
          field_of_study: formData.fieldOfStudy,
          academic_year: formData.academicYear,
          student_id_number: formData.studentIdNumber || 'UGR/5512/15',
          expected_graduation_year: 2026
        } : undefined,
        qualifications: selectedTier === 'FULL' ? [{
          degree_level: formData.degreeLevel,
          field: formData.fieldOfStudy,
          institution: formData.universityName,
          graduation_year: formData.graduationYear
        }] : undefined,
      };

      onSubmitApplication(newApp);
      setIsSubmitting(false);
      setCompletedAppNumber(generatedAppNum);
      setStep(5); // Success step
      onToast(lang === 'EN' ? 'Application submitted successfully!' : 'ማመልከቻዎ በተሳካ ሁኔታ ገብቷል!', 'success');
    }, 1200);
  };

  const stepsTitles = [
    lang === 'EN' ? 'Select Tier' : 'የአባልነት ዘርፍ',
    lang === 'EN' ? 'Personal Details' : 'የግል መረጃ',
    lang === 'EN' ? 'Accreditation & Education' : 'ትምህርትና ሙያ',
    lang === 'EN' ? 'Photo & Payment Proof' : 'ፎቶና ክፍያ',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-gray-50 dark:bg-[#121214] rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-gray-100 dark:bg-[#18181b]/70">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-green-700 dark:text-[#d4ff00]">
              {lang === 'EN' ? 'EPA Membership Portal' : 'የኢሳይባ አባልነት ማመልከቻ'}
            </span>
            <h2 className="text-xl font-black text-gray-900 dark:text-white font-syne uppercase tracking-wide mt-0.5">
              {lang === 'EN' ? 'Apply for Accreditation' : 'የሙያ ምዝገባ ማመልከቻ'}
            </h2>
          </div>

          <button
            id="close-registration-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-400 hover:text-gray-900 dark:text-white hover:bg-black/10 dark:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress bar (if not completed) */}
        {step <= 4 && (
          <div className="px-6 pt-4 pb-3 bg-gray-50 dark:bg-[#0d0d0f] border-b border-gray-100 dark:border-white/5">
            <div className="flex items-center justify-between">
              {stepsTitles.map((t, idx) => {
                const stepNum = idx + 1;
                const isPassed = step > stepNum;
                const isCurrent = step === stepNum;
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-black transition-all ${
                      isPassed 
                        ? 'bg-[#d4ff00] text-black' 
                        : isCurrent 
                        ? 'bg-white text-black ring-4 ring-white/20' 
                        : 'bg-black/10 dark:bg-white/10 text-stone-600 dark:text-stone-400 border border-gray-200 dark:border-white/10'
                    }`}>
                      {isPassed ? <Check className="w-3.5 h-3.5" /> : stepNum}
                    </div>
                    <span className={`text-[11px] font-mono uppercase tracking-wider hidden sm:inline ${
                      isCurrent ? 'text-gray-900 dark:text-white font-bold' : 'text-stone-600 dark:text-stone-500'
                    }`}>
                      {t}
                    </span>
                    {idx < stepsTitles.length - 1 && (
                      <div className="w-6 sm:w-12 h-0.5 bg-black/10 dark:bg-white/10 mx-1"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Scrollable Content Area */}
        <div className="p-6 overflow-y-auto flex-1 text-stone-700 dark:text-stone-200">
          
          {/* ════════ STEP 1: SELECT MEMBERSHIP TIER ════════ */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white font-syne uppercase">
                  {lang === 'EN' ? 'Choose Membership Classification' : 'የአባልነት ዘርፍዎን ይምረጡ'}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                  {lang === 'EN'
                    ? 'Fees are paid annually and include digital ID issuing, CPD point accreditation, and national registry listing.'
                    : 'ክፍያው በዓመት አንድ ጊዜ የሚፈጸም ሲሆን ዲጂታል መታወቂያንና የCPD ነጥቦችን ያካትታል።'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {MEMBERSHIP_TYPES.map((type) => {
                  const isSelected = selectedTier === type.code;
                  return (
                    <div
                      key={type.code}
                      id={`select-tier-opt-${type.code}`}
                      onClick={() => setSelectedTier(type.code)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'border-[#d4ff00] bg-[#d4ff00]/10 shadow-lg ring-1 ring-[#d4ff00]/30' 
                          : 'border-gray-200 dark:border-white/10 hover:border-white/20 bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          type.code === 'STUDENT' ? 'bg-[#d4ff00]/20 text-green-700 dark:text-[#d4ff00]' :
                          type.code === 'FULL' ? 'bg-black/10 dark:bg-white/10 text-gray-900 dark:text-white' :
                          'bg-amber-400/20 text-amber-300'
                        }`}>
                          {type.code === 'STUDENT' && <GraduationCap className="w-5 h-5" />}
                          {type.code === 'FULL' && <UserCheck className="w-5 h-5" />}
                          {type.code === 'CORPORATE' && <Building2 className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-900 dark:text-white font-syne">
                            {lang === 'EN' ? type.name : type.amharicName}
                          </div>
                          <div className="text-[11px] text-stone-600 dark:text-stone-400 line-clamp-1">
                            {lang === 'EN' ? type.description : type.amharicDescription}
                          </div>
                        </div>
                      </div>

                      <div className="text-right pl-3 shrink-0">
                        <div className="font-black text-base text-green-700 dark:text-[#d4ff00] font-mono">
                          {type.fee.toLocaleString()} {type.currency}
                        </div>
                        <div className="text-[10px] text-stone-600 dark:text-stone-400 font-mono">/ year</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════════ STEP 2: PERSONAL DETAILS ════════ */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white font-syne uppercase">
                  {lang === 'EN' ? 'Personal Information' : 'የግል መረጃዎን ያስገቡ'}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                  {lang === 'EN'
                    ? 'As it will appear on your official EPA accredited digital identification card.'
                    : 'በይፋዊው የኢሳይባ ዲጂታል መታወቂያ ላይ የሚታተም መረጃ።'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-stone-700 dark:text-stone-300 mb-1">
                    {lang === 'EN' ? 'First Name (English) *' : 'ስም (በእንግሊዝኛ) *'}
                  </label>
                  <input
                    id="input-reg-firstname"
                    type="text"
                    required
                    placeholder="e.g. Dawit"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#d4ff00] bg-gray-50 dark:bg-[#0c0c0e] text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-stone-700 dark:text-stone-300 mb-1">
                    {lang === 'EN' ? 'Father\'s Name *' : 'የአባት ስም *'}
                  </label>
                  <input
                    id="input-reg-fathername"
                    type="text"
                    required
                    placeholder="e.g. Mekonnen"
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#d4ff00] bg-gray-50 dark:bg-[#0c0c0e] text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-stone-700 dark:text-stone-300 mb-1">
                    {lang === 'EN' ? 'Grandfather\'s Name' : 'የአያት ስም'}
                  </label>
                  <input
                    id="input-reg-grandname"
                    type="text"
                    placeholder="e.g. Haile"
                    value={formData.grandfatherName}
                    onChange={(e) => setFormData({ ...formData, grandfatherName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#d4ff00] bg-gray-50 dark:bg-[#0c0c0e] text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-stone-700 dark:text-stone-300 mb-1">
                    {lang === 'EN' ? 'Full Name in Amharic' : 'ሙሉ ስም በአማርኛ'}
                  </label>
                  <input
                    id="input-reg-amharicname"
                    type="text"
                    placeholder="ለምሳሌ፡ ዶ/ር ዳዊት መኮንን"
                    value={formData.amharicName}
                    onChange={(e) => setFormData({ ...formData, amharicName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#d4ff00] bg-gray-50 dark:bg-[#0c0c0e] text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-stone-700 dark:text-stone-300 mb-1">
                    {lang === 'EN' ? 'Phone (Telebirr Registered) *' : 'ስልክ ቁጥር *'}
                  </label>
                  <input
                    id="input-reg-phone"
                    type="tel"
                    required
                    placeholder="+251 91 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#d4ff00] bg-gray-50 dark:bg-[#0c0c0e] text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-stone-700 dark:text-stone-300 mb-1">
                    {lang === 'EN' ? 'Email Address *' : 'ኢሜይል አድራሻ *'}
                  </label>
                  <input
                    id="input-reg-email"
                    type="email"
                    required
                    placeholder="psychologist@aau.edu.et"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#d4ff00] bg-gray-50 dark:bg-[#0c0c0e] text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-stone-700 dark:text-stone-300 mb-1">
                    {lang === 'EN' ? 'Primary City / Region *' : 'ከተማ / ክልል *'}
                  </label>
                  <select
                    id="select-reg-city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#d4ff00] bg-gray-50 dark:bg-[#0c0c0e] text-gray-900 dark:text-white"
                  >
                    <option value="Addis Ababa" className="bg-gray-50 dark:bg-[#121214]">Addis Ababa (አዲስ አበባ)</option>
                    <option value="Hawassa" className="bg-gray-50 dark:bg-[#121214]">Hawassa (ሀዋሳ)</option>
                    <option value="Bahir Dar" className="bg-gray-50 dark:bg-[#121214]">Bahir Dar (ባሕር ዳር)</option>
                    <option value="Jimma" className="bg-gray-50 dark:bg-[#121214]">Jimma (ጅማ)</option>
                    <option value="Gondar" className="bg-gray-50 dark:bg-[#121214]">Gondar (ጎንደር)</option>
                    <option value="Mekelle" className="bg-gray-50 dark:bg-[#121214]">Mekelle (መቀሌ)</option>
                    <option value="Adama" className="bg-gray-50 dark:bg-[#121214]">Adama (አዳማ / ናዝሬት)</option>
                    <option value="Dire Dawa" className="bg-gray-50 dark:bg-[#121214]">Dire Dawa (ድሬዳዋ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-stone-700 dark:text-stone-300 mb-1">
                    {lang === 'EN' ? 'Gender' : 'ጾታ'}
                  </label>
                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-stone-700 dark:text-stone-300">
                      <input
                        type="radio"
                        name="gender"
                        checked={formData.gender === 'M'}
                        onChange={() => setFormData({ ...formData, gender: 'M' })}
                        className="accent-[#d4ff00]"
                      />
                      <span>{lang === 'EN' ? 'Male (ወንድ)' : 'ወንድ'}</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-stone-700 dark:text-stone-300">
                      <input
                        type="radio"
                        name="gender"
                        checked={formData.gender === 'F'}
                        onChange={() => setFormData({ ...formData, gender: 'F' })}
                        className="accent-[#d4ff00]"
                      />
                      <span>{lang === 'EN' ? 'Female (ሴት)' : 'ሴት'}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════ STEP 3: ACCREDITATION & UNIVERSITY ════════ */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white font-syne uppercase">
                  {selectedTier === 'STUDENT'
                    ? (lang === 'EN' ? 'University Student Profile' : 'የዩኒቨርሲቲ ተማሪ መረጃ')
                    : (lang === 'EN' ? 'Academic Degree & Qualifications' : 'የትምህርት ደረጃና እውቅና')}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                  {lang === 'EN'
                    ? 'All academic credentials will be cross-referenced against Ministry of Education accredited programs.'
                    : 'የትምህርት ማስረጃዎች በትምህርት ሚኒስቴር እውቅና ከተሰጣቸው ተቋማት ጋር ይረጋገጣሉ።'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-stone-700 dark:text-stone-300 mb-1">
                    {lang === 'EN' ? 'Institution / University *' : 'ዩኒቨርሲቲ / ተቋም *'}
                  </label>
                  <select
                    id="select-reg-university"
                    value={formData.universityName}
                    onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#d4ff00] bg-gray-50 dark:bg-[#0c0c0e] text-gray-900 dark:text-white"
                  >
                    {universities.map(u => (
                      <option key={u.id} value={u.name} className="bg-gray-50 dark:bg-[#121214]">
                        {u.name} ({u.city})
                      </option>
                    ))}
                    <option value="Other Accredited Institution" className="bg-gray-50 dark:bg-[#121214]">Other MoE Accredited Institution</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase font-bold text-stone-700 dark:text-stone-300 mb-1">
                      {lang === 'EN' ? 'Field of Psychology Specialization *' : 'የስነ-ልቦና ትምህርት ዘርፍ *'}
                    </label>
                    <select
                      id="select-reg-specialization"
                      value={formData.fieldOfStudy}
                      onChange={(e) => setFormData({ ...formData, fieldOfStudy: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#d4ff00] bg-gray-50 dark:bg-[#0c0c0e] text-gray-900 dark:text-white"
                    >
                      <option value="Clinical Psychology" className="bg-gray-50 dark:bg-[#121214]">Clinical Psychology (ክሊኒካል ሳይኮሎጂ)</option>
                      <option value="Counseling Psychology" className="bg-gray-50 dark:bg-[#121214]">Counseling Psychology (የምክር ሳይኮሎጂ)</option>
                      <option value="Educational & Developmental" className="bg-gray-50 dark:bg-[#121214]">Educational & Developmental (የትምህርት ስነ-ልቦና)</option>
                      <option value="Neuropsychology" className="bg-gray-50 dark:bg-[#121214]">Neuropsychology (ኒውሮሳይኮሎጂ)</option>
                      <option value="Trauma & Health Psychology" className="bg-gray-50 dark:bg-[#121214]">Trauma & Community Health (የአደጋና ማህበረሰብ ስነ-ልቦና)</option>
                      <option value="Industrial & Organizational" className="bg-gray-50 dark:bg-[#121214]">Industrial & Organizational (የስራ ቦታና ድርጅት ስነ-ልቦና)</option>
                    </select>
                  </div>

                  {selectedTier === 'STUDENT' ? (
                    <div>
                      <label className="block text-xs font-mono uppercase font-bold text-stone-700 dark:text-stone-300 mb-1">
                        {lang === 'EN' ? 'Student ID Number *' : 'የተማሪ መታወቂያ ቁጥር *'}
                      </label>
                      <input
                        id="input-reg-studentid"
                        type="text"
                        placeholder="e.g. UGR/1234/15"
                        value={formData.studentIdNumber}
                        onChange={(e) => setFormData({ ...formData, studentIdNumber: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#d4ff00] bg-gray-50 dark:bg-[#0c0c0e] text-gray-900 dark:text-white font-mono"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-mono uppercase font-bold text-stone-700 dark:text-stone-300 mb-1">
                        {lang === 'EN' ? 'Degree Level *' : 'የትምህርት ደረጃ *'}
                      </label>
                      <select
                        id="select-reg-degree"
                        value={formData.degreeLevel}
                        onChange={(e) => setFormData({ ...formData, degreeLevel: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#d4ff00] bg-gray-50 dark:bg-[#0c0c0e] text-gray-900 dark:text-white"
                      >
                        <option value="PhD" className="bg-gray-50 dark:bg-[#121214]">PhD / Doctorate (የዶክትሬት ዲግሪ)</option>
                        <option value="MSc" className="bg-gray-50 dark:bg-[#121214]">MSc / MA / Master's (የማስተርስ ዲግሪ)</option>
                        <option value="BSc" className="bg-gray-50 dark:bg-[#121214]">BSc / BA / Bachelor's (የመጀመሪያ ዲግሪ)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════════ STEP 4: PHOTO & TELEBIRR / CBE PROOF ════════ */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="text-center mb-4">
                <h3 className="text-lg font-black text-gray-900 dark:text-white font-syne uppercase">
                  {lang === 'EN' ? 'ID Photo & Fee Payment Verification' : 'ፎቶ እና የክፍያ ማረጋገጫ'}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                  {lang === 'EN'
                    ? 'Upload your passport-size photo for the digital ID and enter your Telebirr / CBE payment reference.'
                    : 'ለመታወቂያ የሚሆን ፎቶ ይጫኑ እና የቴሌብር/ንግድ ባንክ ክፍያ ማረጋገጫ ቁጥር ያስገቡ።'}
                </p>
              </div>

              {/* Photo Upload Box */}
              <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-black/5 dark:bg-white/5 flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={formData.photoPreview}
                  alt="Preview"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-[#d4ff00] shadow-md bg-stone-100 dark:bg-stone-900"
                />
                <div className="flex-1 text-center sm:text-left">
                  <div className="font-bold text-xs text-gray-900 dark:text-white font-syne">
                    {lang === 'EN' ? 'Digital ID Passport Photo' : 'የመታወቂያ ፎቶግራፍ'}
                  </div>
                  <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">
                    {lang === 'EN' ? 'Clear front face photo with neutral background.' : 'ግልጽ የሆነ የፊት ፎቶ።'}
                  </p>
                  <label className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-xl bg-black/10 dark:bg-white/10 border border-gray-200 dark:border-white/15 text-gray-900 dark:text-white hover:bg-black/20 dark:hover:bg-white/20 text-xs font-mono font-bold cursor-pointer transition-colors">
                    <Camera className="w-3.5 h-3.5 text-green-700 dark:text-[#d4ff00]" />
                    <span>{lang === 'EN' ? 'Choose Image' : 'ፎቶ ምረጥ'}</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Payment details */}
              <div className="p-5 rounded-2xl border border-[#d4ff00]/30 bg-[#d4ff00]/5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10">
                  <span className="text-xs font-mono uppercase font-bold text-stone-700 dark:text-stone-300">
                    {lang === 'EN' ? 'Annual Membership Fee Due' : 'የሚከፈለው ዓመታዊ የአባልነት ክፍያ'}
                  </span>
                  <span className="font-black text-xl text-green-700 dark:text-[#d4ff00] font-mono">
                    {currentTierObj.fee.toLocaleString()} ETB
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase font-bold text-stone-700 dark:text-stone-300 mb-1">
                      {lang === 'EN' ? 'Payment Method' : 'የክፍያ ዘዴ'}
                    </label>
                    <select
                      id="select-reg-payprovider"
                      value={formData.paymentProvider}
                      onChange={(e) => setFormData({ ...formData, paymentProvider: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-mono font-semibold bg-gray-50 dark:bg-[#0c0c0e] text-gray-900 dark:text-white"
                    >
                      <option value="Telebirr" className="bg-gray-50 dark:bg-[#121214]">Telebirr (ቴሌብር 127889)</option>
                      <option value="CBE" className="bg-gray-50 dark:bg-[#121214]">CBE Birr / CBE Acc 10002991048</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase font-bold text-stone-700 dark:text-stone-300 mb-1">
                      {lang === 'EN' ? 'Transaction / Ref No. *' : 'የደረሰኝ / ትራንዛክሽን ቁጥር *'}
                    </label>
                    <input
                      id="input-reg-transaction"
                      type="text"
                      required
                      placeholder="e.g. TB9912048819"
                      value={formData.transactionNumber}
                      onChange={(e) => setFormData({ ...formData, transactionNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-mono font-bold bg-gray-50 dark:bg-[#0c0c0e] text-gray-900 dark:text-white focus:border-[#d4ff00] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-stone-600 dark:text-stone-400 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-green-700 dark:text-[#d4ff00] shrink-0 mt-0.5" />
                  <span>
                    {lang === 'EN'
                      ? 'EPA Finance team automatically validates transaction references within 24 hours of submission.'
                      : 'የማኅበሩ የሂሳብ ክፍል በ24 ሰዓታት ውስጥ ክፍያውን አረጋግጦ መታወቂያዎን ያረጋግጣል።'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ════════ STEP 5: SUCCESS CONFIRMATION ════════ */}
          {step === 5 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#d4ff00]/20 text-green-700 dark:text-[#d4ff00] flex items-center justify-center mx-auto border border-[#d4ff00]/40">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h3 className="text-2xl font-black text-gray-900 dark:text-white font-syne uppercase">
                {lang === 'EN' ? 'Application Successfully Submitted!' : 'ማመልከቻዎ በተሳካ ሁኔታ ገብቷል!'}
              </h3>

              <div className="p-4 bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl max-w-sm mx-auto">
                <div className="text-xs text-stone-600 dark:text-stone-400 uppercase font-mono font-semibold">
                  {lang === 'EN' ? 'Your Tracking Reference' : 'የማመልከቻ መለያ ቁጥር'}
                </div>
                <div className="text-2xl font-black text-green-700 dark:text-[#d4ff00] font-mono mt-1">
                  {completedAppNumber}
                </div>
                <div className="text-[11px] text-stone-600 dark:text-stone-400 mt-2 font-mono">
                  {lang === 'EN' 
                    ? 'Status: UNDER REVIEW • EPA Council' 
                    : 'ሁኔታ፡ በግምገማ ላይ'}
                </div>
              </div>

              <p className="text-xs text-stone-600 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
                {lang === 'EN'
                  ? 'Thank you for registering with the Ethiopian Psychologists’ Association. Your credentials have been routed to the Accreditation & Ethics Board.'
                  : 'የኢትዮጵያ ሳይኮሎጂ ባለሙያዎች ማኅበርን ስለተቀላቀሉ እናመሰግናለን። ሰነዶችዎ ለግምገማ ቀርበዋል።'}
              </p>

              <div className="pt-4">
                <button
                  id="btn-done-app"
                  onClick={onClose}
                  className="px-8 py-3 rounded-2xl bg-[#d4ff00] hover:bg-[#c2eb00] text-black text-xs font-black uppercase tracking-wider shadow-lg cursor-pointer transition-colors"
                >
                  {lang === 'EN' ? 'Return to Portal' : 'ወደ መነሻ ገጽ ተመለስ'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Buttons */}
        {step <= 4 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-[#18181b]/70 flex items-center justify-between">
            {step > 1 ? (
              <button
                id="btn-step-prev"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono uppercase font-bold text-stone-600 dark:text-stone-400 hover:text-gray-900 dark:text-white hover:bg-black/10 dark:bg-white/10 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{lang === 'EN' ? 'Back' : 'ተመለስ'}</span>
              </button>
            ) : (
              <div></div>
            )}

            {step < 4 ? (
              <button
                id="btn-step-next"
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#d4ff00] hover:bg-[#c2eb00] text-black text-xs font-black uppercase tracking-wider shadow-lg cursor-pointer transition-colors"
              >
                <span>{lang === 'EN' ? 'Continue' : 'ቀጣይ'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                id="btn-submit-registration"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#d4ff00] hover:bg-[#c2eb00] text-black text-xs font-black uppercase tracking-wider shadow-lg cursor-pointer disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <span>{lang === 'EN' ? 'Submitting Application...' : 'በማስገባት ላይ...'}</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-black" />
                    <span>{lang === 'EN' ? 'Submit Application' : 'ማመልከቻውን አስገባ'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
