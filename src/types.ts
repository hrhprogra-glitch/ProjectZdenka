// src/types.ts
export interface ProcessedFile {
  id: string;
  originalName: string;
  newName: string;
  fileBlob: File;
}