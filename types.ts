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
  title: string;
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
  content: string;
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

export type SocialEventStatus = 'draft' | 'upcoming' | 'sold_out' | 'completed' | 'cancelled';

export interface SocialEvent {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  emirate: string;
  city: string;
  venueName: string;
  venueAddress: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  category: string;
  ageRestriction: string;
  capacity: number;
  attendeesCount: number;
  checkedInCount?: number;
  status: SocialEventStatus;
  isAdminVerified: boolean;
  coverImageUrl: string;
  hostName: string;
  guidelinesSummary: string;
  cancellationPolicy: string;
  cancellationReason?: string | null;
  priceAed?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SocialMember {
  id: number;
  membershipId: string;
  fullName: string;
  email: string;
  whatsappNumber: string;
  emirate: string;
  ageConfirmed18Plus: boolean;
  interests: string[];
  consentEmail: boolean;
  consentWhatsapp: boolean;
  consentGuidelines: boolean;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  referralCode: string;
  createdAt: string;
}

export type RsvpStatus = 'confirmed' | 'checked_in' | 'cancelled';

export interface EventRsvp {
  id: number;
  rsvpCode: string;
  eventId: number;
  eventTitle?: string;
  eventSlug?: string;
  eventDate?: string;
  memberId: number | null;
  membershipId?: string | null;
  fullName: string;
  email: string;
  whatsappNumber: string;
  emirate: string;
  ageConfirmed18Plus: boolean;
  consentEmail: boolean;
  consentWhatsapp: boolean;
  status: RsvpStatus;
  checkedInAt: string | null;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  createdAt: string;
}

export type PartnerApplicationType = 'b2b_partner' | 'community_host';
export type PartnerApplicationStatus = 'pending' | 'approved' | 'declined';

export interface PartnerApplication {
  id: number;
  applicationType: PartnerApplicationType;
  fullName: string;
  organization: string;
  email: string;
  whatsappNumber: string;
  emirate: string;
  experienceSummary: string;
  instagramOrWebsite: string;
  tierInterest: string;
  status: PartnerApplicationStatus;
  adminNotes: string;
  createdAt: string;
}

export interface PostEventSurvey {
  id: number;
  eventId: number | null;
  eventTitle: string;
  rsvpCode: string;
  respondentName: string;
  email: string;
  overallRating: number;
  venueRating: number;
  safetyWelcomeRating: number;
  wouldAttendAgain: boolean;
  highlights: string;
  improvements: string;
  consentPublish: boolean;
  createdAt: string;
}

export interface NotificationLog {
  id: number;
  channel: 'email' | 'whatsapp';
  recipientName: string;
  recipientContact: string;
  eventId: number | null;
  subjectOrTemplate: string;
  messagePreview: string;
  consentVerified: boolean;
  status: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  tourId: number;
  tourTitle: string;
  tourSlug: string;
  tourImage: string;
  date: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  price: number;
  currency: string;
}

export interface TripReview {
  id: string;
  bookingId: string;
  tourId: number;
  tourTitle: string;
  tourSlug: string;
  rating: number;
  guideRating?: number;
  sustainabilityRating?: number;
  valueRating?: number;
  title: string;
  comment: string;
  authorName: string;
  date: string;
  tags: string[];
  photos?: string[];
  verifiedLedger?: boolean;
}

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  emirate: string;
  preferredCurrency: string;
  preferredLanguage: string;
  consentEmail: boolean;
  consentWhatsapp: boolean;
  walletAddress: string;
  membershipId: string | null;
  createdAt: string;
}

