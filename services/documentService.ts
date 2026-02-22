import { apiDelete, apiGet, apiPost, API_BASE_URL } from './apiClient';
import { Platform } from 'react-native';

export interface DocumentRecord {
  id: string;
  name: string;
  originalName?: string;
  fileName?: string;
  filePath?: string;
  mimeType?: string;
  size?: number;
  type?: 'document' | 'scan';
  createdAt?: string;
  updatedAt?: string;
}

export interface UploadDocumentFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
  webFile?: any;
}

const normalizeDocument = (doc: any): DocumentRecord => ({
  id: doc?.id || doc?._id,
  name: doc?.name || doc?.originalName || doc?.fileName || 'Untitled document',
  originalName: doc?.originalName,
  fileName: doc?.fileName,
  filePath: doc?.filePath,
  mimeType: doc?.mimeType,
  size: doc?.size,
  type: doc?.type || 'document',
  createdAt: doc?.createdAt,
  updatedAt: doc?.updatedAt,
});

export const buildDocumentUrl = (doc: DocumentRecord) => {
  const filePath = doc.filePath;
  if (!filePath) return undefined;
  return `${API_BASE_URL}/${filePath.replace(/^\/+/, '')}`;
};

export const fetchDocuments = async (): Promise<DocumentRecord[]> => {
  const response: any = await apiGet('/api/v1/documents');
  const data = response?.data ?? response ?? [];
  if (!Array.isArray(data)) return [];
  return data.map(normalizeDocument);
};

const appendDocumentFile = async (formData: FormData, file: UploadDocumentFile) => {
  if (Platform.OS === 'web') {
    if (file.webFile) {
      formData.append('document', file.webFile as any, file.name);
      return;
    }

    if (file.uri) {
      const uri = String(file.uri);
      if (uri.startsWith('blob:') || uri.startsWith('data:') || uri.startsWith('http')) {
        const blobResponse = await fetch(uri);
        const blob = await blobResponse.blob();
        formData.append('document', blob as any, file.name);
        return;
      }
    }
  }

  formData.append('document', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as any);
};

export const uploadDocument = async (
  file: UploadDocumentFile,
  options: { type?: 'document' | 'scan'; name?: string } = {}
): Promise<DocumentRecord> => {
  const formData = new FormData();
  await appendDocumentFile(formData, file);

  if (options.type) {
    formData.append('type', options.type);
  }
  if (options.name) {
    formData.append('name', options.name);
  }

  const response: any = await apiPost('/api/v1/documents', formData);
  return normalizeDocument(response?.data ?? response);
};

export const deleteDocument = async (id: string) => {
  await apiDelete(`/api/v1/documents/${id}`);
};
