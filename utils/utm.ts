export const BRAND_CONTACTS = {
  clubName: 'Vanhsya Social Club',
  companyName: 'Vanhsya Global Travels',
  campaignTitle: 'Life Begins With a Hello',
  tagline: 'Come alone. Explore together.',
  audienceNote: 'UAE Residents 18+',
  websiteDisplay: 'www.vanhsya.com',
  websiteUrl: 'https://www.vanhsya.com',
  instagramHandle: '@vanhsyatravels',
  instagramUrl: 'https://www.instagram.com/vanhsyatravels?evlk=Zzlsd3JsdGE0NGww&utm_source=qr',
  instagramQrPath: '/assets/aistudio/image_82725320.png',
  whatsappDisplay: '+971 50 623 0702',
  whatsappDigits: '971506230702',
  whatsappDirectUrl: 'https://wa.me/971506230702',
  email: 'info@vanhsya.com',
  infoEmail: 'info@vanhsya.com',
  supportEmail: 'support@vanhsya.com',
  emiratesFocus: 'Dubai · Abu Dhabi · Sharjah · Ras Al Khaimah · Fujairah · Ajman · UAQ',
};

export const UAE_EMIRATES = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Ras Al Khaimah',
  'Fujairah',
  'Umm Al Quwain',
] as const;

export interface UtmParams {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
}

const UTM_STORAGE_KEY = 'vsc_utm_params';

function parseParamsFromString(queryStr: string): Partial<UtmParams> {
  if (!queryStr) return {};
  const clean = queryStr.startsWith('?') ? queryStr.slice(1) : queryStr;
  const sp = new URLSearchParams(clean);
  const result: Partial<UtmParams> = {};
  const src = sp.get('utm_source');
  const med = sp.get('utm_medium');
  const camp = sp.get('utm_campaign');
  const cont = sp.get('utm_content');
  const term = sp.get('utm_term');
  if (src) result.utmSource = src.slice(0, 100);
  if (med) result.utmMedium = med.slice(0, 100);
  if (camp) result.utmCampaign = camp.slice(0, 120);
  if (cont) result.utmContent = cont.slice(0, 120);
  if (term) result.utmTerm = term.slice(0, 120);
  return result;
}

export function captureUtmParams(): UtmParams {
  if (typeof window === 'undefined') {
    return { utmSource: '', utmMedium: '', utmCampaign: '', utmContent: '', utmTerm: '' };
  }

  let stored: Partial<UtmParams> = {};
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (raw) stored = JSON.parse(raw);
  } catch {
    stored = {};
  }

  const fromSearch = parseParamsFromString(window.location.search);
  const hashIdx = window.location.hash.indexOf('?');
  const fromHash = hashIdx >= 0 ? parseParamsFromString(window.location.hash.slice(hashIdx)) : {};

  const merged: UtmParams = {
    utmSource: fromHash.utmSource || fromSearch.utmSource || stored.utmSource || '',
    utmMedium: fromHash.utmMedium || fromSearch.utmMedium || stored.utmMedium || '',
    utmCampaign: fromHash.utmCampaign || fromSearch.utmCampaign || stored.utmCampaign || '',
    utmContent: fromHash.utmContent || fromSearch.utmContent || stored.utmContent || '',
    utmTerm: fromHash.utmTerm || fromSearch.utmTerm || stored.utmTerm || '',
  };

  try {
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // ignore storage limits
  }

  return merged;
}

export function buildHashShareUrl(
  routePath: string,
  utm?: { source?: string; medium?: string; campaign?: string; content?: string }
): string {
  const origin =
    typeof window !== 'undefined' && window.location.origin ? window.location.origin : BRAND_CONTACTS.websiteUrl;
  const cleanPath = routePath.startsWith('/') ? routePath : `/${routePath}`;
  const sp = new URLSearchParams();
  if (utm?.source) sp.set('utm_source', utm.source);
  if (utm?.medium) sp.set('utm_medium', utm.medium);
  if (utm?.campaign) sp.set('utm_campaign', utm.campaign);
  if (utm?.content) sp.set('utm_content', utm.content);
  const qs = sp.toString();
  return `${origin}/#${cleanPath}${qs ? `?${qs}` : ''}`;
}

export function buildWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppDirectEnquiryUrl(message: string): string {
  return `https://wa.me/${BRAND_CONTACTS.whatsappDigits}?text=${encodeURIComponent(message)}`;
}
