import { 
  MembershipType, 
  Member, 
  Application, 
  Announcement, 
  University, 
  CPDCourse, 
  ElectionCandidate, 
  AuditLog 
} from '../types';

export const MEMBERSHIP_TYPES: MembershipType[] = [
  {
    code: 'STUDENT',
    name: 'Student Membership',
    amharicName: 'የተማሪ አባልነት',
    fee: 150,
    currency: 'ETB',
    period: 'Annual',
    description: 'Designed for undergraduate and postgraduate psychology students enrolled in accredited Ethiopian higher education institutions.',
    amharicDescription: 'በከፍተኛ የትምህርት ተቋማት ውስጥ በስነ-ልቦና ትምህርት ክፍል ለሚማሩ ተማሪዎች የተዘጋጀ።',
    badgeColor: '#2E7D32',
    requirements: [
      'Valid student ID from MoE accredited university',
      'Proof of current semester enrollment',
      'Passport size digital photo'
    ],
    benefits: [
      'Digital student membership ID card with QR verification',
      'Free access to EPA student research webinars & workshops',
      'Mentorship opportunities with EPA full professional members',
      'Discounted access to annual national psychology symposium',
      'Access to digital Ethiopian journal of psychology archives'
    ]
  },
  {
    code: 'FULL',
    name: 'Full Professional Membership',
    amharicName: 'ሙሉ የሙያ አባልነት',
    fee: 1500,
    currency: 'ETB',
    period: 'Annual',
    description: 'For practicing psychologists, researchers, clinicians, and academic faculty with a recognized BA/BSc, MA/MSc, or PhD in psychology.',
    amharicDescription: 'በስነ-ልቦና የትምህርት ዘርፍ የተመረቁ እና በሙያው በመስራት ላይ ላሉ ባለሙያዎች የተዘጋጀ።',
    badgeColor: '#1565C0',
    requirements: [
      'Recognized Bachelor’s, Master’s or PhD degree certificate',
      'Official academic transcript',
      'Valid national ID / Kebele ID or Passport',
      'Passport size digital photograph',
      'Signed agreement to the EPA Code of Ethics'
    ],
    benefits: [
      'Official EPA Digital Membership ID',
      'Optional listing in the EPA member directory',
      'Voting rights and eligibility for EPA Executive Council elections',
      'EPA continuing professional development (CPD) participation records',
      'Legal & ethical advisory support for private or clinical practice',
      'Association membership certificate and professional community support'
    ]
  },
  {
    code: 'CORPORATE',
    name: 'Institutional / Corporate Membership',
    amharicName: 'የድርጅት / ተቋም አባልነት',
    fee: 10000,
    currency: 'ETB',
    period: 'Annual',
    description: 'For clinics, hospitals, NGOs, mental health centers, universities, and corporate wellbeing departments.',
    amharicDescription: 'ለሆስፒታሎች፣ መንግስታዊ ላልሆኑ ድርጅቶች፣ ክሊኒኮች እና የስነ-ልቦና ማዕከላት የተዘጋጀ።',
    badgeColor: '#F57F17',
    requirements: [
      'Valid Commercial Registration Certificate or NGO License',
      'TIN certificate and Tax clearance certificate',
      'Designated primary professional liaison contact',
      'Organization profile and mental health service summary'
    ],
    benefits: [
      'EPA corporate membership badge for official publications',
      'Free registration for up to 5 institutional staff in EPA conferences',
      'Priority mental health workplace training workshops',
      'Institutional consultation and learning-resource discounts',
      'Job board posting priority for mental health professional recruitment'
    ]
  }
];

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'mem-001',
    membership_number: 'EPA-2026-8849',
    verification_token: 'epa_tok_9942a17b',
    first_name: 'Dr. Selamawit',
    father_name: 'Bekele',
    grandfather_name: 'Tadesse',
    amharic_full_name: 'ዶ/ር ሰላማዊት በቀለ ታደሰ',
    photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    email: 'selamawit.bekele@aau.edu.et',
    phone: '+251 91 142 8890',
    city: 'Addis Ababa',
    membership_type: 'FULL',
    status: 'ACTIVE',
    specialty: 'Clinical & Trauma Psychology',
    workplace: 'Addis Ababa University & Tikur Anbessa Hospital',
    bio: 'Associate Professor of Clinical Psychology with over 14 years specializing in post-traumatic recovery, community resilience, and cognitive behavioral therapy in East Africa.',
    cpd_points: 48,
    issued_at: '2025-01-15T00:00:00Z',
    expires_at: '2027-01-15T00:00:00Z',
    is_verified: true,
    license_number: 'EPA-LIC-CL-0412',
    telegram_username: '@dr_selamawit'
  },
  {
    id: 'mem-002',
    membership_number: 'EPA-2026-4412',
    verification_token: 'epa_tok_3381e90c',
    first_name: 'Yonas',
    father_name: 'Alemu',
    grandfather_name: 'Wolde',
    amharic_full_name: 'ዮናስ አለሙ ወልዴ',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    email: 'yonas.alemu@gmail.com',
    phone: '+251 92 388 1902',
    city: 'Hawassa',
    membership_type: 'STUDENT',
    status: 'ACTIVE',
    specialty: 'Educational & Developmental Psychology',
    workplace: 'Hawassa University (MSc Candidate)',
    bio: 'Graduate researcher investigating adolescent socio-emotional competence, school-based interventions, and youth mental wellbeing in Sidama Region.',
    cpd_points: 22,
    issued_at: '2025-09-10T00:00:00Z',
    expires_at: '2026-09-10T00:00:00Z',
    is_verified: true,
    telegram_username: '@yonas_psych'
  },
  {
    id: 'mem-003',
    membership_number: 'EPA-2026-7201',
    verification_token: 'epa_tok_1172f88d',
    first_name: 'Dr. Dawit',
    father_name: 'Mekonnen',
    grandfather_name: 'Haile',
    amharic_full_name: 'ዶ/ር ዳዊት መኮንን ኃይሌ',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    email: 'dawit.mekonnen@ju.edu.et',
    phone: '+251 91 760 3341',
    city: 'Jimma',
    membership_type: 'FULL',
    status: 'ACTIVE',
    specialty: 'Neuropsychology & Psychometrics',
    workplace: 'Jimma University Institute of Health',
    bio: 'Lead researcher in cross-cultural psychological assessment standardization and cognitive rehabilitation protocols.',
    cpd_points: 65,
    issued_at: '2024-11-01T00:00:00Z',
    expires_at: '2026-11-01T00:00:00Z',
    is_verified: true,
    license_number: 'EPA-LIC-NP-0108',
    telegram_username: '@dawit_neuro'
  },
  {
    id: 'mem-004',
    membership_number: 'EPA-2026-9034',
    verification_token: 'epa_tok_8829b31a',
    first_name: 'Bethlehem',
    father_name: 'Tesfaye',
    grandfather_name: 'Girma',
    amharic_full_name: 'ቤተልሔም ተስፋዬ ግርማ',
    photo_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=400',
    email: 'bethlehem.tesfaye@bdu.edu.et',
    phone: '+251 91 800 2490',
    city: 'Bahir Dar',
    membership_type: 'FULL',
    status: 'ACTIVE',
    specialty: 'Child & Adolescent Counseling',
    workplace: 'Bahir Dar Specialized Counseling Clinic',
    bio: 'Certified psychotherapist focusing on family systems, child behavioral challenges, and early childhood emotional development.',
    cpd_points: 38,
    issued_at: '2025-03-20T00:00:00Z',
    expires_at: '2027-03-20T00:00:00Z',
    is_verified: true,
    license_number: 'EPA-LIC-CO-0551'
  },
  {
    id: 'mem-005',
    membership_number: 'EPA-2026-1940',
    verification_token: 'epa_tok_5510c49e',
    first_name: 'Kassahun',
    father_name: 'Gebre',
    grandfather_name: 'Meda',
    amharic_full_name: 'ካሳሁን ገብሬ ሜዳ',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    email: 'kassahun.g@stmary.edu.et',
    phone: '+251 91 199 4321',
    city: 'Addis Ababa',
    membership_type: 'FULL',
    status: 'ACTIVE',
    specialty: 'Industrial & Organizational Psychology',
    workplace: 'Talent & Human Dynamics Consult',
    bio: 'Consultant for corporate mental health programs, leadership assessment, executive coaching, and occupational stress management.',
    cpd_points: 52,
    issued_at: '2025-02-10T00:00:00Z',
    expires_at: '2027-02-10T00:00:00Z',
    is_verified: true,
    license_number: 'EPA-LIC-IO-0219'
  }
];

