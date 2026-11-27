import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

function openDatabase(): DatabaseSync {
  const candidates = [
    path.resolve(process.cwd(), 'data'),
    path.join(os.tmpdir(), 'vanhsya-data'),
  ];
  let lastError: unknown;
  for (const dir of candidates) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const dbPath = path.join(dir, 'vanhsya.db');
      const instance = new DatabaseSync(dbPath);
      instance.exec('PRAGMA journal_mode = WAL;');
      return instance;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Unable to initialize SQLite database');
}

const db = openDatabase();
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA busy_timeout = 5000;');

db.exec(`
  CREATE TABLE IF NOT EXISTS admin_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    passcode_salt TEXT NOT NULL,
    passcode_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL,
    emirate TEXT NOT NULL,
    city TEXT NOT NULL,
    venue_name TEXT NOT NULL,
    venue_address TEXT NOT NULL DEFAULT '',
    event_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Social Mixer',
    age_restriction TEXT NOT NULL DEFAULT '18+ UAE Residents',
    capacity INTEGER NOT NULL DEFAULT 20,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'upcoming', 'sold_out', 'completed', 'cancelled')),
    is_admin_verified INTEGER NOT NULL DEFAULT 0,
    cover_image_url TEXT NOT NULL DEFAULT '',
    host_name TEXT NOT NULL DEFAULT '',
    guidelines_summary TEXT NOT NULL DEFAULT '',
    cancellation_policy TEXT NOT NULL DEFAULT '',
    cancellation_reason TEXT DEFAULT NULL,
    price_aed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    membership_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    whatsapp_number TEXT NOT NULL,
    emirate TEXT NOT NULL,
    age_confirmed_18_plus INTEGER NOT NULL DEFAULT 0,
    interests TEXT NOT NULL DEFAULT '[]',
    consent_email INTEGER NOT NULL DEFAULT 0,
    consent_whatsapp INTEGER NOT NULL DEFAULT 0,
    consent_guidelines INTEGER NOT NULL DEFAULT 0,
    utm_source TEXT NOT NULL DEFAULT '',
    utm_medium TEXT NOT NULL DEFAULT '',
    utm_campaign TEXT NOT NULL DEFAULT '',
    utm_content TEXT NOT NULL DEFAULT '',
    utm_term TEXT NOT NULL DEFAULT '',
    referral_code TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rsvps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rsvp_code TEXT NOT NULL UNIQUE,
    event_id INTEGER NOT NULL,
    member_id INTEGER DEFAULT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    emirate TEXT NOT NULL,
    age_confirmed_18_plus INTEGER NOT NULL DEFAULT 0,
    consent_email INTEGER NOT NULL DEFAULT 0,
    consent_whatsapp INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'checked_in', 'cancelled')),
    checked_in_at TEXT DEFAULT NULL,
    utm_source TEXT NOT NULL DEFAULT '',
    utm_medium TEXT NOT NULL DEFAULT '',
    utm_campaign TEXT NOT NULL DEFAULT '',
    utm_content TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS partner_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_type TEXT NOT NULL CHECK (application_type IN ('b2b_partner', 'community_host')),
    full_name TEXT NOT NULL,
    organization TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    emirate TEXT NOT NULL,
    experience_summary TEXT NOT NULL,
    instagram_or_website TEXT NOT NULL DEFAULT '',
    tier_interest TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    admin_notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS surveys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER DEFAULT NULL,
    event_title TEXT NOT NULL,
    rsvp_code TEXT NOT NULL DEFAULT '',
    respondent_name TEXT NOT NULL,
    email TEXT NOT NULL,
    overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    venue_rating INTEGER NOT NULL CHECK (venue_rating BETWEEN 1 AND 5),
    safety_welcome_rating INTEGER NOT NULL CHECK (safety_welcome_rating BETWEEN 1 AND 5),
    would_attend_again INTEGER NOT NULL DEFAULT 1,
    highlights TEXT NOT NULL,
    improvements TEXT NOT NULL DEFAULT '',
    consent_publish INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS notification_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
    recipient_name TEXT NOT NULL,
    recipient_contact TEXT NOT NULL,
    event_id INTEGER DEFAULT NULL,
    subject_or_template TEXT NOT NULL,
    message_preview TEXT NOT NULL,
    consent_verified INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'queued',
    created_at TEXT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    emirate TEXT NOT NULL DEFAULT 'Dubai',
    preferred_currency TEXT NOT NULL DEFAULT 'AED',
    preferred_language TEXT NOT NULL DEFAULT 'en',
    consent_email INTEGER NOT NULL DEFAULT 0,
    consent_whatsapp INTEGER NOT NULL DEFAULT 0,
    wallet_address TEXT NOT NULL DEFAULT '',
    membership_id TEXT DEFAULT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    item_type TEXT NOT NULL DEFAULT 'experience',
    item_slug TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(user_id, item_slug),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS travel_packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'UAE Signature Package',
    city TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'UAE',
    duration_label TEXT NOT NULL DEFAULT 'Full Day',
    price_usd INTEGER NOT NULL,
    cover_image_url TEXT NOT NULL DEFAULT '',
    meeting_point TEXT NOT NULL DEFAULT '',
    time_slots TEXT NOT NULL DEFAULT '[]',
    highlights TEXT NOT NULL DEFAULT '[]',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS travel_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_ref TEXT NOT NULL UNIQUE,
    user_id INTEGER DEFAULT NULL,
    booking_type TEXT NOT NULL DEFAULT 'experience',
    item_slug TEXT NOT NULL,
    item_title TEXT NOT NULL,
    travel_date TEXT NOT NULL,
    time_slot TEXT NOT NULL DEFAULT 'Morning',
    meeting_point TEXT NOT NULL DEFAULT '',
    guests INTEGER NOT NULL DEFAULT 1,
    unit_price_usd INTEGER NOT NULL,
    total_usd REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'AED',
    display_total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_status TEXT NOT NULL DEFAULT 'pending',
    tx_ref TEXT DEFAULT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL DEFAULT '',
    special_requests TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS payment_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tx_ref TEXT NOT NULL UNIQUE,
    booking_id INTEGER NOT NULL,
    provider TEXT NOT NULL DEFAULT 'stripe',
    stripe_session_id TEXT NOT NULL DEFAULT '',
    amount_usd REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'AED',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'awaiting_merchant_config', 'paid', 'failed', 'refunded')),
    receipt_summary TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES travel_bookings(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS travel_enquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enquiry_ref TEXT NOT NULL UNIQUE,
    service_type TEXT NOT NULL CHECK (service_type IN ('flights', 'hotels', 'buses', 'custom_package')),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    origin TEXT NOT NULL DEFAULT '',
    destination TEXT NOT NULL DEFAULT '',
    depart_date TEXT NOT NULL DEFAULT '',
    return_date TEXT NOT NULL DEFAULT '',
    guests INTEGER NOT NULL DEFAULT 1,
    notes TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_review', 'quoted', 'closed')),
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vyno_accounts (
    account_key TEXT PRIMARY KEY,
    display_name TEXT NOT NULL DEFAULT 'Vanhsya Explorer',
    wallet_address TEXT NOT NULL DEFAULT '',
    points_balance INTEGER NOT NULL DEFAULT 0,
    lifetime_points INTEGER NOT NULL DEFAULT 0,
    checkin_streak INTEGER NOT NULL DEFAULT 0,
    last_checkin_date TEXT DEFAULT NULL,
    last_spin_date TEXT DEFAULT NULL,
    last_scratch_date TEXT DEFAULT NULL,
    completed_quiz_ids TEXT NOT NULL DEFAULT '[]',
    referral_code TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vyno_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_ref TEXT NOT NULL UNIQUE,
    account_key TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('checkin', 'spin', 'scratch', 'quiz', 'referral', 'admin_adjust')),
    points_delta INTEGER NOT NULL,
    description TEXT NOT NULL,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'recorded',
    created_at TEXT NOT NULL,
    FOREIGN KEY (account_key) REFERENCES vyno_accounts(account_key) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS vyno_referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_account_key TEXT NOT NULL,
    referred_email TEXT NOT NULL,
    referred_name TEXT NOT NULL DEFAULT '',
    referral_code TEXT NOT NULL,
    points_awarded INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'recorded',
    created_at TEXT NOT NULL,
    UNIQUE(referred_email)
  );

  CREATE TABLE IF NOT EXISTS vyno_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    claim_ref TEXT NOT NULL UNIQUE,
    account_key TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    points_requested INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'compliance_hold',
    reason TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    summary TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS venture_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_ref TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN ('investment', 'space_franchise', 'kiosk_booking', 'flight_prebooking', 'business_hub')),
    full_name TEXT NOT NULL,
    organization TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    city_emirate TEXT NOT NULL DEFAULT 'Dubai',
    space_size_sqft TEXT NOT NULL DEFAULT '',
    preferred_date TEXT NOT NULL DEFAULT '',
    budget_band TEXT NOT NULL DEFAULT '',
    summary TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_review', 'approved', 'declined')),
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS surprise_charity_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_ref TEXT NOT NULL UNIQUE,
    order_type TEXT NOT NULL CHECK (order_type IN ('surprise_planner', 'printed_tshirt', 'charity_pledge', 'couples_adventure')),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    occasion_or_package TEXT NOT NULL DEFAULT '',
    recipient_first_name TEXT NOT NULL DEFAULT '',
    preferred_date TEXT NOT NULL DEFAULT '',
    emirate TEXT NOT NULL DEFAULT 'Dubai',
    shirt_size TEXT NOT NULL DEFAULT '',
    shirt_color TEXT NOT NULL DEFAULT '',
    quantity INTEGER NOT NULL DEFAULT 1,
    charity_cause TEXT NOT NULL DEFAULT '',
    pledge_amount_aed INTEGER NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'scheduled', 'fulfilled', 'cancelled')),
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS missed_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_ref TEXT NOT NULL UNIQUE,
    alias_name TEXT NOT NULL,
    private_email TEXT NOT NULL,
    private_phone TEXT NOT NULL DEFAULT '',
    emirate TEXT NOT NULL DEFAULT 'Dubai',
    location_or_event TEXT NOT NULL,
    encounter_date TEXT NOT NULL DEFAULT '',
    public_note TEXT NOT NULL,
    age_confirmed_18_plus INTEGER NOT NULL DEFAULT 0,
    consent_public_post INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'moderated', 'archived')),
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS connection_relays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    connection_id INTEGER NOT NULL,
    sender_alias TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    message_text TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (connection_id) REFERENCES missed_connections(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_events_status_verified ON events(status, is_admin_verified);
  CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON rsvps(event_id);
  CREATE INDEX IF NOT EXISTS idx_rsvps_email_event ON rsvps(email, event_id);
  CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
  CREATE INDEX IF NOT EXISTS idx_bookings_ref ON travel_bookings(booking_ref);
  CREATE INDEX IF NOT EXISTS idx_bookings_email ON travel_bookings(customer_email);
  CREATE INDEX IF NOT EXISTS idx_payments_tx_ref ON payment_transactions(tx_ref);
  CREATE INDEX IF NOT EXISTS idx_vyno_ledger_account ON vyno_ledger(account_key);
  CREATE INDEX IF NOT EXISTS idx_connections_status ON missed_connections(status);
`);

