import React, { useState } from 'react';
import { 
  X, ChevronLeft, ChevronRight, CheckCircle, Upload, Plus, Trash2, 
  User, GraduationCap, Building2, UploadCloud, FileText, Check
} from 'lucide-react';
import { Application, MembershipTypeCode, University } from '../types';
import { uploadFile } from '../lib/api';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'am';
  initialTier?: MembershipTypeCode | null;
  universities?: University[];
  onSubmitApplication: (app: Partial<Application>) => Promise<void> | void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

const TIER_CARDS = [
  {
    code: 'STUDENT' as MembershipTypeCode,
    name: 'Student Member',
    fee: 'ETB 150',
    icon: <GraduationCap className="w-8 h-8" />,
    benefits: ['Access to digital library', 'Student networking events']
  },
  {
    code: 'FULL' as MembershipTypeCode,
    name: 'Full Member',
    fee: 'ETB 1,500',
    icon: <User className="w-8 h-8" />,
    benefits: ['Professional licensing support', 'Voting rights in EPA']
  },
  {
    code: 'CORPORATE' as MembershipTypeCode,
    name: 'Corporate Member',
    fee: 'ETB 10,000',
    icon: <Building2 className="w-8 h-8" />,
    benefits: ['Organization listing in directory', 'Job board postings']
  }
];

const CITIES = ['Addis Ababa', 'Hawassa', 'Jimma', 'Bahir Dar', 'Mekelle', 'Dire Dawa', 'Gondar', 'Other'];
const SPECIALTIES = ['Clinical Psychology', 'Counseling', 'Neuropsychology', 'Educational', 'Organizational/Industrial', 'Research', 'Child/Adolescent', 'Trauma', 'Other'];
const ORG_TYPES = ['Hospital', 'Clinic', 'NGO', 'University/College', 'Government Agency', 'Corporate Employer', 'Mental Health Center', 'Other'];
const FOCUS_AREAS = ['Workplace Mental Health', 'Clinical Services', 'Research', 'Training', 'Child Services', 'Crisis Intervention'];

// ---------------- UI COMPONENTS ---------------- //

const Input = ({ label, required = false, type = "text", ...props }: any) => (
  <div className="mb-4">
    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input 
      type={type}
      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-700 dark:focus:border-[#d4ff00] transition-all font-medium"
      {...props}
    />
  </div>
);

const Select = ({ label, options, required = false, ...props }: any) => (
  <div className="mb-4">
    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select 
      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-700 dark:focus:border-[#d4ff00] transition-all font-medium appearance-none"
      {...props}
    >
      <option value="" disabled>Select an option</option>
      {options.map((opt: any) => (
        <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
          {typeof opt === 'string' ? opt : opt.label}
        </option>
      ))}
    </select>
  </div>
);

const FileUpload = ({ label, hint, onChange }: any) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  
  return (
    <div className="mb-4">
      <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">{label}</label>
      <div 
        className={`border-2 border-dashed ${fileName ? 'border-green-500 dark:border-[#d4ff00]' : 'border-gray-300 dark:border-white/20'} bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer`}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              setIsUploading(true);
              setFileName(null);
              try {
                const url = await uploadFile(file);
                setFileName(file.name);
                onChange(url);
              } catch (err) {
                console.error('Upload failed', err);
              } finally {
                setIsUploading(false);
              }
            }
          }} 
        />
        <UploadCloud className={`w-8 h-8 ${isUploading ? 'animate-bounce text-green-700 dark:text-[#d4ff00]' : fileName ? 'text-green-600 dark:text-[#d4ff00]' : 'text-neutral-400 dark:text-neutral-500'} mb-2`} />
        {isUploading ? (
          <span className="text-sm text-gray-900 dark:text-white font-bold">Uploading...</span>
        ) : fileName ? (
          <>
            <span className="text-sm text-green-700 dark:text-[#d4ff00] font-bold">✓ File Selected</span>
            <span className="text-xs text-neutral-500 mt-1 break-all px-2">{fileName}</span>
            <span className="text-[10px] text-neutral-400 mt-1">Click to replace</span>
          </>
        ) : (
          <>
            <span className="text-sm text-gray-900 dark:text-white font-bold">Click to upload file</span>
            {hint && <span className="text-xs text-neutral-500 mt-1">{hint}</span>}
          </>
        )}
      </div>
    </div>
  );
};