export const INITIAL_APPLICATIONS: Application[] = [
  {
    id: 'app-101',
    application_number: 'APP-2026-0391',
    first_name: 'Abebe',
    father_name: 'Kassaye',
    grandfather_name: 'Cheru',
    amharic_full_name: 'አበበ ካሳዬ ቸሩ',
    gender: 'M',
    email: 'abebe.kassaye@gmail.com',
    phone: '+251 91 234 5678',
    date_of_birth: '1998-04-12',
    city: 'Addis Ababa',
    membership_type: 'STUDENT',
    status: 'SUBMITTED',
    photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
    id_document_url: 'student_id_abebe.pdf',
    student_profile: {
      university_name: 'Addis Ababa University',
      field_of_study: 'BSc Clinical Psychology',
      academic_year: 4,
      student_id_number: 'UGR/9821/14',
      expected_graduation_year: 2026
    },
    payment: {
      id: 'pay-001',
      amount: 150,
      currency: 'ETB',
      provider: 'Telebirr',
      transaction_number: 'TB993210488921',
      payment_date: '2026-08-25T14:30:00Z',
      status: 'PENDING'
    },
    submitted_at: '2026-08-25T14:35:00Z'
  },
  {
    id: 'app-102',
    application_number: 'APP-2026-0392',
    first_name: 'Tigist',
    father_name: 'Desta',
    grandfather_name: 'Lemma',
    amharic_full_name: 'ትዕግስት ደስታ ለማ',
    gender: 'F',
    email: 'tigist.desta@gmail.com',
    phone: '+251 92 987 6543',
    date_of_birth: '1992-11-03',
    city: 'Adama',
    membership_type: 'FULL',
    status: 'PAYMENT_PENDING',
    photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
    qualifications: [
      {
        degree_level: 'MA',
        field: 'Counseling Psychology',
        institution: 'Hawassa University',
        graduation_year: 2020
      },
      {
        degree_level: 'BA',
        field: 'Psychology',
        institution: 'Addis Ababa University',
        graduation_year: 2016
      }
    ],
    payment: {
      id: 'pay-002',
      amount: 1500,
      currency: 'ETB',
      provider: 'CBE',
      transaction_number: 'FT260824001928',
      payment_date: '2026-08-26T09:12:00Z',
      status: 'PENDING'
    },
    submitted_at: '2026-08-26T09:20:00Z'
  },
  {
    id: 'app-103',
    application_number: 'APP-2026-0388',
    first_name: 'Binyam',
    father_name: 'Habte',
    grandfather_name: 'Gidey',
    amharic_full_name: 'ቢንያም ሀብተ ጊደይ',
    gender: 'M',
    email: 'binyam.habte@mu.edu.et',
    phone: '+251 94 455 1209',
    date_of_birth: '1990-07-22',
    city: 'Mekelle',
    membership_type: 'FULL',
    status: 'UNDER_REVIEW',
    photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300',
    qualifications: [
      {
        degree_level: 'MSc',
        field: 'Clinical Psychology',
        institution: 'University of Gondar',
        graduation_year: 2018
      }
    ],
    payment: {
      id: 'pay-003',
      amount: 1500,
      currency: 'ETB',
      provider: 'Telebirr',
      transaction_number: 'TB88421094002',
      payment_date: '2026-08-24T16:00:00Z',
      status: 'VERIFIED'
    },
    submitted_at: '2026-08-24T16:05:00Z'
  },
  {
    id: 'app-104',
    application_number: 'APP-2026-0375',
    first_name: 'Eskinder',
    father_name: 'Taye',
    grandfather_name: 'Wondimu',
    gender: 'M',
    email: 'eskinder.taye@gmail.com',
    phone: '+251 91 188 9012',
    date_of_birth: '1995-02-14',
    city: 'Dire Dawa',
    membership_type: 'FULL',
    status: 'CORRECTION_REQUIRED',
    photo_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=300',
    admin_notes: 'Academic transcript copy is partially blurry. Please re-upload a clear high-resolution scanned PDF of your degree transcript.',
    submitted_at: '2026-08-22T10:15:00Z'
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-001',
    title: 'Call for Abstracts: 18th Annual National Psychology Symposium 2026',
    amharic_title: 'የጥናት ጽሑፍ ጥሪ፡ 18ኛው ዓመታዊ ብሔራዊ የስነ-ልቦና ሲምፖዚየም 2026',
    category: 'Event',
    content: 'The Ethiopian Psychologists\' Association cordially invites researchers, practitioners, and students to submit abstracts under the theme "Mental Wellbeing, Resilience, and Digital Transformation in Post-Recovery Ethiopia". Selected papers will be published in the Special Edition Ethiopian Journal of Applied Psychology.',
    published_at: '2026-08-20T08:00:00Z',
    author: 'EPA Research & Scientific Committee',
    likes_count: 42,
    views_count: 512,
    is_featured: true,
    cover_gradient: 'from-emerald-800 to-green-950'
  },
  {
    id: 'ann-002',
    title: 'MoH & EPA Joint Clinical Tele-Psychology Practice Guidelines Released',
    amharic_title: 'የጤና ጥበቃ ሚኒስቴር እና ኢሳይባ የቴሌ-ሳይኮሎጂ አገልግሎት መመሪያዎችን ይፋ አደረጉ',
    category: 'Policy',
    content: 'A landmark framework establishing ethical boundaries, digital consent protocols, and diagnostic validation requirements for tele-counseling services across all regional health bureaus in Ethiopia.',
    published_at: '2026-08-15T11:30:00Z',
    author: 'EPA Standards & Ethics Directorate',
    likes_count: 89,
    views_count: 840,
    is_featured: true,
    cover_gradient: 'from-blue-900 to-indigo-950'
  },
  {
    id: 'ann-003',
    title: 'Upcoming CPD Workshop: Trauma-Informed Community First-Aid',
    amharic_title: 'መጪው የሙያ ማሻሻያ ስልጠና፡ በማህበረሰብ አቀፍ የስነ-አእምሮ የመጀመሪያ እርዳታ ዙሪያ',
    category: 'Training',
    content: 'Earn 10 accredited Continuing Professional Development (CPD) points through our 2-day hybrid workshop led by certified trauma specialists at Skylight Hotel, Addis Ababa and via Zoom.',
    published_at: '2026-08-10T14:00:00Z',
    author: 'EPA Continuing Education Council',
    likes_count: 56,
    views_count: 670,
    is_featured: false,
    cover_gradient: 'from-amber-800 to-stone-900'
  }
];

