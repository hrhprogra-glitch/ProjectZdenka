// src/components/FileUploader.tsx
import type { ChangeEvent } from 'react';

interface FileUploaderProps {
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  isProcessing: boolean;
  progressMsg: string;
}

export default function FileUploader({ onFileUpload, isProcessing, progressMsg }: FileUploaderProps) {
  return (
    <div style={{ padding: '30px', border: '2px dashed #aa3bff', borderRadius: '10px', backgroundColor: '#fff', marginBottom: '20px' }}>
      <input 
        type="file" 
        accept="application/pdf, image/png, image/jpeg, image/jpg" 
        multiple 
        onChange={onFileUpload}
        disabled={isProcessing}
        style={{ marginBottom: '10px', fontSize: '16px' }}
      />
      
      {isProcessing && (
        <div style={{ marginTop: '15px', color: '#aa3bff', fontWeight: 'bold' }}>
          ⏳ {progressMsg}
        </div>
      )}
    </div>
  );
}