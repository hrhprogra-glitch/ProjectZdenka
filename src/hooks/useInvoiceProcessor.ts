// src/hooks/useInvoiceProcessor.ts
import { useState } from 'react';
import type { ChangeEvent } from 'react';
import JSZip from 'jszip';
import type { ProcessedFile } from '../types';
import { processFiles } from '../utils/pdfProcessor';

export function useInvoiceProcessor() {
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    
    const results = await processFiles(files, setProgressMsg);
    
    setProcessedFiles(prev => [...prev, ...results]);
    setIsProcessing(false);
    setProgressMsg('');
    event.target.value = '';
  };

  const handleDownloadSingle = (fileData: ProcessedFile) => {
    const url = URL.createObjectURL(fileData.fileBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileData.newName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZipAndReset = async () => {
    if (processedFiles.length === 0) return;
    setIsProcessing(true);
    setProgressMsg('📦 Empaquetando todo en archivo ZIP...');

    try {
      const zip = new JSZip();
      processedFiles.forEach((fileData) => {
        zip.file(fileData.newName, fileData.fileBlob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Facturas_Renombradas_y_Divididas_${new Date().getTime()}.zip`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setProcessedFiles([]);
    } catch (error) {
      console.error("Error al crear ZIP:", error);
      alert("Ocurrió un error al intentar comprimir los archivos.");
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const handleClear = () => {
    setProcessedFiles([]);
  };

  return {
    processedFiles,
    isProcessing,
    progressMsg,
    handleFileUpload,
    handleDownloadSingle,
    handleDownloadZipAndReset,
    handleClear
  };
}