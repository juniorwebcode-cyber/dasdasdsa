import { upload as vercelBlobClientUpload } from '@vercel/blob/client';
import { auth } from '../lib/firebase';
import type { MediaAsset } from '../types/realEstate';
import {
  compressImageHighQuality,
  compressVideoHighQuality,
  formatBytes
} from '../utils/mediaCompression';
import { getStoredAdminToken, saveMediaAsset } from './adminStoreService';

export interface UploadedMediaResult {
  url: string;
  fileName: string;
  contentType: string;
  originalSizeBytes: number;
  uploadedSizeBytes: number;
  savingsPercent: number;
  wasCompressed: boolean;
  storageProvider: 'vercel_blob' | 'local_asset';
  mediaKind: 'image' | 'video' | 'document';
}

export interface UploadMediaOptions {
  category?: MediaAsset['category'];
  compressVideo?: boolean;
  compressionAbortSignal?: AbortSignal;
  onStageChange?: (stage: 'compressing' | 'uploading', progressPercent: number, detail?: string) => void;
}

async function getAdminAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const sessionToken = getStoredAdminToken();
  if (sessionToken) {
    headers.Authorization = `Bearer ${sessionToken}`;
  }
  if (auth.currentUser) {
    try {
      const idToken = await auth.currentUser.getIdToken();
      if (idToken) {
        headers['x-firebase-id-token'] = idToken;
      }
    } catch {
      // Ignore Firebase ID token lookup error
    }
  }
  return headers;
}

function uploadViaStreamWithProgress(
  file: File,
  folder: string,
  authHeaders: Record<string, string>,
  onProgress?: (percent: number) => void
): Promise<{
  url: string;
  contentType: string;
  sizeBytes?: number;
  storageProvider: 'vercel_blob' | 'local_asset';
}> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/blob/upload-stream', true);
    xhr.withCredentials = true;

    Object.entries(authHeaders).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.setRequestHeader('x-file-name', encodeURIComponent(file.name));
    xhr.setRequestHeader('x-content-type', file.type || 'application/octet-stream');
    xhr.setRequestHeader('x-folder', folder);
    xhr.setRequestHeader('x-file-size', String(file.size));

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && ev.total > 0) {
        onProgress?.(Math.min(99, Math.round((ev.loaded / ev.total) * 100)));
      }
    };

    xhr.onload = () => {
      try {
        const parsed = JSON.parse(xhr.responseText || '{}') as {
          url?: string;
          contentType?: string;
          sizeBytes?: number;
          storageProvider?: 'vercel_blob' | 'local_asset';
          error?: string;
        };
        if (xhr.status >= 200 && xhr.status < 300 && parsed.url) {
          onProgress?.(100);
          resolve({
            url: parsed.url,
            contentType: parsed.contentType || file.type || 'application/octet-stream',
            sizeBytes: parsed.sizeBytes || file.size,
            storageProvider: parsed.storageProvider || 'local_asset'
          });
        } else {
          if (xhr.status === 413) {
            reject(
              new Error(
                'O arquivo excedeu o limite do servidor (4,5 MB). Verifique a configuração do Vercel Blob.'
              )
            );
            return;
          }
          reject(new Error(parsed.error || `Falha no envio (HTTP ${xhr.status}).`));
        }
      } catch {
        if (xhr.status === 413) {
          reject(
            new Error(
              'O arquivo excedeu o limite do servidor (4,5 MB). Verifique a configuração do Vercel Blob.'
            )
          );
          return;
        }
        reject(new Error(`Resposta inválida do servidor (HTTP ${xhr.status}).`));
      }
    };

    xhr.onerror = () => reject(new Error('Falha de rede durante o envio do arquivo.'));
    xhr.send(file);
  });
}

let cachedBlobHealth: { configured: boolean; checkedAt: number } | null = null;

async function isVercelBlobConfigured(): Promise<boolean> {
  const now = Date.now();
  if (cachedBlobHealth && cachedBlobHealth.configured && now - cachedBlobHealth.checkedAt < 60_000) {
    return true;
  }
  try {
    const res = await fetch('/api/health', { cache: 'no-store' });
    if (!res.ok) return false;
    const data = (await res.json()) as { blobConfigured?: boolean };
    const configured = Boolean(data.blobConfigured);
    if (configured) {
      cachedBlobHealth = { configured: true, checkedAt: now };
    }
    return configured;
  } catch {
    return false;
  }
}

