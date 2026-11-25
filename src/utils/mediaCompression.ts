export interface CompressedMediaResult {
  file: File;
  originalSizeBytes: number;
  finalSizeBytes: number;
  wasCompressed: boolean;
  savingsPercent: number;
  width?: number;
  height?: number;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function replaceExtension(fileName: string, nextExt: string): string {
  const dotIdx = fileName.lastIndexOf('.');
  const base = dotIdx > 0 ? fileName.slice(0, dotIdx) : fileName;
  return `${base}.${nextExt}`;
}

async function loadImageSource(file: File): Promise<{
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  cleanup: () => void;
}> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    return {
      width: bitmap.width,
      height: bitmap.height,
      draw: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
      cleanup: () => bitmap.close()
    };
  }

  const objectUrl = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Falha ao decodificar imagem.'));
    el.src = objectUrl;
  });

  return {
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
    draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
    cleanup: () => URL.revokeObjectURL(objectUrl)
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

/**
 * Comprime imagens no navegador preservando nitidez profissional (até 2048px, WebP qualidade 0.88).
 * Reduz fotos pesadas (5–15 MB) para ~150–450 KB sem perda visual perceptível.
 */
export async function compressImageHighQuality(
  file: File,
  options?: { maxDimension?: number; quality?: number }
): Promise<CompressedMediaResult> {
  const originalSizeBytes = file.size;
  const maxDimension = options?.maxDimension ?? 2048;
  const quality = options?.quality ?? 0.88;

  // Não recomprime SVG/GIF animado
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return {
      file,
      originalSizeBytes,
      finalSizeBytes: file.size,
      wasCompressed: false,
      savingsPercent: 0
    };
  }

  let source: Awaited<ReturnType<typeof loadImageSource>> | null = null;
  try {
    source = await loadImageSource(file);
    const { width: srcW, height: srcH } = source;
    if (!srcW || !srcH) {
      return {
        file,
        originalSizeBytes,
        finalSizeBytes: file.size,
        wasCompressed: false,
        savingsPercent: 0
      };
    }

    const largestSide = Math.max(srcW, srcH);
    const scale = largestSide > maxDimension ? maxDimension / largestSide : 1;
    const targetW = Math.max(1, Math.round(srcW * scale));
    const targetH = Math.max(1, Math.round(srcH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      return {
        file,
        originalSizeBytes,
        finalSizeBytes: file.size,
        wasCompressed: false,
        savingsPercent: 0
      };
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    source.draw(ctx, targetW, targetH);

    // WebP preserva transparência e atinge melhor razão tamanho/nitidez
    let bestBlob = await canvasToBlob(canvas, 'image/webp', quality);
    let targetExt = 'webp';
    let targetMime = 'image/webp';

    if (!bestBlob || (bestBlob.size >= originalSizeBytes && scale === 1)) {
      const altWebp = await canvasToBlob(canvas, 'image/webp', 0.82);
      if (altWebp && (!bestBlob || altWebp.size < bestBlob.size)) {
        bestBlob = altWebp;
      }
    }

    if (!bestBlob || bestBlob.type !== 'image/webp') {
      targetExt = file.type === 'image/png' ? 'png' : 'jpg';
      targetMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      bestBlob = await canvasToBlob(canvas, targetMime, quality);
    }

    if (!bestBlob || bestBlob.size >= originalSizeBytes) {
      return {
        file,
        originalSizeBytes,
        finalSizeBytes: originalSizeBytes,
        wasCompressed: false,
        savingsPercent: 0,
        width: srcW,
        height: srcH
      };
    }

    const compressedFile = new File([bestBlob], replaceExtension(file.name, targetExt), {
      type: targetMime,
      lastModified: file.lastModified
    });
    const savingsPercent = Math.max(
      0,
      Math.round(((originalSizeBytes - compressedFile.size) / originalSizeBytes) * 100)
    );

    return {
      file: compressedFile,
      originalSizeBytes,
      finalSizeBytes: compressedFile.size,
      wasCompressed: true,
      savingsPercent,
      width: targetW,
      height: targetH
    };
  } catch {
    return {
      file,
      originalSizeBytes,
      finalSizeBytes: file.size,
      wasCompressed: false,
      savingsPercent: 0
    };
  } finally {
    source?.cleanup();
  }
}

function pickSupportedVideoMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidates = [
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm'
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return null;
}

/**
 * Comprime vídeos no navegador em Full HD (até 1920px, ~3 Mbps) mantendo alta nitidez e áudio.
 * Caso o navegador não suporte ou o usuário opte por pular, preserva o arquivo original sem bloqueios.
 */
export async function compressVideoHighQuality(
  file: File,
  options?: {
    maxDimension?: number;
    videoBitsPerSecond?: number;
    onProgress?: (percent: number) => void;
    signal?: AbortSignal;
  }
): Promise<CompressedMediaResult> {
  const originalSizeBytes = file.size;

  // Vídeos pequenos (< 8 MB) já estão otimizados e sobem em poucos segundos sem reprocessamento
  if (originalSizeBytes <= 8 * 1024 * 1024) {
    return {
      file,
      originalSizeBytes,
      finalSizeBytes: originalSizeBytes,
      wasCompressed: false,
      savingsPercent: 0
    };
  }

  const mimeType = pickSupportedVideoMimeType();
  if (!mimeType || typeof document === 'undefined') {
    return {
      file,
      originalSizeBytes,
      finalSizeBytes: originalSizeBytes,
      wasCompressed: false,
      savingsPercent: 0
    };
  }

  const maxDimension = options?.maxDimension ?? 1920;
  const videoBitsPerSecond = options?.videoBitsPerSecond ?? 3_200_000;
  const objectUrl = URL.createObjectURL(file);

  const video = document.createElement('video');
  video.src = objectUrl;
  video.muted = false;
  video.playsInline = true;
  video.preload = 'auto';

  try {
    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => {
        cleanupListeners();
        resolve();
      };
      const onErr = () => {
        cleanupListeners();
        reject(new Error('Não foi possível abrir o vídeo.'));
      };
      const cleanupListeners = () => {
        video.removeEventListener('loadedmetadata', onLoaded);
        video.removeEventListener('error', onErr);
      };
      video.addEventListener('loadedmetadata', onLoaded);
      video.addEventListener('error', onErr);
    });

    if (options?.signal?.aborted) {
      return {
        file,
        originalSizeBytes,
        finalSizeBytes: originalSizeBytes,
        wasCompressed: false,
        savingsPercent: 0
      };
    }

    const srcW = video.videoWidth || 1280;
    const srcH = video.videoHeight || 720;
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
    if (!duration || duration > 180) {
      // Vídeos com mais de 3 min vão direto via streaming multipart para Vercel Blob sem espera
      return {
        file,
        originalSizeBytes,
        finalSizeBytes: originalSizeBytes,
        wasCompressed: false,
        savingsPercent: 0,
        width: srcW,
        height: srcH
      };
    }

    const largestSide = Math.max(srcW, srcH);
    const scale = largestSide > maxDimension ? maxDimension / largestSide : 1;
    const targetW = Math.max(2, Math.round((srcW * scale) / 2) * 2);
    const targetH = Math.max(2, Math.round((srcH * scale) / 2) * 2);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return {
        file,
        originalSizeBytes,
        finalSizeBytes: originalSizeBytes,
        wasCompressed: false,
        savingsPercent: 0
      };
    }

    const canvasStream = canvas.captureStream(30);
    const videoWithCapture = video as HTMLVideoElement & {
      captureStream?: () => MediaStream;
      mozCaptureStream?: () => MediaStream;
    };

    const audioTracks: MediaStreamTrack[] = [];
    try {
      const sourceStream =
        typeof videoWithCapture.captureStream === 'function'
          ? videoWithCapture.captureStream()
          : typeof videoWithCapture.mozCaptureStream === 'function'
            ? videoWithCapture.mozCaptureStream()
            : null;
      if (sourceStream) {
        sourceStream.getAudioTracks().forEach((track) => audioTracks.push(track));
      }
    } catch {
      // Continua sem faixa de áudio se bloqueado pelo codec
    }

    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioTracks
    ]);

    // Silencia saída nos alto-falantes usando volume 0 se não estiver capturando direto ou AudioContext
    video.volume = 0;

    const chunks: BlobPart[] = [];
    const recorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond,
      audioBitsPerSecond: 128_000
    });

    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data);
    };

    let rafId = 0;
    let stopped = false;

    const resultBlob = await new Promise<Blob | null>((resolve) => {
      const finish = (cancelled: boolean) => {
        if (stopped) return;
        stopped = true;
        cancelAnimationFrame(rafId);
        if (recorder.state !== 'inactive') {
          try {
            recorder.stop();
          } catch {
            resolve(null);
          }
        }
        if (cancelled) {
          resolve(null);
        }
      };

      const onAbort = () => finish(true);
      options?.signal?.addEventListener('abort', onAbort, { once: true });

      recorder.onstop = () => {
        options?.signal?.removeEventListener('abort', onAbort);
        if (options?.signal?.aborted) {
          resolve(null);
          return;
        }
        resolve(new Blob(chunks, { type: mimeType.split(';')[0] }));
      };

      recorder.onerror = () => {
        options?.signal?.removeEventListener('abort', onAbort);
        resolve(null);
      };

      video.onended = () => finish(false);

      const renderFrame = () => {
        if (stopped || video.ended || video.paused) return;
        ctx.drawImage(video, 0, 0, targetW, targetH);
        if (duration > 0) {
          const pct = Math.min(99, Math.round((video.currentTime / duration) * 100));
          options?.onProgress?.(pct);
        }
        rafId = requestAnimationFrame(renderFrame);
      };

      recorder.start(500);
      video
        .play()
        .then(() => {
          renderFrame();
        })
        .catch(() => finish(true));
    });

    combinedStream.getTracks().forEach((t) => t.stop());

    if (!resultBlob || resultBlob.size <= 0 || resultBlob.size >= originalSizeBytes) {
      return {
        file,
        originalSizeBytes,
        finalSizeBytes: originalSizeBytes,
        wasCompressed: false,
        savingsPercent: 0,
        width: srcW,
        height: srcH
      };
    }

    options?.onProgress?.(100);
    const outExt = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const outType = mimeType.split(';')[0];
    const compressedFile = new File([resultBlob], replaceExtension(file.name, outExt), {
      type: outType,
      lastModified: file.lastModified
    });
    const savingsPercent = Math.max(
      0,
      Math.round(((originalSizeBytes - compressedFile.size) / originalSizeBytes) * 100)
    );

    return {
      file: compressedFile,
      originalSizeBytes,
      finalSizeBytes: compressedFile.size,
      wasCompressed: true,
      savingsPercent,
      width: targetW,
      height: targetH
    };
  } catch {
    return {
      file,
      originalSizeBytes,
      finalSizeBytes: originalSizeBytes,
      wasCompressed: false,
      savingsPercent: 0
    };
  } finally {
    video.pause();
    video.removeAttribute('src');
    URL.revokeObjectURL(objectUrl);
  }
}
