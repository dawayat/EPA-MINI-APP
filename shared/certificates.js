export const certificateOrganizations = [
  { id: 'aha', name: 'Aha Psychological Services', am: 'አሃ ሳይኮሎጂካል ሰርቪስስ', logo: '/certificates/aha.png' },
  { id: 'abrihot', name: 'Abrihot Specialized Psychological Center', am: 'አብርሆት ስፔሻላዝድ ሳይኮሎጂካል ሴንተር', logo: '/certificates/abrihot.jpg' },
  { id: 'natanim', name: 'Natanim Charitable Organization', am: 'ናታኒም ቻሪታብል ኦርጋናይዜሽን', logo: '/certificates/natanim.jpg' },
];
export const certificateSite = 'https://epa-mini-app.vercel.app';
export const certificateDate = '2026-10-17';
export const certificateIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const certificateVerificationUrl = id => `${certificateSite}/?certificate=${encodeURIComponent(id)}`;
