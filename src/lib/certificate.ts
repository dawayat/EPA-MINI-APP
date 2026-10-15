import { certificateOrganizations, certificateVerificationUrl } from '../../shared/certificates.js';
export { certificateOrganizations, certificateVerificationUrl } from '../../shared/certificates.js';
export const membershipEnglish = "has fulfilled the requirements for corporate membership established by the Ethiopian Psychologists' Association (EPA) and is hereby recognized as a Corporate Member of the Association for the year 2026/2027.";
export const membershipAmharic = 'የኢትዮጵያ ሳይኮሎጂ ባላሙያዎች ማኅበር (EPA) የተቀመጠውን የድርጅት አባልነት መስፈርቶች በማሟላቱ፣ ለ2019 ዓ.ም. የማኅበሩ የድርጅት አባል መሆኑን በዚህ የምስክር ወረቀት እናረጋግጣለን።';
export interface CertificateOptions { organization: typeof certificateOrganizations[number]; english: string; amharic: string; signature?: string; certificateId: string }
let fontReady: Promise<void> | undefined;
async function loadFont() {
  fontReady ??= (async () => {
    await Promise.all([['EPA Ethiopic', 'NotoSansEthiopic.ttf'], ['EPA Display', 'CormorantGaramond.ttf'], ['EPA Ethiopic Display', 'NotoSerifEthiopic.ttf']].map(async ([name, file]) => {
      const face = new FontFace(name, `url(/certificates/${file})`, { weight: '100 900' });
      document.fonts.add(await face.load());
    }));
  })();
  try { await fontReady; } catch (error) { fontReady = undefined; throw error; }
}
async function image(src: string) { const img = new Image(); img.src = src; await img.decode(); return img; }

