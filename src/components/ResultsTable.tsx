// src/components/ResultsTable.tsx
import type { ProcessedFile } from '../types';

interface ResultsTableProps {
  processedFiles: ProcessedFile[];
  isProcessing: boolean;
  onDownloadSingle: (fileData: ProcessedFile) => void;
  onClear: () => void;
  onDownloadZip: () => void;
}

export default function ResultsTable({ 
  processedFiles, 
  isProcessing, 
  onDownloadSingle, 
  onClear, 
  onDownloadZip 
}: ResultsTableProps) {
  
  if (processedFiles.length === 0 || isProcessing) return null;

  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #e5e4e7', borderRadius: '10px', padding: '20px', textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, color: '#08060d' }}>Resultados ({processedFiles.length} archivos detectados):</h3>
      </div>
      
      <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px', border: '1px solid #f4f3ec', borderRadius: '5px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f4f3ec', textAlign: 'left' }}>
              <th style={{ padding: '12px 10px' }}>Archivo Original (Origen)</th>
              <th style={{ padding: '12px 10px' }}>Nuevo Nombre / Archivo Dividido</th>
              <th style={{ padding: '12px 10px', textAlign: 'center' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {processedFiles.map((fileData) => (
              <tr key={fileData.id} style={{ borderBottom: '1px solid #e5e4e7' }}>
                <td style={{ padding: '10px', color: '#6b6375' }}>
                  {fileData.originalName}
                </td>
                <td style={{ padding: '10px', color: '#2e7d32', fontWeight: 'bold' }}>
                  {fileData.newName}
                </td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <button 
                    onClick={() => onDownloadSingle(fileData)}
                    style={{ padding: '6px 12px', backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    ⬇️ Bajar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
        <button 
          onClick={onClear}
          style={{ padding: '12px 20px', backgroundColor: '#e5e4e7', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          🧹 Limpiar
        </button>
        <button 
          onClick={onDownloadZip}
          style={{ padding: '12px 25px', backgroundColor: '#aa3bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          📦 Descargar Todo en ZIP
        </button>
      </div>
    </div>
  );
}