import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

// CONFIGURACIÓN: Usar el archivo local de tu proyecto para Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

interface ProcessedFile {
  id: string;
  originalName: string;
  newName: string;
  fileBlob: File;
}

export default function App() {
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 }); // <-- Aquí está la variable

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: files.length });
    
    const newProcessedList: ProcessedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const uploadedFile = files[i];
      setProgress((prev) => ({ ...prev, current: i + 1 })); // <-- Aquí se actualiza

      try {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const typedArray = new Uint8Array(arrayBuffer);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        
        const page = await pdf.getPage(1);
        const textContent = await page.getTextContent();
        
        const textItems = textContent.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ');

        // Buscar Fecha
        const dateMatch = textItems.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        let datePart = "00.00.00";
        if (dateMatch) {
          datePart = `${dateMatch[1]}.${dateMatch[2]}.${dateMatch[3].slice(-2)}`;
        }

        // Buscar Número de Factura
        const invoiceMatch = textItems.match(/[EFB]\d{3}-\d+/);
        const invoicePart = invoiceMatch ? invoiceMatch[0] : "SIN-FACTURA";

        // Buscar Emisor
        let issuerPart = "EMISOR_DESCONOCIDO";
        if (textContent.items.length > 0) {
            const firstValidItem = textContent.items.find(
              (item) => 'str' in item && item.str.trim().length > 5
            );
            if (firstValidItem && 'str' in firstValidItem) {
              issuerPart = firstValidItem.str.trim();
            }
        }

        // Construir el nuevo nombre
        const generatedName = `${datePart}_${issuerPart}_${invoicePart}.pdf`
          .replace(/[^a-zA-Z0-9.\-_ ]/g, '') 
          .replace(/\s+/g, ' ')
          .trim();

        newProcessedList.push({
          id: `${uploadedFile.name}-${i}-${Date.now()}`,
          originalName: uploadedFile.name,
          newName: generatedName,
          fileBlob: uploadedFile
        });

      } catch (error) {
        console.error(`Error procesando el archivo ${uploadedFile.name}:`, error);
        newProcessedList.push({
          id: `${uploadedFile.name}-${i}-${Date.now()}`,
          originalName: uploadedFile.name,
          newName: `ERROR_AL_PROCESAR_${uploadedFile.name}`,
          fileBlob: uploadedFile
        });
      }
    }

    setProcessedFiles(prev => [...prev, ...newProcessedList]);
    setIsProcessing(false);
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
    setProgress({ current: 0, total: 0 }); // Limpiamos el progreso para que muestre el mensaje de ZIP

    try {
      const zip = new JSZip();

      processedFiles.forEach((fileData) => {
        zip.file(fileData.newName, fileData.fileBlob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });

      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Facturas_Renombradas_${new Date().getTime()}.zip`; 
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setProcessedFiles([]);

    } catch (error) {
      console.error("Error al crear el archivo ZIP:", error);
      alert("Ocurrió un error al intentar comprimir los archivos.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setProcessedFiles([]);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>Transformador Masivo de Facturas 📄✨</h1>
      <p>Sube tus archivos PDF. Puedes descargarlos uno por uno o todos juntos en un ZIP.</p>

      <div style={{ padding: '30px', border: '2px dashed #aa3bff', borderRadius: '10px', backgroundColor: '#fff', marginBottom: '20px' }}>
        <input 
          type="file" 
          accept="application/pdf" 
          multiple 
          onChange={handleFileUpload}
          disabled={isProcessing}
          style={{ marginBottom: '10px', fontSize: '16px' }}
        />
        
        {/* SOLUCIÓN: Usamos la variable 'progress' de forma dinámica en la interfaz */}
        {isProcessing && (
          <div style={{ marginTop: '15px', color: '#aa3bff', fontWeight: 'bold' }}>
            {progress.total > 0 
              ? `⏳ Analizando PDFs: ${progress.current} de ${progress.total} archivos...` 
              : `📦 Empaquetando todo en archivo ZIP...`}
          </div>
        )}
      </div>

      {processedFiles.length > 0 && !isProcessing && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e5e4e7', borderRadius: '10px', padding: '20px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#08060d' }}>Resultados ({processedFiles.length} archivos):</h3>
          </div>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px', border: '1px solid #f4f3ec', borderRadius: '5px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f4f3ec', textAlign: 'left' }}>
                  <th style={{ padding: '12px 10px' }}>Nombre Original</th>
                  <th style={{ padding: '12px 10px' }}>Nuevo Nombre Sugerido</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {processedFiles.map((fileData) => (
                  <tr key={fileData.id} style={{ borderBottom: '1px solid #e5e4e7', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '10px', color: '#6b6375', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fileData.originalName}>
                      {fileData.originalName}
                    </td>
                    <td style={{ padding: '10px', color: '#2e7d32', fontWeight: 'bold' }}>
                      {fileData.newName}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDownloadSingle(fileData)}
                        style={{ padding: '6px 12px', backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                        title="Descargar solo este archivo"
                      >
                        ⬇️ Descargar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button 
              onClick={handleCancel}
              style={{ padding: '12px 20px', backgroundColor: '#e5e4e7', color: '#333', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              🧹 Limpiar Tabla
            </button>
            
            <button 
              onClick={handleDownloadZipAndReset}
              style={{ padding: '12px 25px', backgroundColor: '#aa3bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
            >
              📦 Descargar Todo en ZIP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}