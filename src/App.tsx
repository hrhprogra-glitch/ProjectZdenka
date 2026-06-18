// src/App.tsx
import Header from './components/Header';
import FileUploader from './components/FileUploader';
import ResultsTable from './components/ResultsTable';
import { useInvoiceProcessor } from './hooks/useInvoiceProcessor';

export default function App() {
  const {
    processedFiles,
    isProcessing,
    progressMsg,
    handleFileUpload,
    handleDownloadSingle,
    handleDownloadZipAndReset,
    handleClear
  } = useInvoiceProcessor();

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', fontFamily: 'sans-serif', padding: '20px' }}>
      
      <Header />
      
      <FileUploader 
        onFileUpload={handleFileUpload} 
        isProcessing={isProcessing} 
        progressMsg={progressMsg} 
      />

      <ResultsTable 
        processedFiles={processedFiles}
        isProcessing={isProcessing}
        onDownloadSingle={handleDownloadSingle}
        onClear={handleClear}
        onDownloadZip={handleDownloadZipAndReset}
      />

    </div>
  );
}