export interface TravelPackage {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  city: string;
  country: string;
  durationLabel: string;
  priceUsd: number;
  coverImageUrl: string;
  meetingPoint: string;
  timeSlots: string[];
  highlights: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TravelBookingRecord {
  id: number;
  bookingRef: string;
  bookingType: 'experience' | 'package' | 'enquiry';
  itemSlug: string;
  itemTitle: string;
  travelDate: string;
  timeSlot: string;
  meetingPoint: string;
  guests: number;
  unitPriceUsd: number;
  totalUsd: number;
  currency: string;
  displayTotal: number;
  status: string;
  paymentStatus: string;
  txRef: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  specialRequests: string;
  createdAt: string;
}

export interface PaymentTransactionRecord {
  id: number;
  txRef: string;
  bookingId: number;
  bookingRef?: string;
  provider: string;
  stripeSessionId: string;
  amountUsd: number;
  currency: string;
  status: 'pending' | 'awaiting_merchant_config' | 'paid' | 'failed' | 'refunded';
  receiptSummary: string;
  createdAt: string;
  updatedAt: string;
}

export interface TravelEnquiryRecord {
  id: number;
  enquiryRef: string;
  serviceType: 'flights' | 'hotels' | 'buses' | 'custom_package';
  fullName: string;
  email: string;
  phone: string;
  origin: string;
  destination: string;
  departDate: string;
  returnDate: string;
  guests: number;
  notes: string;
  status: 'new' | 'in_review' | 'quoted' | 'closed';
  createdAt: string;
}

export interface ProviderStatusMap {
  stripe: { configured: boolean; mode: string; label: string };
  flights: { configured: boolean; provider: string; label: string };
  hotels: { configured: boolean; provider: string; label: string };
  buses: { configured: boolean; provider: string; label: string };
  vynoContract: {
    configured: boolean;
    complianceApproved: boolean;
    contractAddress: string | null;
    chainId: string | null;
    mode: string;
  };
}

export interface VynoAccountProfile {
  accountKey: string;
  displayName: string;
  walletAddress: string;
  pointsBalance: number;
  lifetimePoints: number;
  checkinStreak: number;
  lastCheckinDate: string | null;
  canCheckinToday: boolean;
  canSpinToday: boolean;
  canScratchToday: boolean;
  completedQuizIds: string[];
  referralCode: string;
  referralsCount: number;
}

export interface VynoLedgerEntry {
  id: number;
  entryRef: string;
  accountKey: string;
  sourceType: 'checkin' | 'spin' | 'scratch' | 'quiz' | 'referral' | 'admin_adjust';
  pointsDelta: number;
  description: string;
  status: string;
  createdAt: string;
}

export interface AdminAuditLogEntry {
  id: number;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  createdAt: string;
}

export type VentureCategory =
  | 'investment'
  | 'space_franchise'
  | 'kiosk_booking'
  | 'flight_prebooking'
  | 'business_hub';

export interface VentureRequestRecord {
  id: number;
  requestRef: string;
  category: VentureCategory;
  fullName: string;
  organization: string;
  email: string;
  phone: string;
  cityEmirate: string;
  spaceSizeSqft: string;
  preferredDate: string;
  budgetBand: string;
  summary: string;
  status: 'submitted' | 'in_review' | 'approved' | 'declined';
  createdAt: string;
}

export type SurpriseOrderType = 'surprise_planner' | 'printed_tshirt' | 'charity_pledge' | 'couples_adventure';

export interface SurpriseOrderRecord {
  id: number;
  orderRef: string;
  orderType: SurpriseOrderType;
  fullName: string;
  email: string;
  phone: string;
  occasionOrPackage: string;
  recipientFirstName: string;
  preferredDate: string;
  emirate: string;
  shirtSize: string;
  shirtColor: string;
  quantity: number;
  charityCause: string;
  pledgeAmountAed: number;
  notes: string;
  status: 'received' | 'scheduled' | 'fulfilled' | 'cancelled';
  createdAt: string;
}

export interface MissedConnectionRecord {
  id: number;
  postRef: string;
  aliasName: string;
  emirate: string;
  locationOrEvent: string;
  encounterDate: string;
  publicNote: string;
  ageConfirmed18Plus: boolean;
  consentPublicPost: boolean;
  status: 'active' | 'moderated' | 'archived';
  replyCount?: number;
  createdAt: string;
}

