import { useEffect } from 'react';
import type { SiteSettings } from '../../types/realEstate';

export function SeoHead({
  title,
  description,
  ogImage,
  settings
}: {
  title: string;
  description: string;
  ogImage?: string;
  settings?: SiteSettings;
}) {
  useEffect(() => {
    document.title = title;

    const setMeta = (selector: string, attr: string, value: string) => {
      if (!value) return;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const match = selector.match(/\[(name|property)="([^"]+)"\]/);
        if (match) {
          el.setAttribute(match[1], match[2]);
        }
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', window.location.origin + window.location.pathname);

    if (ogImage) {
      const resolved = ogImage.startsWith('http')
        ? ogImage
        : `${window.location.origin}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`;
      setMeta('meta[property="og:image"]', 'content', resolved);
    }

    if (settings?.googleSearchConsoleTag) {
      setMeta('meta[name="google-site-verification"]', 'content', settings.googleSearchConsoleTag);
    }

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.origin + window.location.pathname);
  }, [title, description, ogImage, settings?.googleSearchConsoleTag]);

  // Inject GA4 or GTM dynamically once configured in admin settings
  useEffect(() => {
    const gaId = settings?.ga4MeasurementId?.trim();
    if (gaId && !document.getElementById('pv-ga4-script')) {
      const script = document.createElement('script');
      script.id = 'pv-ga4-script';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
      document.head.appendChild(script);

      const inline = document.createElement('script');
      inline.id = 'pv-ga4-inline';
      inline.text = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId.replace(/'/g, '')}');`;
      document.head.appendChild(inline);
    }
  }, [settings?.ga4MeasurementId]);

  return null;
}
