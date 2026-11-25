import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Film,
  ImagePlus,
  Link2,
  Sparkles,
  Star,
  Trash2,
  Upload,
  Video
} from 'lucide-react';
import type { MediaAsset } from '../../types/realEstate';
import { uploadMediaWithCompression } from '../../services/blobUploadService';
import { formatBytes } from '../../utils/mediaCompression';
import { ResilientImage } from '../common/ResilientImage';

interface UploadProgressState {
  fileName: string;
  stage: 'compressing' | 'uploading';
  percent: number;
  detail: string;
  isVideo: boolean;
}

interface PropertyMediaUploaderProps {
  coverImage: string;
  gallery: string[];
  videos: string[];
  category: MediaAsset['category'];
  mediaLibrary?: MediaAsset[];
  onChange: (next: { coverImage: string; gallery: string[]; videos: string[] }) => void;
  onMediaLibraryUpdated?: () => Promise<void>;
}

function dedupeUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const clean = raw.trim();
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      out.push(clean);
    }
  }
  return out;
}

export function PropertyMediaUploader({
  coverImage,
  gallery,
  videos,
  category,
  mediaLibrary = [],
  onChange,
  onMediaLibraryUpdated
}: PropertyMediaUploaderProps) {
  const [compressVideos, setCompressVideos] = useState(true);
  const [uploadState, setUploadState] = useState<UploadProgressState | null>(null);
  const [statusNotice, setStatusNotice] = useState<string>('');
  const [errorNotice, setErrorNotice] = useState<string>('');
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [manualVideoUrl, setManualVideoUrl] = useState('');
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);

  const videoCompressionAbortRef = useRef<AbortController | null>(null);

  const normalizedGallery = dedupeUrls(
    gallery.length > 0 ? gallery : coverImage ? [coverImage] : []
  );
  const normalizedVideos = dedupeUrls(videos);

  const handlePhotoFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorNotice('');
    setStatusNotice('');

    let nextGallery = [...normalizedGallery];
    let nextCover = coverImage;
    let totalOriginal = 0;
    let totalFinal = 0;
    let uploadedCount = 0;
    let usedVercelBlob = false;

    try {
      const fileArray = Array.from(files);
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const result = await uploadMediaWithCompression(file, {
          category,
          onStageChange: (stage, percent, detail) => {
            setUploadState({
              fileName: `(${i + 1}/${fileArray.length}) ${file.name}`,
              stage,
              percent,
              detail: detail || '',
              isVideo: false
            });
          }
        });

        totalOriginal += result.originalSizeBytes;
        totalFinal += result.uploadedSizeBytes;
        uploadedCount++;
        if (result.storageProvider === 'vercel_blob') usedVercelBlob = true;

        nextGallery = dedupeUrls([...nextGallery, result.url]);
        if (!nextCover || nextCover.startsWith('/src/assets/')) {
          nextCover = result.url;
        }
        onChange({ coverImage: nextCover, gallery: nextGallery, videos: normalizedVideos });
      }

      const savedPct =
        totalOriginal > totalFinal
          ? Math.round(((totalOriginal - totalFinal) / totalOriginal) * 100)
          : 0;

      setStatusNotice(
        `${uploadedCount} foto(s) adicionada(s)${
          usedVercelBlob ? ' no Vercel Blob' : ''
        }: ${formatBytes(totalOriginal)} → ${formatBytes(totalFinal)}${
          savedPct > 0 ? ` (-${savedPct}% preservando nitidez)` : ''
        }.`
      );
      await onMediaLibraryUpdated?.();
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : 'Falha ao enviar fotos.');
    } finally {
      setUploadState(null);
    }
  };

  const handleVideoFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorNotice('');
    setStatusNotice('');

    let nextVideos = [...normalizedVideos];
    let totalOriginal = 0;
    let totalFinal = 0;
    let uploadedCount = 0;
    let usedVercelBlob = false;

    try {
      const fileArray = Array.from(files);
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const controller = new AbortController();
        videoCompressionAbortRef.current = controller;

        const result = await uploadMediaWithCompression(file, {
          category,
          compressVideo: compressVideos,
          compressionAbortSignal: controller.signal,
          onStageChange: (stage, percent, detail) => {
            setUploadState({
              fileName: `(${i + 1}/${fileArray.length}) ${file.name}`,
              stage,
              percent,
              detail: detail || '',
              isVideo: true
            });
          }
        });

        totalOriginal += result.originalSizeBytes;
        totalFinal += result.uploadedSizeBytes;
        uploadedCount++;
        if (result.storageProvider === 'vercel_blob') usedVercelBlob = true;

        nextVideos = dedupeUrls([...nextVideos, result.url]);
        onChange({ coverImage: nextCoverOrDefault(), gallery: nextGalleryOrDefault(), videos: nextVideos });
      }

      const savedPct =
        totalOriginal > totalFinal
          ? Math.round(((totalOriginal - totalFinal) / totalOriginal) * 100)
          : 0;

      setStatusNotice(
        `${uploadedCount} vídeo(s) enviado(s)${usedVercelBlob ? ' no Vercel Blob' : ''}: ${formatBytes(
          totalOriginal
        )} → ${formatBytes(totalFinal)}${savedPct > 0 ? ` (-${savedPct}%)` : ''}.`
      );
      await onMediaLibraryUpdated?.();
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : 'Falha ao enviar vídeo.');
    } finally {
      videoCompressionAbortRef.current = null;
      setUploadState(null);
    }
  };

  function nextCoverOrDefault() {
    return coverImage || normalizedGallery[0] || '';
  }

  function nextGalleryOrDefault() {
    return normalizedGallery;
  }

  const handleRemovePhoto = (urlToRemove: string) => {
    const remaining = normalizedGallery.filter((u) => u !== urlToRemove);
    const nextCover =
      coverImage === urlToRemove ? remaining[0] || '' : coverImage;
    onChange({
      coverImage: nextCover,
      gallery: remaining,
      videos: normalizedVideos
    });
  };

  const handleMovePhoto = (idx: number, direction: -1 | 1) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= normalizedGallery.length) return;
    const copy = [...normalizedGallery];
    const [moved] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, moved);
    onChange({
      coverImage: coverImage || copy[0] || '',
      gallery: copy,
      videos: normalizedVideos
    });
  };

  const handleAddManualImage = () => {
    const clean = manualImageUrl.trim();
    if (!clean) return;
    const nextGallery = dedupeUrls([...normalizedGallery, clean]);
    const nextCover = coverImage && !coverImage.startsWith('/src/assets/') ? coverImage : clean;
    onChange({
      coverImage: nextCover,
      gallery: nextGallery,
      videos: normalizedVideos
    });
    setManualImageUrl('');
  };

  const handleAddManualVideo = () => {
    const clean = manualVideoUrl.trim();
    if (!clean) return;
    onChange({
      coverImage: nextCoverOrDefault(),
      gallery: nextGalleryOrDefault(),
      videos: dedupeUrls([...normalizedVideos, clean])
    });
    setManualVideoUrl('');
  };

  const libraryImages = mediaLibrary.filter(
    (m) => !m.contentType || m.contentType.startsWith('image/')
  );

  return (
    <div className="space-y-4 rounded-2xl border border-[#E6E2DA] bg-[#FAF9F6] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-[#18181B] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#1E4D5C]" />
            <span>Fotos & Vídeos (Vercel Blob · Sem limite)</span>
          </p>
          <p className="text-[11px] text-[#71717A]">
            Imagens são comprimidas automaticamente em WebP 2K preservando máxima nitidez.
          </p>
        </div>
      </div>

      {/* Live Progress Bar */}
      {uploadState && (
        <div className="bg-white border border-[#1E4D5C]/30 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="font-medium text-[#18181B] truncate">{uploadState.fileName}</span>
            <span className="font-mono-tabular text-[#1E4D5C] shrink-0">
              {uploadState.percent}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#F3F1EC] overflow-hidden">
            <div
              className="h-full bg-[#1E4D5C] transition-all duration-200"
              style={{ width: `${Math.max(4, uploadState.percent)}%` }}
            />
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px] text-[#52525B]">
            <span>{uploadState.detail}</span>
            {uploadState.isVideo && uploadState.stage === 'compressing' && (
              <button
                type="button"
                onClick={() => videoCompressionAbortRef.current?.abort()}
                className="text-[11px] font-semibold text-[#1E4D5C] hover:underline shrink-0 cursor-pointer"
              >
                Pular compressão e enviar original
              </button>
            )}
          </div>
        </div>
      )}

      {statusNotice && (
        <div className="text-[11px] text-[#1E4D5C] bg-white border border-[#1E4D5C]/25 rounded-xl px-3 py-2">
          {statusNotice}
        </div>
      )}

      {errorNotice && (
        <div className="text-[11px] text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-3 py-2">
          {errorNotice}
        </div>
      )}

      {/* PHOTOS SECTION */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-[#18181B]">
            Galeria de Fotos ({normalizedGallery.length})
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {libraryImages.length > 0 && (
              <button
                type="button"
                onClick={() => setShowLibraryPicker((p) => !p)}
                className="px-2.5 py-1.5 text-[11px] font-medium bg-white border border-[#E6E2DA] rounded-lg text-[#52525B] hover:text-[#18181B] cursor-pointer"
              >
                {showLibraryPicker ? 'Fechar biblioteca' : 'Usar da biblioteca'}
              </button>
            )}
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-[#1E4D5C] rounded-lg hover:bg-[#173c48] cursor-pointer">
              <ImagePlus className="w-3.5 h-3.5" />
              <span>Subir fotos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={Boolean(uploadState)}
                onChange={(e) => {
                  handlePhotoFiles(e.target.files);
                  e.target.value = '';
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {showLibraryPicker && libraryImages.length > 0 && (
          <div className="grid grid-cols-4 gap-2 bg-white border border-[#E6E2DA] rounded-xl p-2.5 max-h-40 overflow-y-auto">
            {libraryImages.map((item) => {
              const added = normalizedGallery.includes(item.url);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (!added) {
                      const nextG = dedupeUrls([...normalizedGallery, item.url]);
                      const nextC =
                        coverImage && !coverImage.startsWith('/src/assets/')
                          ? coverImage
                          : item.url;
                      onChange({ coverImage: nextC, gallery: nextG, videos: normalizedVideos });
                    }
                  }}
                  className={`relative aspect-[4/3] rounded-lg overflow-hidden border cursor-pointer ${
                    added ? 'border-[#1E4D5C] ring-2 ring-[#1E4D5C]/30' : 'border-[#E6E2DA]'
                  }`}
                >
                  <ResilientImage src={item.url} alt={item.fileName} />
                </button>
              );
            })}
          </div>
        )}

        {normalizedGallery.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {normalizedGallery.map((url, idx) => {
              const isCover = coverImage === url;
              return (
                <div
                  key={`${url}-${idx}`}
                  className={`bg-white border rounded-xl overflow-hidden flex flex-col ${
                    isCover ? 'border-[#1E4D5C] ring-1 ring-[#1E4D5C]/30' : 'border-[#E6E2DA]'
                  }`}
                >
                  <div className="relative aspect-[4/3] bg-[#F3F1EC]">
                    <ResilientImage src={url} alt={`Foto ${idx + 1}`} />
                    {isCover && (
                      <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1E4D5C] text-white text-[10px] font-semibold">
                        <Star className="w-2.5 h-2.5" />
                        Capa
                      </span>
                    )}
                  </div>
                  <div className="p-1.5 flex items-center justify-between gap-1 text-[10px]">
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleMovePhoto(idx, -1)}
                        disabled={idx === 0}
                        title="Mover para esquerda"
                        className="p-1 text-[#71717A] hover:text-[#18181B] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMovePhoto(idx, 1)}
                        disabled={idx === normalizedGallery.length - 1}
                        title="Mover para direita"
                        className="p-1 text-[#71717A] hover:text-[#18181B] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                    {!isCover && (
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            coverImage: url,
                            gallery: normalizedGallery,
                            videos: normalizedVideos
                          })
                        }
                        className="font-medium text-[#1E4D5C] hover:underline cursor-pointer"
                      >
                        Usar capa
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(url)}
                      title="Remover foto"
                      className="p-1 text-[#A1A1AA] hover:text-[#DC2626] cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[11px] text-[#71717A] bg-white border border-dashed border-[#E6E2DA] rounded-xl p-3 text-center">
            Nenhuma foto selecionada ainda. Clique em &ldquo;Subir fotos&rdquo; acima.
          </p>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={manualImageUrl}
            onChange={(e) => setManualImageUrl(e.target.value)}
            placeholder="Ou cole a URL de uma foto (https://...)"
            className="flex-1 px-2.5 py-1.5 text-[11px] bg-white border border-[#E6E2DA] rounded-lg"
          />
          <button
            type="button"
            onClick={handleAddManualImage}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-white border border-[#E6E2DA] rounded-lg text-[#18181B] hover:border-[#1E4D5C] cursor-pointer"
          >
            <Link2 className="w-3 h-3" />
            <span>Adicionar</span>
          </button>
        </div>
      </div>

      {/* VIDEOS SECTION */}
      <div className="pt-3 border-t border-[#E6E2DA] space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-[#18181B] flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-[#1E4D5C]" />
            <span>Vídeos do Imóvel ({normalizedVideos.length})</span>
          </span>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-[#18181B] rounded-lg hover:bg-[#27272A] cursor-pointer">
            <Video className="w-3.5 h-3.5" />
            <span>Subir vídeos</span>
            <input
              type="file"
              accept="video/*"
              multiple
              disabled={Boolean(uploadState)}
              onChange={(e) => {
                handleVideoFiles(e.target.files);
                e.target.value = '';
              }}
              className="hidden"
            />
          </label>
        </div>

        <label className="inline-flex items-center gap-2 text-[11px] text-[#52525B] cursor-pointer">
          <input
            type="checkbox"
            checked={compressVideos}
            onChange={(e) => setCompressVideos(e.target.checked)}
          />
          <span>Comprimir vídeo para ficar leve antes de subir (Full HD, mantém qualidade)</span>
        </label>

        {normalizedVideos.length > 0 && (
          <div className="space-y-2">
            {normalizedVideos.map((vUrl, idx) => (
              <div
                key={`${vUrl}-${idx}`}
                className="bg-white border border-[#E6E2DA] rounded-xl p-2 space-y-2"
              >
                <video
                  src={vUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full max-h-44 rounded-lg bg-[#18181B]"
                />
                <div className="flex items-center justify-between gap-2 px-1 text-[11px]">
                  <span className="text-[#71717A] truncate flex items-center gap-1">
                    <Upload className="w-3 h-3 shrink-0" />
                    {vUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        coverImage: nextCoverOrDefault(),
                        gallery: nextGalleryOrDefault(),
                        videos: normalizedVideos.filter((u) => u !== vUrl)
                      })
                    }
                    className="inline-flex items-center gap-1 text-[#DC2626] hover:underline shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remover</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={manualVideoUrl}
            onChange={(e) => setManualVideoUrl(e.target.value)}
            placeholder="Ou cole a URL de um vídeo MP4/WebM (https://...)"
            className="flex-1 px-2.5 py-1.5 text-[11px] bg-white border border-[#E6E2DA] rounded-lg"
          />
          <button
            type="button"
            onClick={handleAddManualVideo}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-white border border-[#E6E2DA] rounded-lg text-[#18181B] hover:border-[#1E4D5C] cursor-pointer"
          >
            <Link2 className="w-3 h-3" />
            <span>Adicionar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