export const INITIAL_UNIVERSITIES: University[] = [
  {
    id: 'uni-001',
    name: 'Addis Ababa University (AAU)',
    amharic_name: 'አዲስ አበባ ዩኒቨርሲቲ',
    city: 'Addis Ababa',
    type: 'Public',
    is_accredited: true,
    departments: ['Clinical Psychology', 'Educational Psychology', 'Counseling Psychology', 'Social Psychology']
  },
  {
    id: 'uni-002',
    name: 'Jimma University',
    amharic_name: 'ጅማ ዩኒቨርሲቲ',
    city: 'Jimma',
    type: 'Public',
    is_accredited: true,
    departments: ['Clinical Psychology', 'Health Psychology', 'Community Psychology']
  },
  {
    id: 'uni-003',
    name: 'Hawassa University',
    amharic_name: 'ሀዋሳ ዩኒቨርሲቲ',
    city: 'Hawassa',
    type: 'Public',
    is_accredited: true,
    departments: ['Counseling Psychology', 'Developmental Psychology', 'Educational Psychology']
  },
  {
    id: 'uni-004',
    name: 'University of Gondar',
    amharic_name: 'ጎንደር ዩኒቨርሲቲ',
    city: 'Gondar',
    type: 'Public',
    is_accredited: true,
    departments: ['Clinical Psychology', 'Neuropsychology']
  },
  {
    id: 'uni-005',
    name: 'Bahir Dar University',
    amharic_name: 'ባሕር ዳር ዩኒቨርሲቲ',
    city: 'Bahir Dar',
    type: 'Public',
    is_accredited: true,
    departments: ['Child Psychology', 'Counseling Psychology', 'Educational Psychology']
  },
  {
    id: 'uni-006',
    name: 'Mekelle University',
    amharic_name: 'መቀሌ ዩኒቨርሲቲ',
    city: 'Mekelle',
    type: 'Public',
    is_accredited: true,
    departments: ['Clinical & Trauma Psychology', 'Social Psychology']
  },
  {
    id: 'uni-007',
    name: 'St. Mary’s University',
    amharic_name: 'ቅድስት ማርያም ዩኒቨርሲቲ',
    city: 'Addis Ababa',
    type: 'Private',
    is_accredited: true,
    departments: ['Organizational Psychology', 'Applied Psychology']
  }
];

