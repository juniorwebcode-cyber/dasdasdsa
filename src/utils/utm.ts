export interface UtmParams {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
}

const UTM_STORAGE_KEY = 'pv_utm_params_v1';

export function captureUtmFromLocation(): UtmParams {
  if (typeof window === 'undefined') {
    return { utmSource: '', utmMedium: '', utmCampaign: '', utmContent: '', utmTerm: '' };
  }

  const params = new URLSearchParams(window.location.search);
  const fromUrl: UtmParams = {
    utmSource: (params.get('utm_source') || '').slice(0, 100),
    utmMedium: (params.get('utm_medium') || '').slice(0, 100),
    utmCampaign: (params.get('utm_campaign') || '').slice(0, 100),
    utmContent: (params.get('utm_content') || '').slice(0, 100),
    utmTerm: (params.get('utm_term') || '').slice(0, 100)
  };

  const hasAny = Object.values(fromUrl).some(Boolean);
  if (hasAny) {
    try {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fromUrl));
    } catch {
      // Ignore storage quota errors
    }
    return fromUrl;
  }

  try {
    const saved = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as UtmParams;
    }
  } catch {
    // Ignore parse errors
  }

  return fromUrl;
}

export function buildWhatsAppUrl(phoneDigits: string, customMessage: string): string {
  const cleanDigits = (phoneDigits || '5515998465635').replace(/\D/g, '');
  const fullDigits = cleanDigits.startsWith('55') ? cleanDigits : `55${cleanDigits}`;
  const encoded = encodeURIComponent(customMessage);
  return `https://wa.me/${fullDigits}?text=${encoded}`;
}

export function slugifyText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150) || 'item';
}