export function mapEventRow(row: any, counts?: { attendeesCount: number; checkedInCount: number }) {
  return {
    id: Number(row.id),
    slug: String(row.slug),
    title: String(row.title),
    subtitle: String(row.subtitle || ''),
    description: String(row.description),
    emirate: String(row.emirate),
    city: String(row.city),
    venueName: String(row.venue_name),
    venueAddress: String(row.venue_address || ''),
    eventDate: String(row.event_date),
    startTime: String(row.start_time),
    endTime: String(row.end_time || ''),
    category: String(row.category || 'Social Mixer'),
    ageRestriction: String(row.age_restriction || '18+ UAE Residents'),
    capacity: Number(row.capacity),
    attendeesCount: counts ? counts.attendeesCount : Number(row.attendees_count || 0),
    checkedInCount: counts ? counts.checkedInCount : Number(row.checked_in_count || 0),
    status: row.status,
    isAdminVerified: Boolean(row.is_admin_verified),
    coverImageUrl: String(row.cover_image_url || ''),
    hostName: String(row.host_name || ''),
    guidelinesSummary: String(row.guidelines_summary || ''),
    cancellationPolicy: String(row.cancellation_policy || ''),
    cancellationReason: row.cancellation_reason ? String(row.cancellation_reason) : null,
    priceAed: Number(row.price_aed || 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapMemberRow(row: any) {
  let interests: string[] = [];
  try {
    interests = JSON.parse(row.interests || '[]');
  } catch {
    interests = [];
  }
  return {
    id: Number(row.id),
    membershipId: String(row.membership_id),
    fullName: String(row.full_name),
    email: String(row.email),
    whatsappNumber: String(row.whatsapp_number),
    emirate: String(row.emirate),
    ageConfirmed18Plus: Boolean(row.age_confirmed_18_plus),
    interests,
    consentEmail: Boolean(row.consent_email),
    consentWhatsapp: Boolean(row.consent_whatsapp),
    consentGuidelines: Boolean(row.consent_guidelines),
    utmSource: String(row.utm_source || ''),
    utmMedium: String(row.utm_medium || ''),
    utmCampaign: String(row.utm_campaign || ''),
    utmContent: String(row.utm_content || ''),
    utmTerm: String(row.utm_term || ''),
    referralCode: String(row.referral_code || ''),
    createdAt: String(row.created_at),
  };
}

export function mapRsvpRow(row: any) {
  return {
    id: Number(row.id),
    rsvpCode: String(row.rsvp_code),
    eventId: Number(row.event_id),
    eventTitle: row.event_title ? String(row.event_title) : undefined,
    eventSlug: row.event_slug ? String(row.event_slug) : undefined,
    eventDate: row.event_date ? String(row.event_date) : undefined,
    memberId: row.member_id !== null && row.member_id !== undefined ? Number(row.member_id) : null,
    membershipId: row.membership_id ? String(row.membership_id) : null,
    fullName: String(row.full_name),
    email: String(row.email),
    whatsappNumber: String(row.whatsapp_number),
    emirate: String(row.emirate),
    ageConfirmed18Plus: Boolean(row.age_confirmed_18_plus),
    consentEmail: Boolean(row.consent_email),
    consentWhatsapp: Boolean(row.consent_whatsapp),
    status: row.status,
    checkedInAt: row.checked_in_at ? String(row.checked_in_at) : null,
    utmSource: String(row.utm_source || ''),
    utmMedium: String(row.utm_medium || ''),
    utmCampaign: String(row.utm_campaign || ''),
    utmContent: String(row.utm_content || ''),
    createdAt: String(row.created_at),
  };
}

export function mapPartnerRow(row: any) {
  return {
    id: Number(row.id),
    applicationType: row.application_type,
    fullName: String(row.full_name),
    organization: String(row.organization || ''),
    email: String(row.email),
    whatsappNumber: String(row.whatsapp_number),
    emirate: String(row.emirate),
    experienceSummary: String(row.experience_summary),
    instagramOrWebsite: String(row.instagram_or_website || ''),
    tierInterest: String(row.tier_interest || ''),
    status: row.status,
    adminNotes: String(row.admin_notes || ''),
    createdAt: String(row.created_at),
  };
}

export function mapSurveyRow(row: any) {
  return {
    id: Number(row.id),
    eventId: row.event_id !== null && row.event_id !== undefined ? Number(row.event_id) : null,
    eventTitle: String(row.event_title),
    rsvpCode: String(row.rsvp_code || ''),
    respondentName: String(row.respondent_name),
    email: String(row.email),
    overallRating: Number(row.overall_rating),
    venueRating: Number(row.venue_rating),
    safetyWelcomeRating: Number(row.safety_welcome_rating),
    wouldAttendAgain: Boolean(row.would_attend_again),
    highlights: String(row.highlights),
    improvements: String(row.improvements || ''),
    consentPublish: Boolean(row.consent_publish),
    createdAt: String(row.created_at),
  };
}

export function mapNotificationRow(row: any) {
  return {
    id: Number(row.id),
    channel: row.channel,
    recipientName: String(row.recipient_name),
    recipientContact: String(row.recipient_contact),
    eventId: row.event_id !== null && row.event_id !== undefined ? Number(row.event_id) : null,
    subjectOrTemplate: String(row.subject_or_template),
    messagePreview: String(row.message_preview),
    consentVerified: Boolean(row.consent_verified),
    status: String(row.status),
    createdAt: String(row.created_at),
  };
}

export function hashPasscode(passcode: string, existingSalt?: string): { salt: string; hash: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(passcode, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPasscode(passcode: string, salt: string, expectedHash: string): boolean {
  const { hash } = hashPasscode(passcode, salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function generateMembershipId(): string {
  const row = db.prepare('SELECT COUNT(*) AS count FROM members').get() as { count: number };
  const nextNumber = (row?.count || 0) + 1;
  const suffix = String(nextNumber).padStart(4, '0');
  const randomCode = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `VSC-UAE-${suffix}-${randomCode}`;
}

export function generateRsvpCode(): string {
  return `VSC-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `event-${Date.now()}`;
}

export function syncEventCapacityStatus(eventId: number) {
  const eventRow = db.prepare('SELECT id, capacity, status FROM events WHERE id = ?').get(eventId) as
    | { id: number; capacity: number; status: string }
    | undefined;
  if (!eventRow) return;
  if (eventRow.status === 'draft' || eventRow.status === 'completed' || eventRow.status === 'cancelled') {
    return;
  }

  const counts = db
    .prepare("SELECT COUNT(*) AS activeCount FROM rsvps WHERE event_id = ? AND status IN ('confirmed', 'checked_in')")
    .get(eventId) as { activeCount: number };

  if (counts.activeCount >= eventRow.capacity && eventRow.status === 'upcoming') {
    db.prepare('UPDATE events SET status = ?, updated_at = ? WHERE id = ?').run(
      'sold_out',
      new Date().toISOString(),
      eventId
    );
  } else if (counts.activeCount < eventRow.capacity && eventRow.status === 'sold_out') {
    db.prepare('UPDATE events SET status = ?, updated_at = ? WHERE id = ?').run(
      'upcoming',
      new Date().toISOString(),
      eventId
    );
  }
}

export function recordAdminAudit(action: string, entityType: string, entityId: string | number, summary: string) {
  db.prepare(
    'INSERT INTO admin_audit_logs (action, entity_type, entity_id, summary, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(action, entityType, String(entityId), summary, new Date().toISOString());
}

export function mapUserRow(row: any) {
  return {
    id: Number(row.id),
    fullName: String(row.full_name),
    email: String(row.email),
    phone: String(row.phone || ''),
    emirate: String(row.emirate || 'Dubai'),
    preferredCurrency: String(row.preferred_currency || 'AED'),
    preferredLanguage: String(row.preferred_language || 'en'),
    consentEmail: Boolean(row.consent_email),
    consentWhatsapp: Boolean(row.consent_whatsapp),
    walletAddress: String(row.wallet_address || ''),
    membershipId: row.membership_id ? String(row.membership_id) : null,
    createdAt: String(row.created_at),
  };
}

export function mapPackageRow(row: any) {
  let timeSlots: string[] = [];
  let highlights: string[] = [];
  try { timeSlots = JSON.parse(row.time_slots || '[]'); } catch { timeSlots = []; }
  try { highlights = JSON.parse(row.highlights || '[]'); } catch { highlights = []; }
  return {
    id: Number(row.id),
    slug: String(row.slug),
    title: String(row.title),
    subtitle: String(row.subtitle || ''),
    category: String(row.category || 'UAE Signature Package'),
    city: String(row.city),
    country: String(row.country || 'UAE'),
    durationLabel: String(row.duration_label || 'Full Day'),
    priceUsd: Number(row.price_usd),
    coverImageUrl: String(row.cover_image_url || ''),
    meetingPoint: String(row.meeting_point || ''),
    timeSlots,
    highlights,
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapTravelBookingRow(row: any) {
  return {
    id: Number(row.id),
    bookingRef: String(row.booking_ref),
    bookingType: row.booking_type,
    itemSlug: String(row.item_slug),
    itemTitle: String(row.item_title),
    travelDate: String(row.travel_date),
    timeSlot: String(row.time_slot),
    meetingPoint: String(row.meeting_point || ''),
    guests: Number(row.guests),
    unitPriceUsd: Number(row.unit_price_usd),
    totalUsd: Number(row.total_usd),
    currency: String(row.currency || 'AED'),
    displayTotal: Number(row.display_total),
    status: String(row.status),
    paymentStatus: String(row.payment_status),
    txRef: row.tx_ref ? String(row.tx_ref) : null,
    customerName: String(row.customer_name),
    customerEmail: String(row.customer_email),
    customerPhone: String(row.customer_phone || ''),
    specialRequests: String(row.special_requests || ''),
    createdAt: String(row.created_at),
  };
}

export function mapPaymentRow(row: any) {
  return {
    id: Number(row.id),
    txRef: String(row.tx_ref),
    bookingId: Number(row.booking_id),
    bookingRef: row.booking_ref ? String(row.booking_ref) : undefined,
    provider: String(row.provider),
    stripeSessionId: String(row.stripe_session_id || ''),
    amountUsd: Number(row.amount_usd),
    currency: String(row.currency || 'AED'),
    status: row.status,
    receiptSummary: String(row.receipt_summary || ''),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapEnquiryRow(row: any) {
  return {
    id: Number(row.id),
    enquiryRef: String(row.enquiry_ref),
    serviceType: row.service_type,
    fullName: String(row.full_name),
    email: String(row.email),
    phone: String(row.phone || ''),
    origin: String(row.origin || ''),
    destination: String(row.destination || ''),
    departDate: String(row.depart_date || ''),
    returnDate: String(row.return_date || ''),
    guests: Number(row.guests || 1),
    notes: String(row.notes || ''),
    status: row.status,
    createdAt: String(row.created_at),
  };
}

export function mapVynoAccountRow(row: any, referralsCount = 0) {
  const today = new Date().toISOString().slice(0, 10);
  let completedQuizIds: string[] = [];
  try { completedQuizIds = JSON.parse(row.completed_quiz_ids || '[]'); } catch { completedQuizIds = []; }
  return {
    accountKey: String(row.account_key),
    displayName: String(row.display_name || 'Vanhsya Explorer'),
    walletAddress: String(row.wallet_address || ''),
    pointsBalance: Number(row.points_balance || 0),
    lifetimePoints: Number(row.lifetime_points || 0),
    checkinStreak: Number(row.checkin_streak || 0),
    lastCheckinDate: row.last_checkin_date ? String(row.last_checkin_date) : null,
    canCheckinToday: row.last_checkin_date !== today,
    canSpinToday: row.last_spin_date !== today,
    canScratchToday: row.last_scratch_date !== today,
    completedQuizIds,
    referralCode: String(row.referral_code),
    referralsCount,
  };
}

export function mapVynoLedgerRow(row: any) {
  return {
    id: Number(row.id),
    entryRef: String(row.entry_ref),
    accountKey: String(row.account_key),
    sourceType: row.source_type,
    pointsDelta: Number(row.points_delta),
    description: String(row.description),
    status: String(row.status),
    createdAt: String(row.created_at),
  };
}

export function generateReference(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export function mapVentureRow(row: any) {
  return {
    id: Number(row.id),
    requestRef: String(row.request_ref),
    category: row.category,
    fullName: String(row.full_name),
    organization: String(row.organization || ''),
    email: String(row.email),
    phone: String(row.phone || ''),
    cityEmirate: String(row.city_emirate || 'Dubai'),
    spaceSizeSqft: String(row.space_size_sqft || ''),
    preferredDate: String(row.preferred_date || ''),
    budgetBand: String(row.budget_band || ''),
    summary: String(row.summary),
    status: row.status,
    createdAt: String(row.created_at),
  };
}

export function mapSurpriseOrderRow(row: any) {
  return {
    id: Number(row.id),
    orderRef: String(row.order_ref),
    orderType: row.order_type,
    fullName: String(row.full_name),
    email: String(row.email),
    phone: String(row.phone || ''),
    occasionOrPackage: String(row.occasion_or_package || ''),
    recipientFirstName: String(row.recipient_first_name || ''),
    preferredDate: String(row.preferred_date || ''),
    emirate: String(row.emirate || 'Dubai'),
    shirtSize: String(row.shirt_size || ''),
    shirtColor: String(row.shirt_color || ''),
    quantity: Number(row.quantity || 1),
    charityCause: String(row.charity_cause || ''),
    pledgeAmountAed: Number(row.pledge_amount_aed || 0),
    notes: String(row.notes || ''),
    status: row.status,
    createdAt: String(row.created_at),
  };
}

export function mapPublicConnectionRow(row: any) {
  return {
    id: Number(row.id),
    postRef: String(row.post_ref),
    aliasName: String(row.alias_name),
    emirate: String(row.emirate || 'Dubai'),
    locationOrEvent: String(row.location_or_event),
    encounterDate: String(row.encounter_date || ''),
    publicNote: String(row.public_note),
    ageConfirmed18Plus: Boolean(row.age_confirmed_18_plus),
    consentPublicPost: Boolean(row.consent_public_post),
    status: row.status,
    replyCount: Number(row.reply_count || 0),
    createdAt: String(row.created_at),
  };
}

export function ensureSeedTravelPackages() {
  const row = db.prepare('SELECT COUNT(*) AS count FROM travel_packages').get() as { count: number };
  if (row && row.count > 0) return;
  const now = new Date().toISOString();
  const seeds = [
    {
      slug: 'dubai-marina-twilight-yacht-charter',
      title: 'Dubai Marina & Ain Dubai Twilight Yacht Charter',
      subtitle: 'Golden-hour coastal cruise past Ain Dubai & Burj Al Arab',
      category: 'Coastal & Yacht',
      city: 'Dubai Marina',
      country: 'UAE',
      durationLabel: '3 Hours · Sunset Slot',
      priceUsd: 210,
      coverImageUrl: '/assets/aistudio/image_1f4b465a.png',
      meetingPoint: 'Dubai Harbour Pier 7 Lounge (Gate B), Marina Promenade',
      timeSlots: ['4:30 PM — Sunset Sail', '8:00 PM — Marina Lights Sail'],
      highlights: [
        'Skipper & hospitality crew aboard private 58ft cruiser',
        'Panoramic route past Ain Dubai, JBR & Burj Al Arab silhouette',
        'Artisan refreshments, chilled water & golden-hour lounge deck',
      ],
    },
    {
      slug: 'al-qudra-stargazing-desert-escape',
      title: 'Al Qudra Heritage Desert & Astronomy Escape',
      subtitle: 'Evening dune drive with telescope celestial briefing',
      category: 'Desert & Astronomy',
      city: 'Dubai',
      country: 'UAE',
      durationLabel: '5 Hours · Evening',
      priceUsd: 135,
      coverImageUrl:
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0f/The_Lakes_of_the_Desert.jpg/1280px-The_Lakes_of_the_Desert.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      meetingPoint: 'Al Qudra Cycle Track Oasis Parking Pavilion',
      timeSlots: ['3:30 PM — Desert Sunset', '5:00 PM — Twilight Astronomy'],
      highlights: [
        'Gentle sunset desert transfer across Al Qudra reserve',
        'Guided night-sky viewing away from Downtown glare',
        'Majlis carpet seating with Arabic coffee & dates',
      ],
    },
    {
      slug: 'abudhabi-cultural-meridian-weekend',
      title: 'Abu Dhabi Cultural Meridian Day Package',
      subtitle: 'Sheikh Zayed Grand Mosque & Louvre dome art walk',
      category: 'Art & Heritage',
      city: 'Abu Dhabi',
      country: 'UAE',
      durationLabel: '8 Hours · Full Day',
      priceUsd: 155,
      coverImageUrl:
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5d/Water_Under_The_Canopy_%28250155755%29.jpeg/1280px-Water_Under_The_Canopy_%28250155755%29.jpeg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      meetingPoint: 'Emirates Towers South Plaza Pickup or Saadiyat Museum Gate',
      timeSlots: ['8:30 AM — Full-Day Departure', '10:00 AM — Saadiyat Meet'],
      highlights: [
        'Timed entry to Louvre Abu Dhabi & Sheikh Zayed Grand Mosque',
        'Architectural storytelling along Saadiyat Cultural District',
        'Comfortable AC return transfers from Dubai or central Abu Dhabi',
      ],
    },
    {
      slug: 'northern-emirates-fjord-mountain-retreat',
      title: 'Hatta & Hajar Ridge Adventure Combo',
      subtitle: 'Dam kayaking paired with Hajar mountain overlooks',
      category: 'Mountain & Kayak',
      city: 'Hatta',
      country: 'UAE',
      durationLabel: '7 Hours · Day Trip',
      priceUsd: 120,
      coverImageUrl:
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/Hatta_Dam_Road.jpg/1280px-Hatta_Dam_Road.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      meetingPoint: 'Hatta Kayak Marina Desk / Dubai Central Hotel Pickup',
      timeSlots: ['7:30 AM — Early Ridge Run', '1:30 PM — Golden Valley Run'],
      highlights: [
        'Single or double kayak permit on turquoise Hatta Dam',
        'Guided stop at Hatta Heritage Village & mountain passes',
        'Fresh picnic lunch included with shaded mountain views',
      ],
    },
  ];
  const stmt = db.prepare(`
    INSERT INTO travel_packages (
      slug, title, subtitle, category, city, country, duration_label,
      price_usd, cover_image_url, meeting_point, time_slots, highlights, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);
  for (const p of seeds) {
    stmt.run(
      p.slug,
      p.title,
      p.subtitle,
      p.category,
      p.city,
      p.country,
      p.durationLabel,
      p.priceUsd,
      p.coverImageUrl,
      p.meetingPoint,
      JSON.stringify(p.timeSlots),
      JSON.stringify(p.highlights),
      now,
      now
    );
  }
}

ensureSeedTravelPackages();

export default db;

