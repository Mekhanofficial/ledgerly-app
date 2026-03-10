import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';

const DEFAULT_CONTENT_TYPE = 'application/pdf';
const DEFAULT_ENCODING = 'base64';
const DEFAULT_MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;
const BASE64_CHUNK_SIZE = 0x8000;

export interface EmailPdfAttachmentPayload {
  fileName: string;
  contentType: string;
  encoding: string;
  data: string;
  source: string;
}

interface BuildPdfAttachmentOptions {
  html: string;
  fileName?: string;
  source?: string;
  maxBytes?: number;
}

const sanitizeFileName = (value?: string, fallback = 'document.pdf') => {
  const candidate = String(value || '')
    .trim()
    .replace(/[<>:"/\\|?*]/g, '');
  if (!candidate) return fallback;
  return candidate.toLowerCase().endsWith('.pdf') ? candidate : `${candidate}.pdf`;
};

const normalizeBase64 = (value?: string) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.includes('base64,')) {
    return String(raw.split('base64,').pop() || '').trim();
  }
  return raw;
};

const getBase64ByteSize = (base64: string) => {
  const normalized = normalizeBase64(base64);
  if (!normalized) return 0;
  const padding = normalized.endsWith('==') ? 2 : normalized.endsWith('=') ? 1 : 0;
  return Math.floor((normalized.length * 3) / 4) - padding;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  if (typeof btoa !== 'function') return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (let i = 0; i < bytes.length; i += BASE64_CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + BASE64_CHUNK_SIZE);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
};

const readBase64FromUri = async (uri?: string) => {
  const value = String(uri || '').trim();
  if (!value) return '';

  if (value.startsWith('file://')) {
    try {
      const fileBase64 = await FileSystem.readAsStringAsync(value, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return normalizeBase64(fileBase64);
    } catch {
      return '';
    }
  }

  try {
    const response = await fetch(value);
    if (!response.ok) return '';
    const buffer = await response.arrayBuffer();
    return normalizeBase64(arrayBufferToBase64(buffer));
  } catch {
    return '';
  }
};

export const buildPdfEmailAttachmentFromHtml = async ({
  html,
  fileName = 'document.pdf',
  source = 'frontend-expo-print',
  maxBytes = DEFAULT_MAX_ATTACHMENT_BYTES,
}: BuildPdfAttachmentOptions): Promise<EmailPdfAttachmentPayload | null> => {
  const htmlContent = String(html || '').trim();
  if (!htmlContent) return null;

  const printed = await Print.printToFileAsync({
    html: htmlContent,
    base64: true,
  });

  let base64 = normalizeBase64(printed?.base64);
  if (!base64) {
    base64 = await readBase64FromUri(printed?.uri);
  }

  if (!base64) {
    return null;
  }

  const size = getBase64ByteSize(base64);
  if (!size || size > maxBytes) {
    throw new Error(
      `Generated PDF attachment is invalid or too large (${Math.round(size / (1024 * 1024))}MB).`
    );
  }

  return {
    fileName: sanitizeFileName(fileName, 'document.pdf'),
    contentType: DEFAULT_CONTENT_TYPE,
    encoding: DEFAULT_ENCODING,
    data: base64,
    source,
  };
};
