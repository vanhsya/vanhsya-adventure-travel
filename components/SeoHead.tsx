import React, { useEffect } from 'react';
import { BRAND_CONTACTS } from '../utils/utm';

interface SeoHeadProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article' | 'event';
  structuredData?: Record<string, unknown>;
}

const SeoHead: React.FC<SeoHeadProps> = ({
  title,
  description,
  path = '/',
  image,
  type = 'website',
  structuredData,
}) => {
  useEffect(() => {
    document.title = title;

    const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
      let tag = document.querySelector(`meta[${attr}="${key}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    const canonicalUrl = `${BRAND_CONTACTS.websiteUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const ogImage = image || `${window.location.origin}${BRAND_CONTACTS.instagramQrPath}`;

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', type === 'article' ? 'article' : 'website');
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:site_name', `${BRAND_CONTACTS.clubName} · ${BRAND_CONTACTS.companyName}`);
    setMeta('property', 'og:image', ogImage);

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', ogImage);

    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.rel = 'canonical';
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.href = canonicalUrl;

    const scriptId = 'vanhsya-route-jsonld';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (structuredData) {
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = scriptId;
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.text = JSON.stringify(structuredData);
    } else if (scriptEl) {
      scriptEl.remove();
    }
  }, [title, description, path, image, type, structuredData]);

  return null;
};

export default SeoHead;
