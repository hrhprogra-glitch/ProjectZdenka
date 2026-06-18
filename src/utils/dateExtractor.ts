// src/utils/dateExtractor.ts

export function extractDate(text: string): string {
  let workingText = text.replace(/\n/g, ' ').toUpperCase();

  // ==========================================
  // SUPERPODER 1: TRADUCTOR DE MESES ESCRITOS
  // ==========================================
  const monthMap: Record<string, string> = {
    'ENE': '01', 'FEB': '02', 'MAR': '03', 'ABR': '04', 'MAY': '05', 'JUN': '06',
    'JUL': '07', 'AGO': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DIC': '12'
  };

  const textDateRegex = /\b(\d{1,2})\s*(?:DE|DEL|-|\/)?\s*(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)[A-Z]*\s*(?:DE|DEL|-|\/)?\s*(202\d|2\d)\b/i;
  const textDateMatch = workingText.match(textDateRegex);
  if (textDateMatch) {
    const day = textDateMatch[1].padStart(2, '0');
    const month = monthMap[textDateMatch[2].substring(0, 3).toUpperCase()];
    const year = textDateMatch[3].length === 2 ? `20${textDateMatch[3]}` : textDateMatch[3];
    return `${day}.${month}.${year.slice(-2)}`;
  }

  // ==========================================
  // SUPERPODER 2: EL TRADUCTOR OCR DEFINITIVO
  // ==========================================
  const fixOcrNumbers = (str: string) => {
    return str
      .replace(/[OQDo]/g, '0')
      .replace(/[IlL|]/g, '1')
      .replace(/[Zz]/g, '2')
      .replace(/[Aa]/g, '4')
      .replace(/[Ss]/g, '5')
      .replace(/[Gg]/g, '6')
      .replace(/[Tt]/g, '7')
      .replace(/[Bb]/g, '8');
  };

  const fullyFixedText = fixOcrNumbers(workingText);

  const isValidAndFormat = (d: string, m: string, y: string) => {
    const day = parseInt(d, 10);
    const month = parseInt(m, 10);
    let year = parseInt(y, 10);
    if (y.length === 2) year = 2000 + year;

    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2020 && year <= 2030) {
      if (month === 2 && day > 29) return null;
      return `${d.padStart(2, '0')}.${m.padStart(2, '0')}.${year.toString().slice(-2)}`;
    }
    return null;
  };

  // ==========================================
  // ESTRATEGIA 1: FRANCOTIRADOR CON TOLERANCIA A ESPACIOS E IMPRESIÓN
  // (Añadimos "IMP" y toleramos el ":" como separador)
  // ==========================================
  const targetedRegex = /(?:F\s*E\s*C\s*H\s*A|E\s*M\s*I\s*S\s*I\s*[O0]\s*N|I\s*M\s*P|F\s*[UUE]\s*C)[\s\S]{0,45}?(\d{1,2})[\s\/\-\.,_:]+(\d{1,2})[\s\/\-\.,_:]+(\d{2,4})/i;
  const matchTarget = fullyFixedText.match(targetedRegex);
  if (matchTarget) {
    const formatted = isValidAndFormat(matchTarget[1], matchTarget[2], matchTarget[3]);
    if (formatted) return formatted;
  }

  // ==========================================
  // ESTRATEGIA 2: BÚSQUEDA DE FORMATOS COMPLETOS EN CUALQUIER PARTE
  // (Ahora tolera el ":" en caso de que el OCR lea 15:06:2026)
  // ==========================================
  const scatteredRegex = /\b([0-3]?\d)[\s\/\-\.,_:]+([0-1]?\d)[\s\/\-\.,_:]+(202\d|2\d)\b/g;
  const allMatches = [...fullyFixedText.matchAll(scatteredRegex)];
  for (const match of allMatches) {
    const formatted = isValidAndFormat(match[1], match[2], match[3]);
    if (formatted) return formatted; 
  }

  const reverseRegex = /\b(202\d|2\d)[\s\/\-\.,_:]+([0-1]?\d)[\s\/\-\.,_:]+([0-3]?\d)\b/g;
  const allReverseMatches = [...fullyFixedText.matchAll(reverseRegex)];
  for (const match of allReverseMatches) {
    const formatted = isValidAndFormat(match[3], match[2], match[1]); 
    if (formatted) return formatted; 
  }

  // ==========================================
  // ESTRATEGIA 3: FECHAS FUSIONADAS
  // ==========================================
  const joinedDateRegex = /\b([0-3]\d)([0-1]\d)(202\d|2\d)\b/g; 
  const allJoinedMatches = [...fullyFixedText.matchAll(joinedDateRegex)];
  for (const match of allJoinedMatches) {
    const formatted = isValidAndFormat(match[1], match[2], match[3]);
    if (formatted) return formatted;
  }

  return "00.00.00"; 
}