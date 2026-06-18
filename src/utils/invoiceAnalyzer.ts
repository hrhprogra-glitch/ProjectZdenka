// src/utils/invoiceAnalyzer.ts
import { extractDate } from './dateExtractor';
import { extractInvoice } from './invoiceExtractor';

export function extractAccurateData(text: string) {
  const normalizedText = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const lines = normalizedText.split('\n').map(l => l.trim()).filter(l => l.length > 2);

  const datePart = extractDate(text);
  const invoicePart = extractInvoice(text);

  let issuerName = "";
  
  const blacklist = /FACTURA|BOLETA|TICKET|ELECTRONICA|DNI|FECHA|DIRECCION|CLIENTE|PUBLIUS|MOCHCCO|SOSA|VELASQUEZ|CHAWARRY|CORCUERA|JACINTO|AV\.|AVENIDA|JR\.|JIRON|CALLE|MIRAFLORES|CHEPEN|PANAMERICANA|CARRETERA|MEXICO|LIMA|VICTORIA|CUSCO|AEROPUERTO|ATOCONGO|PLAZA|TERMINAL|TELEFONO|CELULAR|EMAIL|HTTP|WWW|ID:|LOTE:|CAPTURA|REF:|HORA|PAGO|TARJETA|EFECTIVO|VUELTO|SERIE/i;

  // ========================================================================
  // ESCUDO ANTI-RUC: Destruye la palabra RUC y cualquier bloque numérico largo
  // ========================================================================
  const destroyRUC = (str: string) => {
    return str
      .replace(/R[\.\s]*U[\.\s]*C[\.\s]*[:.-]?/ig, '') // Borra "R.U.C." o "RUC:"
      .replace(/\b\d{8,11}\b/g, '') // Borra bloques de 8 a 11 números puros (DNI/RUC)
      .replace(/\b(10|15|17|20)[0-9O\s]{8,12}\b/g, ''); // Borra RUCs con espacios o letras "O"
  };

  // ========================================================================
  // PRIORIDAD 1: EL TÍTULO / CABECERA PRINCIPAL
  // ========================================================================
  let titleCandidates: string[] = [];
  for (let l of lines.slice(0, 8)) {
    if (/(R[\.\s]*U[\.\s]*C|FACTURA|BOLETA|TICKET)/i.test(l)) {
      if (titleCandidates.length === 0) {
         let cleanedLine = destroyRUC(l).trim();
         // REGLA OBLIGATORIA: Debe tener al menos 3 letras ([A-Z]{3,})
         if (cleanedLine.length > 3 && !blacklist.test(cleanedLine) && /[A-Z]{3,}/.test(cleanedLine)) {
           titleCandidates.push(cleanedLine);
         }
      }
      break; 
    }
    
    if (/\b(AV\.|AVENIDA|JR\.|JIRON|CALLE|MIRAFLORES|LIMA|VICTORIA)\b/i.test(l)) {
       if (titleCandidates.length > 0) break;
       continue; 
    }

    let pureLine = destroyRUC(l).trim();
    if (!blacklist.test(pureLine) && /[A-Z]{3,}/.test(pureLine)) {
      titleCandidates.push(pureLine);
    }
  }

  if (titleCandidates.length > 0) {
    issuerName = titleCandidates.slice(0, 2).join(' ');
  }

  // ========================================================================
  // PRIORIDAD 2: EL VENDEDOR
  // ========================================================================
  if (!issuerName) {
    for (const line of lines) {
      if (/\b(VENDEDOR|VENDIDO POR|PROPIETARIO)\b/i.test(line)) {
        let cleanLine = destroyRUC(line)
          .replace(/\b(VENDEDOR|VENDIDO POR|PROPIETARIO)[:.-]?\b/g, '')
          .replace(/[^A-Z0-9\s\-&.]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
          
        if (cleanLine.length > 3 && /[A-Z]{3,}/.test(cleanLine) && !blacklist.test(cleanLine)) {
          issuerName = cleanLine;
          break; 
        }
      }
    }
  }

  // ========================================================================
  // PRIORIDAD 3: EL REMITENTE
  // ========================================================================
  if (!issuerName) {
    for (const line of lines) {
      if (/\b(REMITENTE|EMISOR)\b/i.test(line)) {
        let cleanLine = destroyRUC(line)
          .replace(/\b(REMITENTE|EMISOR)[:.-]?\b/g, '')
          .replace(/[^A-Z0-9\s\-&.]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
          
        if (cleanLine.length > 3 && /[A-Z]{3,}/.test(cleanLine) && !blacklist.test(cleanLine)) {
          issuerName = cleanLine;
          break; 
        }
      }
    }
  }

  // ========================================================================
  // RED DE SEGURIDAD
  // ========================================================================
  if (!issuerName) {
    const fallbackLines = lines.slice(0, 6).filter(l => !blacklist.test(l) && /[A-Z]{3,}/.test(l));
    issuerName = fallbackLines.length > 0 ? destroyRUC(fallbackLines[0]) : "EMPRESA";
  }

  // Limpieza estética final
  issuerName = issuerName.replace(/[^A-Z0-9\s\-&.]/g, '').replace(/\s+/g, ' ').trim();
  if (issuerName.length > 120) issuerName = issuerName.substring(0, 120).trim();
  
  // SEGURO DE VIDA FINAL: Si después de todo la variable quedó con puros números, se resetea.
  if (issuerName.length < 3 || !/[A-Z]/.test(issuerName)) {
    issuerName = "EMPRESA"; 
  }

  return { datePart, invoicePart, issuerName };
}