/** A single high-resolution canvas is used for both preview and PDF. */
export async function renderCertificate(options: CertificateOptions): Promise<HTMLCanvasElement> {
  const [{ default: QRCode }, , epa, logo, signature] = await Promise.all([
    import('qrcode'), loadFont(), image('/epa-logo.png'), image(options.organization.logo),
    options.signature ? image(options.signature) : Promise.resolve(null),
  ]);
  const qr = await image(await QRCode.toDataURL(certificateVerificationUrl(options.certificateId), { width: 500, margin: 4, errorCorrectionLevel: 'H', color: { dark: '#123650', light: '#ffffff' } }));
  const canvas = document.createElement('canvas'); canvas.width = 2400; canvas.height = 1697;
  const c = canvas.getContext('2d'); if (!c) throw new Error('Canvas is unavailable.');
  c.scale(1.5, 1.5);
  const w = 1600, h = 1697 / 1.5, navy = '#123650', gold = '#af8846';
  c.fillStyle = '#fffefb'; c.fillRect(0,0,w,h);
  function line(x1:number,y1:number,x2:number,y2:number,color=gold,width=1) { c!.strokeStyle=color; c!.lineWidth=width; c!.beginPath(); c!.moveTo(x1,y1); c!.lineTo(x2,y2); c!.stroke(); }
  function text(value:string,x:number,y:number,size:number,family='Georgia',color=navy,weight=400) { c!.fillStyle=color; c!.font=`${weight} ${size}px ${family}`; c!.textAlign='center'; c!.textBaseline='middle'; c!.fillText(value,x,y); }
  function wrapped(value:string,x:number,y:number,width:number,size:number,family:string,leading:number) {
    c!.font=`${size}px ${family}`; const lines:string[]=[]; let current='';
    // Keep the membership year together instead of leaving E.C. on its own line.
    for(const word of value.trim().replace(/2019\s+E\.C\./g, '2019\u00a0E.C.').split(/[\t\r\n ]+/)) {
      if(c!.measureText(word).width>width) throw new Error('Please shorten long words in the certificate message.');
      const next=current?`${current} ${word}`:word;
      if(c!.measureText(next).width>width && current) { lines.push(current); current=word; } else current=next;
    }
    if(current) lines.push(current);
    if(lines.length>7) throw new Error('The certificate message is too long. Please shorten it to fit the certificate.');
    lines.forEach((value,i)=>{ text(value,x,y+i*leading,size,family,'#344b59'); });
  }
  function contain(img:HTMLImageElement,x:number,y:number,width:number,height:number) {
    // The supplied Aha image has large white margins around its artwork.
    const crop = img === logo && options.organization.id === 'aha' ? [299,368,1244,306] : [0,0,img.width,img.height];
    const [sx,sy,sw,sh]=crop, s=Math.min(width/sw,height/sh);
    c!.drawImage(img,sx,sy,sw,sh,x+(width-sw*s)/2,y+(height-sh*s)/2,sw*s,sh*s);
  }
  // Quiet architectural frame, with generous margins around the bilingual content.
  c.fillStyle=navy; c.fillRect(0,0,18,h); c.fillRect(w-18,0,18,h);
  c.strokeStyle=gold; c.lineWidth=1.4; c.strokeRect(38,38,w-76,h-76);
  line(62,62,250,62,gold,3); line(1350,62,1538,62,gold,3);
  line(62,h-62,250,h-62,gold,3); line(1350,h-62,1538,h-62,gold,3);
  contain(epa,94,80,118,118);
  text("Ethiopian Psychologists' Association",850,120,37,'"EPA Display"',navy,600);
  text('የኢትዮጵያ ሳይኮሎጂ ባላሙያዎች ማኅበር',850,167,28,'"EPA Ethiopic"');
  text(`CERTIFICATE ID: ${options.certificateId}`,850,202,12,'Arial','#5b6b76');
  line(95,220,1505,220,'#d9c9ab');
  text('Certificate of',435,266,43,'"EPA Display"',navy,600);
  text('Corporate Membership',435,313,54,'"EPA Display"',navy,600);
  text('የድርጅት አባልነት',1165,266,37,'"EPA Ethiopic Display"',navy,600);
  text('የምስክር ወረቀት',1165,313,31,'"EPA Ethiopic Display"',navy,600);
  text('2026/2027',435,355,17,'Arial',gold);
  text('2019 ዓ.ም.',1165,355,21,'"EPA Ethiopic"',gold);
  contain(logo,675,385,250,85);
  text('THIS IS TO CERTIFY THAT',435,502,16,'Arial',gold);
  text('ይህ የምስክር ወረቀት የተሰጠው ለ',1165,502,21,'"EPA Ethiopic"',gold);
  // Break long organization names into two balanced lines, rather than shrinking them.
  const enNames: Record<string,string[]> = {
    aha: ['Aha Psychological Services'],
    abrihot: ['Abrihot Specialized', 'Psychological Center'],
    natanim: ['Natanim', 'Charitable Organization'],
    medanit: [options.organization.name],
  };
  const amNames: Record<string,string[]> = {
    aha: [options.organization.am],
    abrihot: ['አብርሆት ስፔሻላዝድ', 'ሳይኮሎጂካል ሴንተር'],
    natanim: ['ናታኒም', 'ቻሪታብል ኦርጋናይዜሽን'],
    medanit: [options.organization.am],
  };
  const en=enNames[options.organization.id], am=amNames[options.organization.id];
  en.forEach((value,i)=>text(value,435,en.length===1?570:546+i*48,46,'"EPA Display"',navy,600));
  am.forEach((value,i)=>text(value,1165,am.length===1?570:546+i*48,33,'"EPA Ethiopic Display"',navy,600));
  line(325,630,545,630,gold,2); line(1055,630,1275,630,gold,2);
  line(800,505,800,907,'#e3d9c8');
  wrapped(options.english,435,670,620,27,'Georgia',38);
  wrapped(options.amharic,1165,670,620,27,'"EPA Ethiopic"',39);
  line(95,935,1505,935,'#d9c9ab');
  text('DATE OF ISSUE',275,978,12,'Arial',gold);
  text('October 17, 2026',275,1013,29,'"EPA Display"',navy,600);
  text('ጥቅምት 7፣ 2019 ዓ.ም.',275,1052,23,'"EPA Ethiopic"');
  if(signature) contain(signature,635,945,330,48);
  else text('Signature / ፊርማ',800,970,14,'"EPA Ethiopic"','#7d8589');
  line(635,997,965,997,gold);
  text('Dr. Getahun Tibebu',800,1025,30,'"EPA Display"',navy,600);
  text('ዶ/ር ጌታሁን ጥበቡ · ፕሬዝዳንት',800,1061,20,'"EPA Ethiopic"');
  contain(qr,1230,944,140,140);
  text('SCAN TO VERIFY',1430,989,12,'Arial',gold);
  text('ትክክለኛነቱን',1430,1021,14,'"EPA Ethiopic"');
  text('ያረጋግጡ',1430,1047,14,'"EPA Ethiopic"');
  return canvas;
}
