// src/utils/pdfProcessor.ts
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';
import type { ProcessedFile } from '../types';

// IMPORTAMOS EL NUEVO ANALIZADOR INTELIGENTE
import { extractAccurateData } from './invoiceAnalyzer';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export const processFiles = async (
  files: FileList | File[],
  onProgress: (msg: string) => void
): Promise<ProcessedFile[]> => {
  const newProcessedList: ProcessedFile[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      // ---------------------------------------------
      // CASO 1: IMÁGENES (JPG, PNG)
      // ---------------------------------------------
      if (file.type.startsWith('image/')) {
        onProgress(`🖼️ Mejorando resolución y leyendo imagen ${i + 1}/${files.length}...`);
        
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise((resolve) => { img.onload = resolve; });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        // Escala extrema para que Tesseract lea a la perfección
        canvas.width = img.width * 3.0;
        canvas.height = img.height * 3.0;
        
        if (context) {
          context.filter = 'contrast(1.6) grayscale(1)';
          context.scale(3.0, 3.0);
          context.drawImage(img, 0, 0);
        }
        
        const scaledImgUrl = canvas.toDataURL('image/png');
        URL.revokeObjectURL(img.src);

        // Pasamos el OCR
        const { data: { text } } = await Tesseract.recognize(scaledImgUrl, 'spa');
        
        // DELEGAMOS EL ANÁLISIS AL NUEVO ARCHIVO
        const { datePart, invoicePart, issuerName } = extractAccurateData(text);

        // OPCIÓN 1: Separado solo por espacios
        const generatedName = `${datePart} ${issuerName} ${invoicePart}.${file.name.split('.').pop()}`
          .replace(/[^a-zA-Z0-9.\-_ ]/g, '').trim();

        newProcessedList.push({
          id: `img-${Date.now()}-${i}`,
          originalName: file.name,
          newName: generatedName,
          fileBlob: file
        });
      } 
      // ---------------------------------------------
      // CASO 2: DOCUMENTOS PDF
      // ---------------------------------------------
      else if (file.type === 'application/pdf') {
        onProgress(`📄 Analizando PDF: ${file.name}...`);
        
        const arrayBuffer = await file.arrayBuffer();
        const pdfLibDoc = await PDFDocument.load(arrayBuffer);
        const totalPages = pdfLibDoc.getPageCount();

        const typedArray = new Uint8Array(arrayBuffer);
        const pdfjsDoc = await pdfjsLib.getDocument({ data: typedArray }).promise;

        for (let p = 0; p < totalPages; p++) {
          onProgress(`✂️ Extrayendo y procesando factura de la pág ${p + 1} de ${totalPages}...`);
          
          const page = await pdfjsDoc.getPage(p + 1);
          // Escala 3.0 asegura que hasta la letra más pequeña sea detectada
          const viewport = page.getViewport({ scale: 3.0 }); 
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          let pageText = "";
          
          if (context) {
            // Ajuste de brillo moderado para no borrar tinta débil en PDFs
            context.filter = 'contrast(1.5) grayscale(1)';
            await page.render({ canvasContext: context, viewport } as any).promise;
            const imgDataUrl = canvas.toDataURL('image/png');
            
            const { data: { text } } = await Tesseract.recognize(imgDataUrl, 'spa');
            pageText = text;
          }

          // DELEGAMOS EL ANÁLISIS AL NUEVO ARCHIVO
          const { datePart, invoicePart, issuerName } = extractAccurateData(pageText);

          // Cortar página actual y crear PDF nuevo
          const newSinglePdf = await PDFDocument.create();
          const [copiedPage] = await newSinglePdf.copyPages(pdfLibDoc, [p]);
          newSinglePdf.addPage(copiedPage);
          const newPdfBytes = await newSinglePdf.save();

          // OPCIÓN 1: Separado solo por espacios
          const generatedName = `${datePart} ${issuerName} ${invoicePart}.pdf`
            .replace(/[^a-zA-Z0-9.\-_ ]/g, '').trim();

          const newBlob = new File([newPdfBytes as any], generatedName, { type: 'application/pdf' });

          newProcessedList.push({
            id: `pdf-${Date.now()}-${i}-pag${p + 1}`,
            originalName: `${file.name} (Pág ${p + 1})`,
            newName: generatedName,
            fileBlob: newBlob
          });
        }
      }
    } catch (error) {
      console.error(`Error procesando el archivo ${file.name}:`, error);
      newProcessedList.push({
        id: `error-${Date.now()}-${i}`,
        originalName: file.name,
        newName: `ERROR_AL_PROCESAR_${file.name}`,
        fileBlob: file as File
      });
    }
  }

  return newProcessedList;
};