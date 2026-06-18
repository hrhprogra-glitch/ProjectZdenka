// src/utils/invoiceExtractor.ts

export function extractInvoice(text: string): string {
  // 1. Limpieza inicial: todo a mayúsculas
  let cleanText = text.replace(/\n/g, ' ').toUpperCase();

  // ==========================================
  // SUPERPODER 1: TRADUCTOR OCR PARA LA SERIE (Ej: FOO1 -> F001)
  // Si el OCR lee letras redondas en la serie, las fuerza a cero.
  // ==========================================
  const fixSeries = (serie: string) => {
    return serie
      .replace(/[OQDo]/g, '0')
      .replace(/[ILl|]/g, '1')
      .replace(/[Zz]/g, '2')
      .replace(/[Ss]/g, '5');
  };

  // ==========================================
  // SUPERPODER 2: TRADUCTOR OCR PARA EL NÚMERO (Ej: 123O -> 1230)
  // Asegura que la numeración final sean números matemáticos puros.
  // ==========================================
  const fixNumbers = (num: string) => {
    return num
      .replace(/[OQDo]/g, '0')
      .replace(/[IlL|]/g, '1')
      .replace(/[Zz]/g, '2')
      .replace(/[Ss]/g, '5')
      .replace(/[Bb]/g, '8')
      .replace(/[Gg]/g, '6')
      .replace(/[Tt]/g, '7');
  };

  // ========================================================================
  // ESTRATEGIA 1: FRANCOTIRADOR CON ANCLA (La más precisa)
  // Busca las palabras "FACTURA", "BOLETA" o "TICKET" y atrapa el código 
  // que esté inmediatamente al lado. ¡No falla!
  // ========================================================================
  const anchorRegex = /(?:FACTURA|BOLETA|TICKET|ELECTRONICA|COMPROBANTE|RECIBO|FOLIO)[\s\S]{0,45}?\b([A-Z0-9]{3,4})\s*[-_.,:\s]+\s*([0-9OIlZSB]{3,10})\b/i;
  const matchAnchor = cleanText.match(anchorRegex);
  if (matchAnchor) {
    const serie = fixSeries(matchAnchor[1]);
    const numeracion = fixNumbers(matchAnchor[2]);
    // Verificamos que sea una serie válida en Perú (F001, B002, E001, o puros números)
    if (/^[A-Z0-9]{3,4}$/.test(serie)) {
       return `${serie}-${numeracion}`;
    }
  }

  // ========================================================================
  // ESTRATEGIA 2: FORMATOS LARGOS DE TRANSPORTE (ENC-2606-000359, EG07-...)
  // ========================================================================
  const complexRegex = /\b(ENC|ALC|EG[A-Z0-9]{2})\s*[-_.,\s]+\s*([A-Z0-9]{2,6})\s*[-_.,\s]+\s*([0-9OIlZSB]{3,10})\b/i;
  const matchComplex = cleanText.match(complexRegex);
  if (matchComplex) {
    return `${matchComplex[1]}-${fixSeries(matchComplex[2])}-${fixNumbers(matchComplex[3])}`;
  }

  // ========================================================================
  // ESTRATEGIA 3: FACTURAS ESTÁNDAR (F001-003196) CON BASURA EN MEDIO
  // ========================================================================
  const standardRegex = /\b([FBET][A-Z0-9]{2,3})\s*[-_.,\s]+\s*([0-9OIlZSB]{3,10})\b/i;
  const matchStandard = cleanText.match(standardRegex);
  if (matchStandard) {
    return `${fixSeries(matchStandard[1])}-${fixNumbers(matchStandard[2])}`;
  }

  // ========================================================================
  // ESTRATEGIA 4: NÚMEROS SUELTOS (001-0003196)
  // Por si es una factura física antigua o el escáner le cortó la letra 'F'.
  // ========================================================================
  const physicalRegex = /\b([0-9OIlZSB]{3,4})\s*[-_.,]\s*([0-9OIlZSB]{4,10})\b/i;
  const matchPhysical = cleanText.match(physicalRegex);
  if (matchPhysical) {
    const serie = fixNumbers(matchPhysical[1]);
    const numeracion = fixNumbers(matchPhysical[2]);
    if (/^\d{3,4}$/.test(serie)) {
       return `${serie}-${numeracion}`;
    }
  }

  // ========================================================================
  // ESTRATEGIA 5: BORROSIDAD EXTREMA - FACTURA PEGADA (F0010003196)
  // Si el guion desapareció por la mala calidad de imagen.
  // ========================================================================
  const joinedRegex = /\b([FBET][A-Z0-9]{2,3})([0-9OIlZSB]{4,10})\b/i;
  const matchJoined = cleanText.match(joinedRegex);
  if (matchJoined) {
    return `${fixSeries(matchJoined[1])}-${fixNumbers(matchJoined[2])}`;
  }

  // ========================================================================
  // ESTRATEGIA 6: LETRAS SEPARADAS POR ESPACIOS (F 0 0 1 - 0 0 0 1 2 3)
  // En tickets térmicos a veces el OCR lee espacios entre cada letra.
  // ========================================================================
  const spaceRegex = /\b([FBET])\s*([0-9OIlZSB])\s*([0-9OIlZSB])\s*([0-9OIlZSB])\s*[-_.,]\s*([0-9OIlZSB\s]{4,15})\b/i;
  const matchSpace = cleanText.match(spaceRegex);
  if (matchSpace) {
    const serie = `${matchSpace[1]}${fixSeries(matchSpace[2])}${fixSeries(matchSpace[3])}${fixSeries(matchSpace[4])}`;
    const numeracion = fixNumbers(matchSpace[5].replace(/\s+/g, '')); // Comprime los espacios
    return `${serie}-${numeracion}`;
  }

  // Si no logra hallar nada válido, devuelve este valor limpio.
  return "SIN-FACTURA";
}