export const INITIAL_CPD_COURSES: CPDCourse[] = [
  {
    id: 'cpd-001',
    title: 'Trauma Counseling & Psychological First Aid in Emergency Response',
    instructor: 'Dr. Selamawit Bekele',
    instructor_title: 'Associate Professor of Clinical Psychology, AAU',
    points: 12,
    category: 'Clinical',
    duration: '6 Hours (2 Sessions)',
    date: 'Sept 12 - 13, 2026',
    mode: 'Online Webinar',
    registered: true,
    is_completed: false
  },
  {
    id: 'cpd-002',
    title: 'Ethical Guidelines & Confidentiality Protocols in Ethiopian Clinical Practice',
    instructor: 'Dr. Kassahun Gebre',
    instructor_title: 'Chairperson, EPA Ethics & Professional Conduct Board',
    points: 8,
    category: 'Ethics',
    duration: '4 Hours (1 Session)',
    date: 'Sept 20, 2026',
    mode: 'Online Webinar',
    registered: false,
    is_completed: false
  },
  {
    id: 'cpd-003',
    title: 'Standardizing Psychometric Diagnostic Tools in Local Languages (Amharic & Afaan Oromoo)',
    instructor: 'Dr. Dawit Mekonnen',
    instructor_title: 'Lead Psychometrician, Jimma University',
    points: 15,
    category: 'Research',
    duration: '8 Hours (Full Day Workshop)',
    date: 'Oct 04, 2026',
    mode: 'In-Person (Addis Ababa)',
    registered: false,
    is_completed: false
  },
  {
    id: 'cpd-004',
    title: 'Cognitive Behavioral Therapy for Generalized Anxiety and Stress in Youth',
    instructor: 'Bethlehem Tesfaye, MA',
    instructor_title: 'Senior Clinical Consultant, Bahir Dar Clinic',
    points: 10,
    category: 'Counseling',
    duration: '5 Hours (Self-Paced)',
    date: 'Anytime Access',
    mode: 'Self-Paced Module',
    registered: true,
    is_completed: true
  }
];

