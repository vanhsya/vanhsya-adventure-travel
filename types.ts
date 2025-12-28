

export interface Hotspot {
  title: string;
  description: string;
  position: {
    top: string;
    left: string;
  };
}

export interface ItineraryItem {
    day: number;
    title: string;
    description: string;
}

export interface Tour {
  id: number;
  slug: string;
  title:string;
  description: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  basePriceUSD: number;
  images: string[];
  durationHours: number;
  groupDiscountPercent: number;
  groupDiscountThreshold: number;
  isMeetupEligible: boolean;
  displayPrice?: number;
  vrPreviewUrl?: string;
  hotspots?: Hotspot[];
  inclusions: string[];
  exclusions: string[];
  sampleItinerary: ItineraryItem[];
}

export interface Blog {
  id: number;
  slug: string;
  title: string;
  author: string;
  authorAvatar: string;
  date: string;
  excerpt: string;
  imageUrl: string;
  content: string; // Markdown content
  tags: string[];
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  activities: string[];
}

export interface Itinerary {
  tripTitle: string;
  destination: string;
  durationDays: number;
  itinerary: ItineraryDay[];
}

export interface MapMarkerData {
  lat: number;
  lng: number;
  popupContent: string;
}

export interface Meetup {
  id: number;
  title: string;
  slug: string;
  tourSlug: string;
  city: string;
  country: string;
  date: string;
  time: string;
  imageUrl: string;
  host: {
    name: string;
    avatarUrl: string;
  };
  attendees: number;
  capacity: number;
  description: string;
}