export default function RegistrationModal({
  isOpen, onClose, lang, initialTier, universities = [], onSubmitApplication, onToast
}: RegistrationModalProps) {
  const [tier, setTier] = useState<MembershipTypeCode | null>(initialTier || null);
  // step 0 = tier selection, step 1+ = form steps
  const [step, setStep] = useState(initialTier ? 1 : 0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [appNumber, setAppNumber] = useState('');
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  // Sync state when modal opens with a specific tier
  React.useEffect(() => {
    if (isOpen) {
      setTier(initialTier || null);
      setStep(initialTier ? 1 : 0);
      setIsSuccess(false);
      setEmailVerificationSent(false);
      setEmailVerificationCode('');
      setShowEmailVerification(false);
    }
  }, [isOpen, initialTier]);

  const [formData, setFormData] = useState<any>({
    gender: 'M',
    city: 'Addis Ababa',
    qualifications: [{ degree_level: 'BSc', field: '', institution: '', graduation_year: new Date().getFullYear() }],
    student_profile: { academic_year: 1 },
    corporate_profile: { focus_areas: [] },
    payment: { provider: 'CBE' }
  });

  if (!isOpen) return null;

  // STUDENT: 4 form steps (personal, academic, photo, payment)
  // FULL: 5 form steps (personal, qualifications, professional, documents, ethics+payment)
  // CORPORATE: 4 form steps (org info, contact, services, docs+payment)
  const maxFormSteps = tier === 'FULL' ? 5 : 4;
  const isLastStep = step === maxFormSteps;

  const updateForm = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const updateNested = (parent: string, key: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [parent]: { ...prev[parent], [key]: value }
    }));
  };

  const handleNext = () => {
    if (step === 0) {
      if (!tier) return onToast('Please select a membership tier first.', 'error');
      return setStep(1);
    }
    setStep(s => s + 1);
  };

  const handlePrev = () => {
    setStep(s => Math.max(0, s - 1));
  };

  const applicantEmail = tier === 'CORPORATE' ? formData.corporate_profile?.contact_email : formData.email;
  const applicantName = tier === 'CORPORATE'
    ? (formData.corporate_profile?.organization_name || formData.corporate_profile?.contact_person || 'EPA applicant')
    : `${formData.first_name || ''} ${formData.father_name || ''}`.trim();

  const validateBeforeEmailVerification = () => {
    if (!applicantEmail || !String(applicantEmail).includes('@')) { onToast('Enter a valid email address before verification.', 'error'); return false; }
    if (!formData.phone_password || String(formData.phone_password).length < 8) { onToast('Create a password with at least 8 characters before verifying your email.', 'error'); return false; }
    if (formData.phone_password !== formData.phone_password_confirm) { onToast('Your password confirmation does not match.', 'error'); return false; }
    if (!formData.agreed_to_ethics) { onToast('You must agree to the EPA Code of Ethics before submitting.', 'error'); return false; }
    if (!formData.payment?.transaction_number || !formData.payment?.receipt_url) { onToast('Enter your CBE transaction reference and attach the payment receipt.', 'error'); return false; }
    return true;
  };

  const requestEmailVerification = async () => {
    if (!applicantEmail) {
      onToast('Please enter a valid email address before submitting.', 'error');
      return false;
    }
    setIsVerifyingEmail(true);
    try {
      const response = await fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send-verification', email: applicantEmail, name: applicantName }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not send the verification code.');
      setEmailVerificationSent(true);
      setShowEmailVerification(true);
      onToast('The verification email was sent. Check Inbox and Spam/Junk, then mark it “Not spam” if needed.', 'success');
      return true;
    } catch (error: any) {
      onToast(error.message || 'Could not send the verification code.', 'error');
      return false;
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleSubmit = async () => {
    if (!emailVerificationSent) {
      if (!validateBeforeEmailVerification()) return;
      await requestEmailVerification();
      return;
    }
    if (!emailVerificationCode.trim()) {
      onToast('Enter the six-digit code sent to your email.', 'error');
      return;
    }
    setIsVerifyingEmail(true);
    try {
      const verificationResponse = await fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify-email', email: applicantEmail, verificationCode: emailVerificationCode.trim() }) });
      const verification = await verificationResponse.json();
      if (!verificationResponse.ok || !verification.success) throw new Error(verification.error || 'Email verification failed.');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generatedAppNum = `EPA-${new Date().getFullYear()}-${randomNum}`;
    
    const corporateIdentity = tier === 'CORPORATE' ? {
      first_name: formData.corporate_profile?.organization_name || 'EPA Corporate',
      father_name: 'Organisation',
      email: applicantEmail,
      phone: formData.corporate_profile?.contact_phone || '',
      city: formData.corporate_profile?.headquarters_city || ''
    } : {};
    await onSubmitApplication({
      ...formData, ...corporateIdentity,
      membership_type: tier,
      application_number: generatedAppNum,
      id: `app-${Date.now()}`,
      status: 'SUBMITTED',
      submitted_at: new Date().toISOString(),
      email_verified: true
    });
    setAppNumber(generatedAppNum);
    setIsSuccess(true);
    } catch (error: any) {
      onToast(error.message || 'Could not verify your email. Please try again.', 'error');
    } finally {
      setIsVerifyingEmail(false);
    }
  };


  // ---------------- STEP RENDERERS ---------------- //

  const renderTierSelection = () => (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Select Membership Tier</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIER_CARDS.map(card => {
          const isSelected = tier === card.code;
          return (
            <div 
              key={card.code}
              onClick={() => {
                setTier(card.code);
                // Reset step to 1 when changing tiers to avoid invalid states
                setStep(1);
              }}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                isSelected 
                  ? 'border-green-700 dark:border-[#d4ff00] bg-green-50 dark:bg-[#d4ff00]/10' 
                  : 'border-gray-200 dark:border-white/10 hover:border-green-700/50 dark:hover:border-[#d4ff00]/50'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                isSelected ? 'bg-green-700 text-white dark:bg-[#d4ff00] dark:text-black' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'
              }`}>
                {card.icon}
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white text-lg">{card.name}</h4>
              <div className="text-green-700 dark:text-[#d4ff00] font-bold mt-1 mb-3">{card.fee}</div>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                {card.benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-700 dark:text-[#d4ff00] shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderPersonalInfoStep = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Personal Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="First Name" required value={formData.first_name || ''} onChange={(e: any) => updateForm('first_name', e.target.value)} />
        <Input label="Father's Name" required value={formData.father_name || ''} onChange={(e: any) => updateForm('father_name', e.target.value)} />
        <Input label="Grandfather's Name" value={formData.grandfather_name || ''} onChange={(e: any) => updateForm('grandfather_name', e.target.value)} />
        <Input label="Amharic Full Name" value={formData.amharic_full_name || ''} onChange={(e: any) => updateForm('amharic_full_name', e.target.value)} />
        
        <div className="mb-4">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">Gender <span className="text-red-500">*</span></label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-gray-900 dark:text-white font-medium text-sm">
              <input type="radio" name="gender" value="M" checked={formData.gender === 'M'} onChange={() => updateForm('gender', 'M')} className="accent-green-700 dark:accent-[#d4ff00]" />
              Male
            </label>
            <label className="flex items-center gap-2 text-gray-900 dark:text-white font-medium text-sm">
              <input type="radio" name="gender" value="F" checked={formData.gender === 'F'} onChange={() => updateForm('gender', 'F')} className="accent-green-700 dark:accent-[#d4ff00]" />
              Female
            </label>
          </div>
        </div>
        
        <Input label="Date of Birth" type="date" required value={formData.date_of_birth || ''} onChange={(e: any) => updateForm('date_of_birth', e.target.value)} />
        <Input label="Email Address" type="email" required value={formData.email || ''} onChange={(e: any) => updateForm('email', e.target.value)} />
        <Input label="Phone Number" type="tel" required value={formData.phone || ''} onChange={(e: any) => updateForm('phone', e.target.value)} />
        <Select label="City" options={CITIES} required value={formData.city} onChange={(e: any) => updateForm('city', e.target.value)} />
        {tier !== 'STUDENT' && (
          <Input label="National ID, Passport, or Kebele ID Number" required value={formData.national_id_number || ''} onChange={(e: any) => updateForm('national_id_number', e.target.value)} />
        )}
      </div>
    </div>
  );

  const renderStudentStep2 = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Academic Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">University *</label>
          <input 
            list="universities-list"
            className="w-full bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-700 dark:focus:ring-[#d4ff00]"
            value={formData.student_profile?.university_name || ''}
            onChange={(e) => updateNested('student_profile', 'university_name', e.target.value)}
            placeholder="Search university..."
          />
          <datalist id="universities-list">
            {universities.map(u => <option key={u.id} value={u.name} />)}
          </datalist>
        </div>
        
        <Input label="Field of Study" required value={formData.student_profile?.field_of_study || ''} onChange={(e: any) => updateNested('student_profile', 'field_of_study', e.target.value)} />
        <Select label="Current Academic Year" options={['1', '2', '3', '4', '5', '6']} required value={formData.student_profile?.academic_year || '1'} onChange={(e: any) => updateNested('student_profile', 'academic_year', parseInt(e.target.value))} />
        <Input label="Student ID Number" required value={formData.student_profile?.student_id_number || ''} onChange={(e: any) => updateNested('student_profile', 'student_id_number', e.target.value)} />
        <Input label="Expected Graduation Year" type="number" required value={formData.student_profile?.expected_graduation_year || ''} onChange={(e: any) => updateNested('student_profile', 'expected_graduation_year', parseInt(e.target.value))} />
      </div>
      <FileUpload label="Upload Student ID Photo *" hint="JPEG, PNG up to 5MB" onChange={(url: string) => updateNested('student_profile', 'student_id_url', url)} />
      {formData.student_profile?.student_id_url && <div className="text-sm text-green-600 dark:text-[#d4ff00]">✓ Document uploaded</div>}
    </div>
  );

  const renderStudentStep3 = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Profile Photo & Social</h3>
      
      <div className="flex flex-col items-center justify-center mb-2">
        <div className="w-32 h-32 rounded-full border-4 border-gray-100 dark:border-white/10 overflow-hidden mb-4 bg-gray-50 dark:bg-white/5 flex items-center justify-center">
          {formData.photo_url ? (
            <img src={formData.photo_url} alt="Profile preview" className="w-full h-full object-cover" />
          ) : (
            <User className="w-12 h-12 text-gray-400" />
          )}
        </div>
        {formData.photo_url && <p className="text-xs text-green-600 dark:text-[#d4ff00] font-bold mb-2">✓ Photo uploaded</p>}
      </div>

      <FileUpload
        label="Profile Photo *"
        hint="JPEG or PNG, clear face photo"
        onChange={(url: string) => updateForm('photo_url', url)}
      />

      <Input label="Telegram Username (Optional)" placeholder="@username" value={formData.telegram_username || ''} onChange={(e: any) => updateForm('telegram_username', e.target.value)} />
    </div>
  );


  const renderPaymentStep = (fee: string) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Payment & Review</h3>
      
      <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
        <h4 className="font-bold text-gray-900 dark:text-white mb-2">Registration Fee</h4>
        <div className="text-3xl font-black text-green-700 dark:text-[#d4ff00]">{fee}</div>
        <p className="text-sm text-gray-500 mt-1">Non-refundable application processing fee.</p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Payment Method</label>
        <div className="p-4 rounded-xl border-2 border-green-700 dark:border-[#d4ff00] bg-green-50 dark:bg-[#d4ff00]/10 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-700 rounded-full flex items-center justify-center text-white font-bold text-xs">CBE</div>
          <div><span className="font-bold text-gray-900 dark:text-white block">Commercial Bank of Ethiopia (CBE)</span><span className="text-xs text-neutral-500">CBE is the only accepted registration payment method.</span></div>
        </div>

        <Input label="Transaction Reference Number *" value={formData.payment?.transaction_number || ''} onChange={(e: any) => updateNested('payment', 'transaction_number', e.target.value)} />
        <FileUpload label="Upload Payment Receipt *" hint="Screenshot of successful transfer" onChange={(url: string) => updateNested('payment', 'receipt_url', url)} />
        {formData.payment?.receipt_url && <div className="text-sm text-green-600 dark:text-[#d4ff00]">✓ Receipt uploaded</div>}
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/20 p-4 rounded-xl mt-2">
        <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-1 text-sm flex items-center gap-2">
          🔐 Create Your Login Password
        </h4>
        <p className="text-xs text-blue-700 dark:text-blue-400 mb-3 leading-relaxed">
          Set a password to log in with your phone number if Telegram auto-login doesn't work.
        </p>
        <Input 
          label="Password *" 
          type="password" 
          required 
          placeholder="Min. 6 characters"
          value={formData.phone_password || ''} 
          onChange={(e: any) => updateForm('phone_password', e.target.value)} 
        />
        <Input 
          label="Confirm Password *" 
          type="password" 
          required 
          placeholder="Re-enter password"
          value={formData.phone_password_confirm || ''} 
          onChange={(e: any) => updateForm('phone_password_confirm', e.target.value)} 
        />
      </div>

      <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
        <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-green-700 dark:text-[#d4ff00]" />EPA Code of Ethics</h4>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">EPA members commit to ethical practice, confidentiality, respect, and professional integrity. Agreement is mandatory for every membership type.</p>
        <label className="flex items-start gap-3 cursor-pointer"><input type="checkbox" required className="mt-1 w-4 h-4 accent-green-700 dark:accent-[#d4ff00]" checked={formData.agreed_to_ethics || false} onChange={(e) => updateForm('agreed_to_ethics', e.target.checked)} /><span className="text-sm font-medium text-gray-900 dark:text-white">I have read and agree to the EPA Code of Ethics *</span></label>
      </div>

      <div className="bg-gray-100 dark:bg-[#080808] p-4 rounded-xl mt-6">
        <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-700 dark:text-[#d4ff00]" /> 
          Ready to Submit
        </h4>
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          By submitting this application, you confirm that all provided information is accurate. False information may result in rejection of your application.
        </p>
      </div>
    </div>
  );


  // Full Member Flow Steps - step 1 is now renderPersonalInfoStep()
  const renderFullStep1_unused = () => (
    <div className="space-y-4">
      {renderTierSelection()}
      {tier === 'FULL' && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="First Name" required value={formData.first_name || ''} onChange={(e: any) => updateForm('first_name', e.target.value)} />
            <Input label="Father's Name" required value={formData.father_name || ''} onChange={(e: any) => updateForm('father_name', e.target.value)} />
            <Input label="Grandfather's Name" value={formData.grandfather_name || ''} onChange={(e: any) => updateForm('grandfather_name', e.target.value)} />
            <Input label="Amharic Full Name" value={formData.amharic_full_name || ''} onChange={(e: any) => updateForm('amharic_full_name', e.target.value)} />
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Gender *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <input type="radio" name="gender" value="M" checked={formData.gender === 'M'} onChange={() => updateForm('gender', 'M')} className="accent-green-700 dark:accent-[#d4ff00]" />
                  Male
                </label>
                <label className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <input type="radio" name="gender" value="F" checked={formData.gender === 'F'} onChange={() => updateForm('gender', 'F')} className="accent-green-700 dark:accent-[#d4ff00]" />
                  Female
                </label>
              </div>
            </div>
            
            <Input label="Date of Birth" type="date" required value={formData.date_of_birth || ''} onChange={(e: any) => updateForm('date_of_birth', e.target.value)} />
            <Input label="Email Address" type="email" required value={formData.email || ''} onChange={(e: any) => updateForm('email', e.target.value)} />
            <Input label="Phone Number" type="tel" required value={formData.phone || ''} onChange={(e: any) => updateForm('phone', e.target.value)} />
            <Select label="City" options={CITIES} required value={formData.city} onChange={(e: any) => updateForm('city', e.target.value)} />
            <Input label="National ID Number" required value={formData.national_id_number || ''} onChange={(e: any) => updateForm('national_id_number', e.target.value)} />
          </div>
        </div>
      )}
    </div>
  );

  const renderFullStep2 = () => {
    const quals = formData.qualifications || [];
    
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Educational Qualifications</h3>
          {quals.length < 3 && (
            <button 
              onClick={() => updateForm('qualifications', [...quals, { degree_level: 'BSc', field: '', institution: '', graduation_year: new Date().getFullYear() }])}
              className="text-sm flex items-center gap-1 text-green-700 dark:text-[#d4ff00] font-medium"
            >
              <Plus className="w-4 h-4" /> Add Degree
            </button>
          )}
        </div>
        
        {quals.map((q: any, i: number) => (
          <div key={i} className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10 mb-4 relative">
            {quals.length > 1 && (
              <button 
                onClick={() => updateForm('qualifications', quals.filter((_: any, index: number) => index !== i))}
                className="absolute top-4 right-4 text-red-500 hover:text-red-600"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">Degree {i + 1}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Level" options={['BSc', 'BA', 'MSc', 'MA', 'PhD', 'Other']} required value={q.degree_level} onChange={(e: any) => {
                const newQ = [...quals]; newQ[i].degree_level = e.target.value; updateForm('qualifications', newQ);
              }} />
              <Input label="Field of Study" required value={q.field} onChange={(e: any) => {
                const newQ = [...quals]; newQ[i].field = e.target.value; updateForm('qualifications', newQ);
              }} />
              <Input label="Institution Name" required value={q.institution} onChange={(e: any) => {
                const newQ = [...quals]; newQ[i].institution = e.target.value; updateForm('qualifications', newQ);
              }} />
              <Input label="Graduation Year" type="number" required value={q.graduation_year} onChange={(e: any) => {
                const newQ = [...quals]; newQ[i].graduation_year = parseInt(e.target.value); updateForm('qualifications', newQ);
              }} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderFullStep3 = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Professional Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Current Workplace" required value={formData.current_workplace || ''} onChange={(e: any) => updateForm('current_workplace', e.target.value)} />
        <div className="mb-4">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Primary Specialty <span className="text-red-500">*</span></label>
          <input list="epa-specialties" value={formData.current_specialty || ''} onChange={(e: any) => updateForm('current_specialty', e.target.value)} placeholder="Choose from the list or write your specialty"
            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-700 dark:focus:border-[#d4ff00]" />
          <datalist id="epa-specialties">{SPECIALTIES.map(specialty => <option key={specialty} value={specialty} />)}</datalist>
          <p className="mt-1 text-[10px] text-neutral-500">You may select a suggested specialty or type your own.</p>
        </div>
        <Input label="Years of Experience" type="number" required value={formData.years_of_experience || ''} onChange={(e: any) => updateForm('years_of_experience', parseInt(e.target.value))} />
        <Input label="Existing License Number (Optional)" value={formData.license_number || ''} onChange={(e: any) => updateForm('license_number', e.target.value)} />
      </div>
    </div>
  );

  const renderFullStep4 = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Upload Documents</h3>
      <FileUpload label="Degree Certificate or Proof of Qualification *" hint="Upload a degree certificate, transcript, temporary graduation letter, or other proof of your psychology qualification" onChange={(url: string) => updateForm('degree_certificate_url', url)} />
      {formData.degree_certificate_url && <div className="text-sm text-green-600 dark:text-[#d4ff00] mb-4">✓ Degree uploaded</div>}
      
      <FileUpload label="National ID, Passport, or Kebele ID *" hint="Clear photo of a valid National ID, Passport, or Kebele ID" onChange={(url: string) => updateForm('id_document_url', url)} />
      {formData.id_document_url && <div className="text-sm text-green-600 dark:text-[#d4ff00] mb-4">✓ ID uploaded</div>}
      
      <div className="flex flex-col items-center mb-2">
        <div className="w-24 h-24 rounded-full border-4 border-gray-100 dark:border-white/10 overflow-hidden bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-2">
          {formData.photo_url ? (
            <img src={formData.photo_url} alt="Profile preview" className="w-full h-full object-cover" />
          ) : (
            <User className="w-8 h-8 text-gray-400" />
          )}
        </div>
        {formData.photo_url && <span className="text-xs text-green-600 dark:text-[#d4ff00] font-bold">✓ Photo uploaded</span>}
      </div>
      <FileUpload label="Profile Photo (Optional)" hint="Clear professional headshot" onChange={(url: string) => updateForm('photo_url', url)} />
    </div>
  );


  const renderFullStep5 = () => <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">{renderPaymentStep('ETB 1,500')}</div>;

  // Corporate registration starts with the organisation itself, not personal information.
  const renderCorporateStep1 = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Organization Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Organization Name" required value={formData.corporate_profile?.organization_name || ''} onChange={(e: any) => updateNested('corporate_profile', 'organization_name', e.target.value)} />
        <Select label="Organization Type" options={ORG_TYPES} required value={formData.corporate_profile?.org_type || ''} onChange={(e: any) => updateNested('corporate_profile', 'org_type', e.target.value)} />
        <Input label="TIN Number" required value={formData.corporate_profile?.tin_number || ''} onChange={(e: any) => updateNested('corporate_profile', 'tin_number', e.target.value)} />
        <Select label="Headquarters City" options={CITIES} required value={formData.corporate_profile?.headquarters_city || ''} onChange={(e: any) => updateNested('corporate_profile', 'headquarters_city', e.target.value)} />
        <div className="col-span-1 md:col-span-2">
          <Input label="Website URL (Optional)" type="url" placeholder="https://" value={formData.corporate_profile?.website || ''} onChange={(e: any) => updateNested('corporate_profile', 'website', e.target.value)} />
        </div>
      </div>
    </div>
  );

  const renderCorporateStep2 = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Contact Person Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Full Name" required value={formData.corporate_profile?.contact_person || ''} onChange={(e: any) => updateNested('corporate_profile', 'contact_person', e.target.value)} />
        <Input label="Title/Position" required value={formData.corporate_profile?.contact_title || ''} onChange={(e: any) => updateNested('corporate_profile', 'contact_title', e.target.value)} />
        <Input label="Email Address" type="email" required value={formData.corporate_profile?.contact_email || ''} onChange={(e: any) => updateNested('corporate_profile', 'contact_email', e.target.value)} />
        <Input label="Phone Number" type="tel" required value={formData.corporate_profile?.contact_phone || ''} onChange={(e: any) => updateNested('corporate_profile', 'contact_phone', e.target.value)} />
      </div>
    </div>
  );

  const renderCorporateStep3 = () => {
    const selectedAreas = formData.corporate_profile?.focus_areas || [];
    
    const toggleArea = (area: string) => {
      const newAreas = selectedAreas.includes(area) 
        ? selectedAreas.filter((a: string) => a !== area)
        : [...selectedAreas, area];
      updateNested('corporate_profile', 'focus_areas', newAreas);
    };

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Mental Health Services</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Description of Programs/Services *</label>
          <textarea 
            rows={4}
            className="w-full bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-700 dark:focus:ring-[#d4ff00]"
            value={formData.corporate_profile?.services_description || ''}
            onChange={(e) => updateNested('corporate_profile', 'services_description', e.target.value)}
          />
        </div>
        
        <Input label="Number of Psychology Staff Employed" type="number" required value={formData.corporate_profile?.staff_count || ''} onChange={(e: any) => updateNested('corporate_profile', 'staff_count', parseInt(e.target.value))} />
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Focus Areas *</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {FOCUS_AREAS.map(area => (
              <label key={area} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-white/10 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 accent-green-700 dark:accent-[#d4ff00]" 
                  checked={selectedAreas.includes(area)}
                  onChange={() => toggleArea(area)}
                />
                <span className="text-sm text-gray-900 dark:text-white">{area}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCorporateStep4 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Documents & Payment</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <FileUpload label="Commercial Reg. Certificate *" onChange={(url: string) => updateNested('corporate_profile', 'registration_cert_url', url)} />
          {formData.corporate_profile?.registration_cert_url && <div className="text-sm text-green-600 dark:text-[#d4ff00]">✓ Uploaded</div>}
        </div>
        <div>
          <FileUpload label="TIN Certificate *" onChange={(url: string) => updateForm('tin_cert_url', url)} />
          {formData.tin_cert_url && <div className="text-sm text-green-600 dark:text-[#d4ff00]">✓ Uploaded</div>}
        </div>
      </div>
      
      <FileUpload label="Organization Logo (Optional)" hint="Square image preferred" onChange={(url: string) => updateNested('corporate_profile', 'logo_url', url)} />
      {formData.corporate_profile?.logo_url && <div className="text-sm text-green-600 dark:text-[#d4ff00] mb-4">✓ Logo uploaded</div>}

      {renderPaymentStep('ETB 10,000')}
    </div>
  );

  // ---------------- MAIN RENDER ---------------- //

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-[#080808] flex flex-col items-center justify-center p-6 animate-in fade-in">
        <div className="w-full max-w-md bg-gray-50 dark:bg-[#121214] p-8 rounded-3xl border border-gray-200 dark:border-white/10 text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-[#d4ff00]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-700 dark:text-[#d4ff00]" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Application Submitted!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your application has been received and is currently under review.
          </p>
          <div className="bg-white dark:bg-black/50 p-4 rounded-xl border border-gray-200 dark:border-white/10 mb-8 inline-block">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Application Reference</p>
            <p className="text-xl font-mono font-bold text-gray-900 dark:text-white">{appNumber}</p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
            You will be notified via Telegram or email once your application is processed.
          </p>
          <button 
            onClick={onClose}
            className="w-full bg-green-700 text-white dark:bg-[#d4ff00] dark:text-black font-bold py-4 rounded-xl hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (showEmailVerification) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-[#080808] flex items-center justify-center p-5 animate-in fade-in">
        <div className="w-full max-w-md bg-gray-50 dark:bg-[#121214] p-7 sm:p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#d4ff00]/15 border border-[#d4ff00]/30 flex items-center justify-center"><FileText className="w-7 h-7 text-green-700 dark:text-[#d4ff00]" /></div>
          <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-green-700 dark:text-[#d4ff00]">Email confirmation</span>
          <h2 className="mt-2 text-2xl font-black font-syne uppercase text-gray-900 dark:text-white">Check your email</h2>
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">We sent a six-digit confirmation code to <b className="text-gray-900 dark:text-white">{applicantEmail}</b>. Please check your Inbox and Spam/Junk folder. If it appears in Spam, mark it as “Not spam”.</p>
          <input autoFocus value={emailVerificationCode} onChange={event => setEmailVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="000000" className="mt-6 w-full px-5 py-4 rounded-2xl bg-white dark:bg-black border border-gray-200 dark:border-white/10 text-center text-xl font-mono font-black tracking-[0.45em] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d4ff00]" />
          <p className="mt-3 text-[11px] text-neutral-500">The code expires in 15 minutes.</p>
          <div className="mt-6 grid grid-cols-2 gap-3"><button onClick={() => setShowEmailVerification(false)} disabled={isVerifyingEmail} className="py-3 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-black uppercase text-gray-900 dark:text-white">Back</button><button onClick={handleSubmit} disabled={isVerifyingEmail || emailVerificationCode.length !== 6} className="py-3 rounded-xl bg-[#d4ff00] text-black text-xs font-black uppercase disabled:opacity-50">{isVerifyingEmail ? 'Verifying…' : 'Verify & Submit'}</button></div>
          <button onClick={requestEmailVerification} disabled={isVerifyingEmail} className="mt-4 text-[11px] font-black uppercase text-green-700 dark:text-[#d4ff00] disabled:opacity-50">Resend confirmation code</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-[#080808]/40 md:bg-black/40 backdrop-blur-sm flex md:items-center justify-center">
      <div className="w-full h-full md:h-auto md:max-w-2xl bg-white/95 dark:bg-[#080808]/95 backdrop-blur-2xl md:rounded-3xl flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_60px_rgba(212,255,0,0.05)] overflow-hidden relative border border-white/40 dark:border-white/10">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200/50 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-black/40 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white font-syne uppercase tracking-tight">Become a Member</h2>
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              {step === 0 ? 'Select your membership tier' : `Step ${step} of ${maxFormSteps} — ${tier} Member`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-gray-500 dark:text-gray-300 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar - only show when in form steps */}
        {step > 0 && tier && (
          <div className="px-6 pt-4 pb-0">
            <div className="flex justify-between items-center gap-1">
              {Array.from({ length: maxFormSteps }).map((_, i) => (
                <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  i + 1 <= step ? 'bg-green-700 dark:bg-[#d4ff00]' : 'bg-gray-200 dark:bg-white/10'
                }`} />
              ))}
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {/* Step 0: Tier Selection */}
          {step === 0 && renderTierSelection()}
          
          {/* STUDENT FLOW */}
          {tier === 'STUDENT' && step > 0 && (
            <>
              {step === 1 && renderPersonalInfoStep()}
              {step === 2 && renderStudentStep2()}
              {step === 3 && renderStudentStep3()}
              {step === 4 && renderPaymentStep('ETB 150')}
            </>
          )}

          {/* FULL MEMBER FLOW */}
          {tier === 'FULL' && step > 0 && (
            <>
              {step === 1 && renderPersonalInfoStep()}
              {step === 2 && renderFullStep2()}
              {step === 3 && renderFullStep3()}
              {step === 4 && renderFullStep4()}
              {step === 5 && renderFullStep5()}
            </>
          )}

          {/* CORPORATE FLOW */}
          {tier === 'CORPORATE' && step > 0 && (
            <>
              {step === 1 && renderCorporateStep1()}
              {step === 2 && renderCorporateStep2()}
              {step === 3 && renderCorporateStep3()}
              {step === 4 && renderCorporateStep4()}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200/50 dark:border-white/10 bg-white/50 dark:bg-black/40 backdrop-blur-md flex justify-between gap-4 sticky bottom-0 z-10">
          {step > 0 ? (
            <button 
              onClick={handlePrev}
              className="px-6 py-3 rounded-xl font-bold text-gray-700 dark:text-gray-300 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors flex items-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}
          
          <button 
            onClick={step === 0 ? handleNext : (isLastStep ? handleSubmit : handleNext)}
            disabled={isVerifyingEmail}
            className="px-8 py-3 rounded-xl font-black bg-green-700 text-white dark:bg-[#d4ff00] dark:text-black hover:opacity-90 transition-opacity flex items-center gap-2 ml-auto text-xs uppercase tracking-wider shadow-lg shadow-green-700/20 dark:shadow-[#d4ff00]/20 cursor-pointer"
          >
            {isVerifyingEmail ? 'Please wait…' : step === 0 ? 'Continue' : isLastStep ? 'Continue to Email Verification' : 'Continue'}
            {!(step > 0 && isLastStep) && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </div>
  );
}