export const INITIAL_ELECTION_CANDIDATES: ElectionCandidate[] = [
  {
    id: 'cand-001',
    name: 'Prof. Teshale Woldeyesus',
    title: 'Professor of Psychology, Addis Ababa University',
    institution: 'AAU College of Education & Behavioral Studies',
    running_for: 'President',
    manifesto: 'Transforming EPA into a globally recognized accreditation body, establishing provincial psychology resource hubs across 8 regional states, and integrating mental health reimbursement into Ethiopian National Health Insurance.',
    votes_count: 142,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'cand-002',
    name: 'Dr. Rahel Zewdu',
    title: 'Director of Mental Health Research, EPHI',
    institution: 'Ethiopian Public Health Institute',
    running_for: 'President',
    manifesto: 'Pioneering scientific data infrastructure, tripling student research grants, establishing legal protection charters for practicing counselors, and modernizing digital licensing.',
    votes_count: 129,
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'cand-003',
    name: 'Dr. Girma Taye',
    title: 'Head of Clinical Psychology, Hawassa University',
    institution: 'Hawassa University Institute of Health',
    running_for: 'Vice President',
    manifesto: 'Strengthening regional university chapters, expanding practical internships in regional hospitals, and organizing nationwide continuous professional education modules.',
    votes_count: 98,
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    action: 'Approved Application & Issued Digital ID',
    entity_type: 'Application',
    entity_id: 'APP-2026-0370 (Dr. Dawit Mekonnen)',
    admin_username: 'superadmin_epa',
    created_at: '2026-08-26T15:20:00Z'
  },
  {
    id: 'log-002',
    action: 'Verified Telebirr Payment Slip (1,500 ETB)',
    entity_type: 'Payment',
    entity_id: 'TB88421094002',
    admin_username: 'finance_admin',
    created_at: '2026-08-26T11:45:00Z'
  },
  {
    id: 'log-003',
    action: 'Published National Symposium 2026 Announcement',
    entity_type: 'Announcement',
    entity_id: 'ann-001',
    admin_username: 'editorial_board',
    created_at: '2026-08-25T09:10:00Z'
  },
  {
    id: 'log-004',
    action: 'Added MoE Accredited University: St. Mary’s University',
    entity_type: 'University',
    entity_id: 'uni-007',
    admin_username: 'superadmin_epa',
    created_at: '2026-08-24T14:00:00Z'
  }
];
