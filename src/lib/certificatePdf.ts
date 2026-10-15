import { jsPDF } from 'jspdf';
import { certificateVerificationUrl } from '../../shared/certificates.js';

// Keep PDF support in the initial page bundle. A page left open across a
// deployment must not depend on a lazy chunk from its previous deployment.
export function createCertificatePdf(image: string, id: string, organizationName: string) {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
  pdf.setProperties({ title: `EPA Certificate - ${organizationName}`, author: "Ethiopian Psychologists' Association" });
  pdf.addImage(image, 'PNG', 0, 0, 297, 210);
  pdf.link(228, 175, 27, 27, { url: certificateVerificationUrl(id) });
  return pdf;
}