export async function uploadMediaWithCompression(
  rawFile: File,
  options?: UploadMediaOptions
): Promise<UploadedMediaResult> {
  const category: MediaAsset['category'] = options?.category || 'imovel';
  const isImage = rawFile.type.startsWith('image/');
  const isVideo = rawFile.type.startsWith('video/');
  const mediaKind: UploadedMediaResult['mediaKind'] = isImage
    ? 'image'
    : isVideo
      ? 'video'
      : 'document';

  let fileToUpload = rawFile;
  let originalSizeBytes = rawFile.size;
  let finalSizeBytes = rawFile.size;
  let wasCompressed = false;
  let savingsPercent = 0;

  if (isImage) {
    options?.onStageChange?.('compressing', 15, 'Otimizando imagem em alta nitidez...');
    const compressed = await compressImageHighQuality(rawFile, {
      maxDimension: 2048,
      quality: 0.88
    });
    fileToUpload = compressed.file;
    originalSizeBytes = compressed.originalSizeBytes;
    finalSizeBytes = compressed.finalSizeBytes;
    wasCompressed = compressed.wasCompressed;
    savingsPercent = compressed.savingsPercent;
    options?.onStageChange?.(
      'compressing',
      100,
      wasCompressed
        ? `Comprimido: ${formatBytes(originalSizeBytes)} → ${formatBytes(finalSizeBytes)} (-${savingsPercent}%)`
        : `${formatBytes(finalSizeBytes)} (já otimizada)`
    );
  } else if (isVideo && options?.compressVideo !== false) {
    options?.onStageChange?.('compressing', 5, 'Otimizando vídeo em Full HD...');
    const compressed = await compressVideoHighQuality(rawFile, {
      maxDimension: 1920,
      videoBitsPerSecond: 3_200_000,
      signal: options?.compressionAbortSignal,
      onProgress: (pct) =>
        options?.onStageChange?.('compressing', pct, `Comprimindo vídeo (${pct}%)...`)
    });
    fileToUpload = compressed.file;
    originalSizeBytes = compressed.originalSizeBytes;
    finalSizeBytes = compressed.finalSizeBytes;
    wasCompressed = compressed.wasCompressed;
    savingsPercent = compressed.savingsPercent;
  }

  options?.onStageChange?.(
    'uploading',
    5,
    `Enviando ${fileToUpload.name} (${formatBytes(finalSizeBytes)})...`
  );

  const authHeaders = await getAdminAuthHeaders();
  const blobActive = await isVercelBlobConfigured();

  let uploadedUrl = '';
  let storageProvider: 'vercel_blob' | 'local_asset' = 'local_asset';
  let finalContentType = fileToUpload.type || 'application/octet-stream';

  if (blobActive) {
    try {
      const cleanName = fileToUpload.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 120);
      const blob = await vercelBlobClientUpload(
        `${category}/${Date.now()}-${cleanName}`,
        fileToUpload,
        {
          access: 'public',
          handleUploadUrl: '/api/blob/client-upload',
          multipart: true,
          contentType: finalContentType,
          headers: authHeaders,
          onUploadProgress: (ev) => {
            options?.onStageChange?.(
              'uploading',
              Math.min(99, Math.round(ev.percentage)),
              `Enviando para Vercel Blob (${Math.round(ev.percentage)}%)...`
            );
          }
        }
      );
      uploadedUrl = blob.url;
      finalContentType = blob.contentType || finalContentType;
      storageProvider = 'vercel_blob';
      options?.onStageChange?.('uploading', 100, 'Enviado para Vercel Blob!');
    } catch (clientErr) {
      console.warn('Upload direto ao Vercel Blob falhou, tentando via stream:', clientErr);
    }
  }

  if (!uploadedUrl) {
    const streamed = await uploadViaStreamWithProgress(
      fileToUpload,
      category,
      authHeaders,
      (pct) =>
        options?.onStageChange?.(
          'uploading',
          pct,
          blobActive ? `Enviando para Vercel Blob (${pct}%)...` : `Salvando mídia (${pct}%)...`
        )
    );
    uploadedUrl = streamed.url;
    finalContentType = streamed.contentType;
    storageProvider = streamed.storageProvider;
  }

  await saveMediaAsset({
    url: uploadedUrl,
    fileName: fileToUpload.name,
    contentType: finalContentType,
    sizeBytes: finalSizeBytes,
    category,
    storageProvider
  });

  return {
    url: uploadedUrl,
    fileName: fileToUpload.name,
    contentType: finalContentType,
    originalSizeBytes,
    uploadedSizeBytes: finalSizeBytes,
    savingsPercent,
    wasCompressed,
    storageProvider,
    mediaKind
  };
}
