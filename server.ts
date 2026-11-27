import express from 'express';
import http from 'http';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import QRCode from 'qrcode';
import db, {
  generateMembershipId,
  generateReference,
  generateRsvpCode,
  hashPasscode,
  mapEnquiryRow,
  mapEventRow,
  mapMemberRow,
  mapNotificationRow,
  mapPackageRow,
  mapPartnerRow,
  mapPaymentRow,
  mapPublicConnectionRow,
  mapRsvpRow,
  mapSurpriseOrderRow,
  mapSurveyRow,
  mapTravelBookingRow,
  mapUserRow,
  mapVentureRow,
  mapVynoAccountRow,
  mapVynoLedgerRow,
  recordAdminAudit,
  slugify,
  syncEventCapacityStatus,
  verifyPasscode,
} from './server/db.ts';
import { CURRENCY_RATES_FROM_USD, TOURS_DATA } from './constants.ts';
import {
  applySecurityHeaders,
  cleanMultilineText,
  cleanText,
  createRateLimiter,
  issueAdminToken,
  isValidEmail,
  isValidWhatsapp,
  normalizeWhatsapp,
  requireAdminAuth,
  revokeAdminToken,
} from './server/security.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);
app.use(applySecurityHeaders);
app.use(
  express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, _res, next) => {
  if (!req.body || typeof req.body !== 'object') {
    req.body = {};
  }
  next();
});

// Rate limiters
const authLimiter = createRateLimiter({
  name: 'admin-auth',
  windowMs: 15 * 60 * 1000,
  maxRequests: 12,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
});

const publicWriteLimiter = createRateLimiter({
  name: 'public-write',
  windowMs: 15 * 60 * 1000,
  maxRequests: 25,
  message: 'Submission rate limit reached. Please wait a few minutes before submitting again.',
});

const apiReadLimiter = createRateLimiter({
  name: 'api-read',
  windowMs: 5 * 60 * 1000,
  maxRequests: 240,
});

app.use('/api', apiReadLimiter);

// Shared server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const liveAi = new GoogleGenAI({
  apiKey,
  apiVersion: 'v1beta',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function generateContentWithFallback(params: any) {
  try {
    return await ai.models.generateContent(params);
  } catch (err: any) {
    const isHighDemand =
      String(err).includes('503') ||
      String(err).includes('UNAVAILABLE') ||
      String(err).includes('high demand');
    if (isHighDemand && params.model !== 'gemini-3.1-flash-lite') {
      console.warn('Model high demand, falling back to gemini-3.1-flash-lite');
      return await ai.models.generateContent({
        ...params,
        model: 'gemini-3.1-flash-lite',
      });
    }
    throw err;
  }
}

async function generateContentStreamWithFallback(params: any) {
  try {
    return await ai.models.generateContentStream(params);
  } catch (err: any) {
    const isHighDemand =
      String(err).includes('503') ||
      String(err).includes('UNAVAILABLE') ||
      String(err).includes('high demand');
    if (isHighDemand && params.model !== 'gemini-3.1-flash-lite') {
      console.warn('Stream model high demand, falling back to gemini-3.1-flash-lite');
      return await ai.models.generateContentStream({
        ...params,
        model: 'gemini-3.1-flash-lite',
      });
    }
    throw err;
  }
}

function getEventCounts(eventId: number) {
  const row = db
    .prepare(
      `SELECT
         SUM(CASE WHEN status IN ('confirmed', 'checked_in') THEN 1 ELSE 0 END) AS attendees_count,
         SUM(CASE WHEN status = 'checked_in' THEN 1 ELSE 0 END) AS checked_in_count
       FROM rsvps WHERE event_id = ?`
    )
    .get(eventId) as { attendees_count: number | null; checked_in_count: number | null };
  return {
    attendeesCount: Number(row?.attendees_count || 0),
    checkedInCount: Number(row?.checked_in_count || 0),
  };
}

function getUniqueEventSlug(baseTitle: string, excludeId?: number): string {
  const base = slugify(baseTitle);
  let candidate = base;
  let counter = 2;
  while (true) {
    const existing = excludeId
      ? (db.prepare('SELECT id FROM events WHERE slug = ? AND id != ?').get(candidate, excludeId) as { id: number } | undefined)
      : (db.prepare('SELECT id FROM events WHERE slug = ?').get(candidate) as { id: number } | undefined);
    if (!existing) return candidate;
    candidate = `${base}-${counter}`;
    counter += 1;
  }
}

// --- Health Endpoint ---
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!apiKey,
    service: 'Vanhsya Social Club & Global Travels',
  });
});

// --- Dynamic QR Code Endpoint ---
app.get('/api/qr', async (req, res) => {
  try {
    const text = cleanMultilineText(req.query.text, 1024);
    const format = req.query.format === 'png' ? 'png' : 'svg';
    if (!text) {
      return res.status(400).json({ error: 'Missing text parameter' });
    }
    if (format === 'png') {
      const buffer = await QRCode.toBuffer(text, {
        width: 512,
        margin: 2,
        color: { dark: '#140B24', light: '#FFFFFF' },
      });
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(buffer);
    }
    const svg = await QRCode.toString(text, {
      type: 'svg',
      width: 320,
      margin: 2,
      color: { dark: '#140B24', light: '#FFFFFF' },
    });
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(svg);
  } catch (err: any) {
    console.error('QR generation failed:', err);
    return res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// --- Public Social Club & Events Endpoints (Strictly Admin-Verified & Non-Draft Only) ---

app.get('/api/events', (_req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT e.*,
                COALESCE((SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id AND r.status IN ('confirmed', 'checked_in')), 0) AS attendees_count
         FROM events e
         WHERE e.is_admin_verified = 1 AND e.status != 'draft'
         ORDER BY
           CASE e.status
             WHEN 'upcoming' THEN 1
             WHEN 'sold_out' THEN 2
             WHEN 'completed' THEN 3
             WHEN 'cancelled' THEN 4
             ELSE 5
           END ASC,
           e.event_date ASC,
           e.id DESC`
      )
      .all();

    res.json({
      events: rows.map((row) => mapEventRow(row)),
    });
  } catch (error: any) {
    console.error('Error listing verified events:', error);
    res.status(500).json({ error: 'Unable to load events.' });
  }
});

app.get('/api/events/:slug', (req, res) => {
  try {
    const slug = cleanText(req.params.slug, 140);
    const row = db
      .prepare(
        `SELECT e.*,
                COALESCE((SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id AND r.status IN ('confirmed', 'checked_in')), 0) AS attendees_count
         FROM events e
         WHERE e.slug = ? AND e.is_admin_verified = 1 AND e.status != 'draft'`
      )
      .get(slug);

    if (!row) {
      return res.status(404).json({ error: 'Verified event not found.' });
    }

    return res.json({ event: mapEventRow(row) });
  } catch (error: any) {
    console.error('Error reading event detail:', error);
    return res.status(500).json({ error: 'Unable to load event details.' });
  }
});

// Founding Member Registration
app.post('/api/members/register', publicWriteLimiter, (req, res) => {
  try {
    const fullName = cleanText(req.body.fullName, 120);
    const email = cleanText(req.body.email, 160).toLowerCase();
    const whatsappNumber = normalizeWhatsapp(String(req.body.whatsappNumber || ''));
    const emirate = cleanText(req.body.emirate, 60);
    const ageConfirmed18Plus = Boolean(req.body.ageConfirmed18Plus);
    const consentEmail = Boolean(req.body.consentEmail);
    const consentWhatsapp = Boolean(req.body.consentWhatsapp);
    const consentGuidelines = Boolean(req.body.consentGuidelines);
    const interestsInput = Array.isArray(req.body.interests)
      ? req.body.interests.map((i: unknown) => cleanText(i, 40)).filter(Boolean).slice(0, 8)
      : [];

    const utmSource = cleanText(req.body.utmSource, 100);
    const utmMedium = cleanText(req.body.utmMedium, 100);
    const utmCampaign = cleanText(req.body.utmCampaign, 120);
    const utmContent = cleanText(req.body.utmContent, 120);
    const utmTerm = cleanText(req.body.utmTerm, 120);
    const referralCode = cleanText(req.body.referralCode, 80);

    if (!fullName || fullName.length < 2) {
      return res.status(400).json({ error: 'Please enter your full name.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (!isValidWhatsapp(whatsappNumber)) {
      return res.status(400).json({ error: 'Please provide a valid WhatsApp number (including country code, e.g. +971...).' });
    }
    if (!emirate) {
      return res.status(400).json({ error: 'Please select your Emirate of residence.' });
    }
    if (!ageConfirmed18Plus) {
      return res.status(400).json({ error: 'Vanhsya Social Club is exclusively for UAE residents aged 18 and above.' });
    }
    if (!consentGuidelines) {
      return res.status(400).json({ error: 'Please review and accept the Community Guidelines and Privacy Policy.' });
    }

    const existing = db.prepare('SELECT * FROM members WHERE email = ?').get(email) as any;
    if (existing) {
      db.prepare(
        `UPDATE members
         SET full_name = ?, whatsapp_number = ?, emirate = ?, interests = ?,
             consent_email = ?, consent_whatsapp = ?, consent_guidelines = ?
         WHERE id = ?`
      ).run(
        fullName,
        whatsappNumber,
        emirate,
        JSON.stringify(interestsInput),
        consentEmail ? 1 : 0,
        consentWhatsapp ? 1 : 0,
        1,
        existing.id
      );
      const updated = db.prepare('SELECT * FROM members WHERE id = ?').get(existing.id);
      return res.status(200).json({
        member: mapMemberRow(updated),
        alreadyRegistered: true,
        message: 'Welcome back! Your existing Founding Member pass has been refreshed.',
      });
    }

    const membershipId = generateMembershipId();
    const now = new Date().toISOString();
    const result = db
      .prepare(
        `INSERT INTO members (
          membership_id, full_name, email, whatsapp_number, emirate, age_confirmed_18_plus,
          interests, consent_email, consent_whatsapp, consent_guidelines,
          utm_source, utm_medium, utm_campaign, utm_content, utm_term, referral_code, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        membershipId,
        fullName,
        email,
        whatsappNumber,
        emirate,
        1,
        JSON.stringify(interestsInput),
        consentEmail ? 1 : 0,
        consentWhatsapp ? 1 : 0,
        1,
        utmSource,
        utmMedium,
        utmCampaign,
        utmContent,
        utmTerm,
        referralCode,
        now
      );

    const created = db.prepare('SELECT * FROM members WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({
      member: mapMemberRow(created),
      alreadyRegistered: false,
      message: 'Welcome to Vanhsya Social Club. Your Founding Member Digital ID is ready.',
    });
  } catch (error: any) {
    console.error('Member registration error:', error);
    return res.status(500).json({ error: 'Could not complete registration. Please try again.' });
  }
});

app.get('/api/members/:membershipId', (req, res) => {
  try {
    const membershipId = cleanText(req.params.membershipId, 60).toUpperCase();
    const row = db.prepare('SELECT * FROM members WHERE membership_id = ?').get(membershipId) as any;
    if (!row) {
      return res.status(404).json({ error: 'Membership ID not found.' });
    }
    return res.json({
      member: {
        membershipId: String(row.membership_id),
        fullName: String(row.full_name),
        emirate: String(row.emirate),
        ageConfirmed18Plus: Boolean(row.age_confirmed_18_plus),
        createdAt: String(row.created_at),
      },
    });
  } catch {
    return res.status(500).json({ error: 'Unable to verify membership ID.' });
  }
});

// Event RSVP Confirmation & Capacity Enforcement
app.post('/api/events/:slug/rsvp', publicWriteLimiter, (req, res) => {
  try {
    const slug = cleanText(req.params.slug, 140);
    const fullName = cleanText(req.body.fullName, 120);
    const email = cleanText(req.body.email, 160).toLowerCase();
    const whatsappNumber = normalizeWhatsapp(String(req.body.whatsappNumber || ''));
    const emirate = cleanText(req.body.emirate, 60);
    const ageConfirmed18Plus = Boolean(req.body.ageConfirmed18Plus);
    const consentEmail = Boolean(req.body.consentEmail);
    const consentWhatsapp = Boolean(req.body.consentWhatsapp);
    const consentCancellationTerms = Boolean(req.body.consentCancellationTerms ?? true);

    const utmSource = cleanText(req.body.utmSource, 100);
    const utmMedium = cleanText(req.body.utmMedium, 100);
    const utmCampaign = cleanText(req.body.utmCampaign, 120);
    const utmContent = cleanText(req.body.utmContent, 120);

    if (!fullName || fullName.length < 2) {
      return res.status(400).json({ error: 'Please enter your full name.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!isValidWhatsapp(whatsappNumber)) {
      return res.status(400).json({ error: 'Please enter a valid WhatsApp phone number.' });
    }
    if (!emirate) {
      return res.status(400).json({ error: 'Please select your Emirate.' });
    }
    if (!ageConfirmed18Plus) {
      return res.status(400).json({ error: 'You must confirm you are a UAE resident aged 18 or older.' });
    }
    if (!consentCancellationTerms) {
      return res.status(400).json({ error: 'Please accept the RSVP & Cancellation Terms.' });
    }

    const eventRow = db
      .prepare('SELECT * FROM events WHERE slug = ? AND is_admin_verified = 1 AND status != ?')
      .get(slug, 'draft') as any;

    if (!eventRow) {
      return res.status(404).json({ error: 'Verified event not found.' });
    }
    if (eventRow.status === 'cancelled') {
      return res.status(400).json({ error: 'This meetup has been cancelled by organizers.' });
    }
    if (eventRow.status === 'completed') {
      return res.status(400).json({ error: 'This meetup has already taken place.' });
    }

    const existingActive = db
      .prepare(
        `SELECT * FROM rsvps WHERE event_id = ? AND email = ? AND status IN ('confirmed', 'checked_in')`
      )
      .get(eventRow.id, email) as any;

    if (existingActive) {
      return res.status(200).json({
        rsvp: mapRsvpRow({ ...existingActive, event_title: eventRow.title, event_slug: eventRow.slug, event_date: eventRow.event_date }),
        alreadyRsvped: true,
        message: 'You already have a confirmed seat for this meetup.',
      });
    }

    const counts = getEventCounts(eventRow.id);
    if (eventRow.status === 'sold_out' || counts.attendeesCount >= Number(eventRow.capacity)) {
      syncEventCapacityStatus(eventRow.id);
      return res.status(409).json({ error: 'This meetup has reached full capacity.' });
    }

    // Link existing member or automatically enroll founding membership if requested
    let memberRow = db.prepare('SELECT * FROM members WHERE email = ?').get(email) as any;
    const now = new Date().toISOString();
    if (!memberRow) {
      const membershipId = generateMembershipId();
      const memberInsert = db
        .prepare(
          `INSERT INTO members (
            membership_id, full_name, email, whatsapp_number, emirate, age_confirmed_18_plus,
            interests, consent_email, consent_whatsapp, consent_guidelines,
            utm_source, utm_medium, utm_campaign, utm_content, utm_term, referral_code, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          membershipId,
          fullName,
          email,
          whatsappNumber,
          emirate,
          1,
          JSON.stringify([eventRow.category || 'Social Mixer']),
          consentEmail ? 1 : 0,
          consentWhatsapp ? 1 : 0,
          1,
          utmSource,
          utmMedium,
          utmCampaign,
          utmContent,
          '',
          '',
          now
        );
      memberRow = db.prepare('SELECT * FROM members WHERE id = ?').get(memberInsert.lastInsertRowid);
    }

    const rsvpCode = generateRsvpCode();
    const rsvpResult = db
      .prepare(
        `INSERT INTO rsvps (
          rsvp_code, event_id, member_id, full_name, email, whatsapp_number, emirate,
          age_confirmed_18_plus, consent_email, consent_whatsapp, status,
          utm_source, utm_medium, utm_campaign, utm_content, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        rsvpCode,
        eventRow.id,
        memberRow ? memberRow.id : null,
        fullName,
        email,
        whatsappNumber,
        emirate,
        1,
        consentEmail ? 1 : 0,
        consentWhatsapp ? 1 : 0,
        'confirmed',
        utmSource,
        utmMedium,
        utmCampaign,
        utmContent,
        now
      );

    syncEventCapacityStatus(eventRow.id);

    const createdRsvp = db.prepare('SELECT * FROM rsvps WHERE id = ?').get(rsvpResult.lastInsertRowid);
    const updatedEvent = db
      .prepare(
        `SELECT e.*,
                COALESCE((SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id AND r.status IN ('confirmed', 'checked_in')), 0) AS attendees_count
         FROM events e WHERE e.id = ?`
      )
      .get(eventRow.id);

    return res.status(201).json({
      rsvp: mapRsvpRow({
        ...createdRsvp,
        membership_id: memberRow?.membership_id || null,
        event_title: eventRow.title,
        event_slug: eventRow.slug,
        event_date: eventRow.event_date,
      }),
      membershipId: memberRow?.membership_id || null,
      event: mapEventRow(updatedEvent),
      message: 'Your RSVP is confirmed.',
    });
  } catch (error: any) {
    console.error('RSVP creation error:', error);
    return res.status(500).json({ error: 'Failed to process your RSVP.' });
  }
});

// Partner & Community Host Applications
app.post('/api/partners/apply', publicWriteLimiter, (req, res) => {
  try {
    const applicationType =
      req.body.applicationType === 'community_host' ? 'community_host' : 'b2b_partner';
    const fullName = cleanText(req.body.fullName, 120);
    const organization = cleanText(req.body.organization, 140);
    const email = cleanText(req.body.email, 160).toLowerCase();
    const whatsappNumber = normalizeWhatsapp(String(req.body.whatsappNumber || ''));
    const emirate = cleanText(req.body.emirate, 60);
    const experienceSummary = cleanMultilineText(req.body.experienceSummary, 2500);
    const instagramOrWebsite = cleanText(req.body.instagramOrWebsite, 240);
    const tierInterest = cleanText(req.body.tierInterest, 80);

    if (!fullName || fullName.length < 2) {
      return res.status(400).json({ error: 'Please provide your full name.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid contact email.' });
    }
    if (!isValidWhatsapp(whatsappNumber)) {
      return res.status(400).json({ error: 'Please provide a valid WhatsApp phone number.' });
    }
    if (!emirate) {
      return res.status(400).json({ error: 'Please specify your UAE Emirate.' });
    }
    if (!experienceSummary || experienceSummary.length < 15) {
      return res.status(400).json({ error: 'Please share a brief overview of your background or venue.' });
    }

    const now = new Date().toISOString();
    const result = db
      .prepare(
        `INSERT INTO partner_applications (
          application_type, full_name, organization, email, whatsapp_number, emirate,
          experience_summary, instagram_or_website, tier_interest, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
      )
      .run(
        applicationType,
        fullName,
        organization,
        email,
        whatsappNumber,
        emirate,
        experienceSummary,
        instagramOrWebsite,
        tierInterest,
        now
      );

    const created = db.prepare('SELECT * FROM partner_applications WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({
      application: mapPartnerRow(created),
      message: 'Your application has been recorded for administrator review.',
    });
  } catch (error: any) {
    console.error('Partner application error:', error);
    return res.status(500).json({ error: 'Unable to submit application.' });
  }
});

// Post-Event Surveys & Customer Feedback
app.post('/api/surveys', publicWriteLimiter, (req, res) => {
  try {
    const eventIdRaw = req.body.eventId ? Number(req.body.eventId) : null;
    const eventTitleInput = cleanText(req.body.eventTitle, 160);
    const rsvpCode = cleanText(req.body.rsvpCode, 40).toUpperCase();
    const respondentName = cleanText(req.body.respondentName, 120);
    const email = cleanText(req.body.email, 160).toLowerCase();
    const overallRating = Math.min(5, Math.max(1, Number(req.body.overallRating || 5)));
    const venueRating = Math.min(5, Math.max(1, Number(req.body.venueRating || 5)));
    const safetyWelcomeRating = Math.min(5, Math.max(1, Number(req.body.safetyWelcomeRating || 5)));
    const wouldAttendAgain = Boolean(req.body.wouldAttendAgain ?? true);
    const highlights = cleanMultilineText(req.body.highlights, 2000);
    const improvements = cleanMultilineText(req.body.improvements, 1500);
    const consentPublish = Boolean(req.body.consentPublish);

    if (!respondentName || respondentName.length < 2) {
      return res.status(400).json({ error: 'Please provide your name.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (!highlights || highlights.length < 8) {
      return res.status(400).json({ error: 'Please share a few words about your experience.' });
    }

    let resolvedEventId: number | null = null;
    let resolvedEventTitle = eventTitleInput || 'Vanhsya Social Club Experience';
    if (eventIdRaw && Number.isFinite(eventIdRaw)) {
      const eventRow = db
        .prepare('SELECT id, title FROM events WHERE id = ? AND is_admin_verified = 1')
        .get(eventIdRaw) as { id: number; title: string } | undefined;
      if (eventRow) {
        resolvedEventId = eventRow.id;
        resolvedEventTitle = eventRow.title;
      }
    }

    const now = new Date().toISOString();
    const result = db
      .prepare(
        `INSERT INTO surveys (
          event_id, event_title, rsvp_code, respondent_name, email,
          overall_rating, venue_rating, safety_welcome_rating, would_attend_again,
          highlights, improvements, consent_publish, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        resolvedEventId,
        resolvedEventTitle,
        rsvpCode,
        respondentName,
        email,
        overallRating,
        venueRating,
        safetyWelcomeRating,
        wouldAttendAgain ? 1 : 0,
        highlights,
        improvements,
        consentPublish ? 1 : 0,
        now
      );

    const created = db.prepare('SELECT * FROM surveys WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({
      survey: mapSurveyRow(created),
      message: 'Thank you for your feedback. Your response has been saved.',
    });
  } catch (error: any) {
    console.error('Survey submission error:', error);
    return res.status(500).json({ error: 'Unable to save feedback right now.' });
  }
});

// Public endpoint returning ONLY real submitted surveys where respondent consented to publish
app.get('/api/surveys/verified', (_req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT id, event_id, event_title, respondent_name, overall_rating, venue_rating,
                safety_welcome_rating, would_attend_again, highlights, created_at
         FROM surveys
         WHERE consent_publish = 1
         ORDER BY id DESC
         LIMIT 20`
      )
      .all();

    res.json({
      surveys: rows.map((r: any) => ({
        id: Number(r.id),
        eventId: r.event_id ? Number(r.event_id) : null,
        eventTitle: String(r.event_title),
        respondentName: String(r.respondent_name),
        overallRating: Number(r.overall_rating),
        venueRating: Number(r.venue_rating),
        safetyWelcomeRating: Number(r.safety_welcome_rating),
        wouldAttendAgain: Boolean(r.would_attend_again),
        highlights: String(r.highlights),
        createdAt: String(r.created_at),
      })),
    });
  } catch {
    res.status(500).json({ error: 'Unable to load community feedback.' });
  }
});

// --- Admin Authentication & Dashboard Routes ---

app.get('/api/admin/auth/status', (_req, res) => {
  const envPasscode = process.env.ADMIN_PASSCODE?.trim();
  const dbAdmin = db.prepare('SELECT id FROM admin_config WHERE id = 1').get();
  const isConfigured = Boolean(envPasscode || dbAdmin);
  res.json({
    isConfigured,
    requiresBootstrap: !isConfigured,
    authMode: envPasscode ? 'environment' : dbAdmin ? 'database' : 'unclaimed',
  });
});

app.post('/api/admin/bootstrap', authLimiter, (req, res) => {
  try {
    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    const existing = db.prepare('SELECT id FROM admin_config WHERE id = 1').get();
    if (envPasscode || existing) {
      return res.status(409).json({
        error: 'Administrator account is already configured. Please sign in.',
      });
    }

    const passcode = typeof req.body.passcode === 'string' ? req.body.passcode.trim() : '';
    if (passcode.length < 10) {
      return res.status(400).json({
        error: 'Choose a strong administrator passcode of at least 10 characters.',
      });
    }

    const { salt, hash } = hashPasscode(passcode);
    db.prepare(
      'INSERT INTO admin_config (id, passcode_salt, passcode_hash, created_at) VALUES (1, ?, ?, ?)'
    ).run(salt, hash, new Date().toISOString());

    const token = issueAdminToken();
    return res.status(201).json({
      token,
      message: 'Administrator passcode set. Session active.',
    });
  } catch (error: any) {
    console.error('Admin bootstrap error:', error);
    return res.status(500).json({ error: 'Failed to configure administrator access.' });
  }
});

app.post('/api/admin/login', authLimiter, (req, res) => {
  try {
    const passcode = typeof req.body.passcode === 'string' ? req.body.passcode.trim() : '';
    if (!passcode) {
      return res.status(400).json({ error: 'Passcode is required.' });
    }

    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    let authorized = false;

    if (envPasscode) {
      const a = Buffer.from(passcode);
      const b = Buffer.from(envPasscode);
      authorized = a.length === b.length && crypto.timingSafeEqual(a, b);
    } else {
      const dbAdmin = db
        .prepare('SELECT passcode_salt, passcode_hash FROM admin_config WHERE id = 1')
        .get() as { passcode_salt: string; passcode_hash: string } | undefined;

      if (!dbAdmin) {
        return res.status(412).json({
          error: 'Administrator passcode has not been configured yet.',
          requiresBootstrap: true,
        });
      }
      authorized = verifyPasscode(passcode, dbAdmin.passcode_salt, dbAdmin.passcode_hash);
    }

    if (!authorized) {
      return res.status(401).json({ error: 'Invalid administrator passcode.' });
    }

    const token = issueAdminToken();
    return res.json({ token });
  } catch (error: any) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'Authentication error.' });
  }
});

app.post('/api/admin/logout', requireAdminAuth, (req, res) => {
  const token = (req as any).adminToken as string;
  revokeAdminToken(token);
  res.json({ ok: true });
});

app.get('/api/admin/overview', requireAdminAuth, (_req, res) => {
  try {
    const eventsRows = db
      .prepare(
        `SELECT e.*,
                COALESCE((SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id AND r.status IN ('confirmed', 'checked_in')), 0) AS attendees_count,
                COALESCE((SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id AND r.status = 'checked_in'), 0) AS checked_in_count
         FROM events e
         ORDER BY e.event_date DESC, e.id DESC`
      )
      .all();

    const membersRows = db.prepare('SELECT * FROM members ORDER BY id DESC').all();
    const rsvpsRows = db
      .prepare(
        `SELECT r.*, e.title AS event_title, e.slug AS event_slug, e.event_date AS event_date, m.membership_id
         FROM rsvps r
         LEFT JOIN events e ON e.id = r.event_id
         LEFT JOIN members m ON m.id = r.member_id
         ORDER BY r.id DESC`
      )
      .all();
    const partnerRows = db.prepare('SELECT * FROM partner_applications ORDER BY id DESC').all();
    const surveyRows = db.prepare('SELECT * FROM surveys ORDER BY id DESC').all();
    const notificationRows = db.prepare('SELECT * FROM notification_logs ORDER BY id DESC LIMIT 100').all();

    const utmRows = db
      .prepare(
        `SELECT COALESCE(NULLIF(utm_source, ''), 'direct') AS source,
                COALESCE(NULLIF(utm_campaign, ''), 'none') AS campaign,
                COUNT(*) AS total
         FROM members
         GROUP BY source, campaign
         ORDER BY total DESC`
      )
      .all();

    const packageRows = db.prepare('SELECT * FROM travel_packages ORDER BY id DESC').all();
    const bookingRows = db.prepare('SELECT * FROM travel_bookings ORDER BY id DESC LIMIT 120').all();
    const paymentRows = db
      .prepare(
        `SELECT p.*, b.booking_ref
         FROM payment_transactions p
         LEFT JOIN travel_bookings b ON b.id = p.booking_id
         ORDER BY p.id DESC LIMIT 120`
      )
      .all();
    const enquiryRows = db.prepare('SELECT * FROM travel_enquiries ORDER BY id DESC LIMIT 100').all();
    const vynoAccountRows = db
      .prepare('SELECT * FROM vyno_accounts ORDER BY points_balance DESC LIMIT 100')
      .all();
    const vynoLedgerRows = db
      .prepare('SELECT * FROM vyno_ledger ORDER BY id DESC LIMIT 120')
      .all();
    const auditLogRows = db
      .prepare('SELECT * FROM admin_audit_logs ORDER BY id DESC LIMIT 120')
      .all();
    const ventureRows = db.prepare('SELECT * FROM venture_requests ORDER BY id DESC LIMIT 120').all();
    const surpriseRows = db.prepare('SELECT * FROM surprise_charity_orders ORDER BY id DESC LIMIT 120').all();
    const connectionRows = db
      .prepare(
        `SELECT c.*,
                (SELECT COUNT(*) FROM connection_relays cr WHERE cr.connection_id = c.id) AS reply_count
         FROM missed_connections c
         ORDER BY c.id DESC LIMIT 120`
      )
      .all();

    res.json({
      events: eventsRows.map((row) => mapEventRow(row)),
      members: membersRows.map((row) => mapMemberRow(row)),
      rsvps: rsvpsRows.map((row) => mapRsvpRow(row)),
      partners: partnerRows.map((row) => mapPartnerRow(row)),
      surveys: surveyRows.map((row) => mapSurveyRow(row)),
      notifications: notificationRows.map((row) => mapNotificationRow(row)),
      utmBreakdown: utmRows.map((r: any) => ({
        source: String(r.source),
        campaign: String(r.campaign),
        total: Number(r.total),
      })),
      packages: packageRows.map((row) => mapPackageRow(row)),
      bookings: bookingRows.map((row) => mapTravelBookingRow(row)),
      payments: paymentRows.map((row) => mapPaymentRow(row)),
      enquiries: enquiryRows.map((row) => mapEnquiryRow(row)),
      vynoSummary: {
        accounts: vynoAccountRows.map((row) => mapVynoAccountRow(row)),
        recentLedger: vynoLedgerRows.map((row) => mapVynoLedgerRow(row)),
      },
      providerStatus: getProviderStatusSnapshot(),
      ventures: ventureRows.map((row) => mapVentureRow(row)),
      surprises: surpriseRows.map((row) => mapSurpriseOrderRow(row)),
      connections: connectionRows.map((row: any) => ({
        ...mapPublicConnectionRow(row),
        privateEmailMasked: String(row.private_email || '').replace(/(^.).*(@.*$)/, '$1***$2'),
      })),
      auditLogs: auditLogRows.map((row: any) => ({
        id: Number(row.id),
        action: String(row.action),
        entityType: String(row.entity_type),
        entityId: String(row.entity_id),
        summary: String(row.summary),
        createdAt: String(row.created_at),
      })),
    });
  } catch (error: any) {
    console.error('Admin overview error:', error);
    res.status(500).json({ error: 'Unable to load dashboard data.' });
  }
});

app.post('/api/admin/events', requireAdminAuth, (req, res) => {
  try {
    const title = cleanText(req.body.title, 160);
    const subtitle = cleanText(req.body.subtitle, 220);
    const description = cleanMultilineText(req.body.description, 4000);
    const emirate = cleanText(req.body.emirate, 60);
    const city = cleanText(req.body.city, 80) || emirate;
    const venueName = cleanText(req.body.venueName, 160);
    const venueAddress = cleanText(req.body.venueAddress, 240);
    const eventDate = cleanText(req.body.eventDate, 40);
    const startTime = cleanText(req.body.startTime, 40);
    const endTime = cleanText(req.body.endTime, 40);
    const category = cleanText(req.body.category, 60) || 'Social Mixer';
    const ageRestriction = cleanText(req.body.ageRestriction, 60) || '18+ UAE Residents';
    const capacity = Math.max(2, Math.min(500, Number(req.body.capacity || 20)));
    const allowedStatuses = ['draft', 'upcoming', 'sold_out', 'completed', 'cancelled'];
    const status = allowedStatuses.includes(req.body.status) ? req.body.status : 'draft';
    const isAdminVerified = Boolean(req.body.isAdminVerified);
    const coverImageUrl = cleanText(req.body.coverImageUrl, 500);
    const hostName = cleanText(req.body.hostName, 100);
    const guidelinesSummary =
      cleanMultilineText(req.body.guidelinesSummary, 1000) ||
      '18+ UAE Residents only. Respectful conduct required. Arrive 15 minutes early for check-in.';
    const cancellationPolicy =
      cleanMultilineText(req.body.cancellationPolicy, 1000) ||
      'Please cancel at least 24 hours before the meetup so waitlisted members can take your seat.';
    const priceAed = Math.max(0, Number(req.body.priceAed || 0));

    if (!title || !description || !emirate || !venueName || !eventDate || !startTime) {
      return res.status(400).json({
        error: 'Title, description, Emirate, venue name, event date, and start time are required.',
      });
    }

    const slug = getUniqueEventSlug(req.body.slug ? cleanText(req.body.slug, 140) : title);
    const now = new Date().toISOString();

    const result = db
      .prepare(
        `INSERT INTO events (
          slug, title, subtitle, description, emirate, city, venue_name, venue_address,
          event_date, start_time, end_time, category, age_restriction, capacity, status,
          is_admin_verified, cover_image_url, host_name, guidelines_summary, cancellation_policy,
          price_aed, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        slug,
        title,
        subtitle,
        description,
        emirate,
        city,
        venueName,
        venueAddress,
        eventDate,
        startTime,
        endTime,
        category,
        ageRestriction,
        capacity,
        status,
        isAdminVerified ? 1 : 0,
        coverImageUrl,
        hostName,
        guidelinesSummary,
        cancellationPolicy,
        priceAed,
        now,
        now
      );

    const created = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
    recordAdminAudit('CREATE_EVENT', 'event', result.lastInsertRowid as number, `Created event "${title}" (${status})`);
    return res.status(201).json({ event: mapEventRow(created, { attendeesCount: 0, checkedInCount: 0 }) });
  } catch (error: any) {
    console.error('Create event error:', error);
    return res.status(500).json({ error: 'Unable to create event.' });
  }
});

app.patch('/api/admin/events/:id', requireAdminAuth, (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const allowedStatuses = ['draft', 'upcoming', 'sold_out', 'completed', 'cancelled'];
    const nextStatus =
      req.body.status && allowedStatuses.includes(req.body.status) ? req.body.status : existing.status;

    const nextTitle = req.body.title !== undefined ? cleanText(req.body.title, 160) : existing.title;
    const nextSlug =
      req.body.slug !== undefined && cleanText(req.body.slug, 140)
        ? getUniqueEventSlug(cleanText(req.body.slug, 140), eventId)
        : existing.slug;

    db.prepare(
      `UPDATE events
       SET slug = ?, title = ?, subtitle = ?, description = ?, emirate = ?, city = ?,
           venue_name = ?, venue_address = ?, event_date = ?, start_time = ?, end_time = ?,
           category = ?, age_restriction = ?, capacity = ?, status = ?, is_admin_verified = ?,
           cover_image_url = ?, host_name = ?, guidelines_summary = ?, cancellation_policy = ?,
           cancellation_reason = ?, price_aed = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      nextSlug,
      nextTitle,
      req.body.subtitle !== undefined ? cleanText(req.body.subtitle, 220) : existing.subtitle,
      req.body.description !== undefined ? cleanMultilineText(req.body.description, 4000) : existing.description,
      req.body.emirate !== undefined ? cleanText(req.body.emirate, 60) : existing.emirate,
      req.body.city !== undefined ? cleanText(req.body.city, 80) : existing.city,
      req.body.venueName !== undefined ? cleanText(req.body.venueName, 160) : existing.venue_name,
      req.body.venueAddress !== undefined ? cleanText(req.body.venueAddress, 240) : existing.venue_address,
      req.body.eventDate !== undefined ? cleanText(req.body.eventDate, 40) : existing.event_date,
      req.body.startTime !== undefined ? cleanText(req.body.startTime, 40) : existing.start_time,
      req.body.endTime !== undefined ? cleanText(req.body.endTime, 40) : existing.end_time,
      req.body.category !== undefined ? cleanText(req.body.category, 60) : existing.category,
      req.body.ageRestriction !== undefined ? cleanText(req.body.ageRestriction, 60) : existing.age_restriction,
      req.body.capacity !== undefined
        ? Math.max(1, Math.min(500, Number(req.body.capacity)))
        : existing.capacity,
      nextStatus,
      req.body.isAdminVerified !== undefined
        ? req.body.isAdminVerified
          ? 1
          : 0
        : existing.is_admin_verified,
      req.body.coverImageUrl !== undefined
        ? cleanText(req.body.coverImageUrl, 500)
        : existing.cover_image_url,
      req.body.hostName !== undefined ? cleanText(req.body.hostName, 100) : existing.host_name,
      req.body.guidelinesSummary !== undefined
        ? cleanMultilineText(req.body.guidelinesSummary, 1000)
        : existing.guidelines_summary,
      req.body.cancellationPolicy !== undefined
        ? cleanMultilineText(req.body.cancellationPolicy, 1000)
        : existing.cancellation_policy,
      req.body.cancellationReason !== undefined
        ? cleanText(req.body.cancellationReason, 400) || null
        : existing.cancellation_reason,
      req.body.priceAed !== undefined ? Math.max(0, Number(req.body.priceAed)) : existing.price_aed,
      new Date().toISOString(),
      eventId
    );

    syncEventCapacityStatus(eventId);
    const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
    const counts = getEventCounts(eventId);
    recordAdminAudit('UPDATE_EVENT', 'event', eventId, `Updated event "${nextTitle}" (${nextStatus})`);
    return res.json({ event: mapEventRow(updated, counts) });
  } catch (error: any) {
    console.error('Update event error:', error);
    return res.status(500).json({ error: 'Unable to update event.' });
  }
});

app.delete('/api/admin/events/:id', requireAdminAuth, (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const result = db.prepare('DELETE FROM events WHERE id = ?').run(eventId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }
    recordAdminAudit('DELETE_EVENT', 'event', eventId, `Deleted event #${eventId}`);
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Unable to delete event.' });
  }
});

app.patch('/api/admin/rsvps/:id/checkin', requireAdminAuth, (req, res) => {
  try {
    const rsvpId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM rsvps WHERE id = ?').get(rsvpId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'RSVP not found.' });
    }
    if (existing.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot check in a cancelled RSVP.' });
    }

    const nextStatus = existing.status === 'checked_in' ? 'confirmed' : 'checked_in';
    const checkedInAt = nextStatus === 'checked_in' ? new Date().toISOString() : null;

    db.prepare('UPDATE rsvps SET status = ?, checked_in_at = ? WHERE id = ?').run(
      nextStatus,
      checkedInAt,
      rsvpId
    );
    recordAdminAudit('RSVP_CHECKIN_TOGGLE', 'rsvp', existing.rsvp_code, `Changed RSVP ${existing.rsvp_code} to ${nextStatus}`);

    const updated = db
      .prepare(
        `SELECT r.*, e.title AS event_title, e.slug AS event_slug, e.event_date AS event_date, m.membership_id
         FROM rsvps r
         LEFT JOIN events e ON e.id = r.event_id
         LEFT JOIN members m ON m.id = r.member_id
         WHERE r.id = ?`
      )
      .get(rsvpId);

    return res.json({ rsvp: mapRsvpRow(updated) });
  } catch {
    return res.status(500).json({ error: 'Failed to update check-in status.' });
  }
});

app.post('/api/admin/rsvps/checkin-code', requireAdminAuth, (req, res) => {
  try {
    const rsvpCode = cleanText(req.body.rsvpCode, 40).toUpperCase();
    if (!rsvpCode) {
      return res.status(400).json({ error: 'Enter an RSVP code.' });
    }
    const existing = db.prepare('SELECT * FROM rsvps WHERE rsvp_code = ?').get(rsvpCode) as any;
    if (!existing) {
      return res.status(404).json({ error: 'RSVP code not found.' });
    }
    if (existing.status === 'cancelled') {
      return res.status(400).json({ error: 'This RSVP was cancelled.' });
    }

    const checkedInAt = new Date().toISOString();
    db.prepare('UPDATE rsvps SET status = ?, checked_in_at = ? WHERE id = ?').run(
      'checked_in',
      checkedInAt,
      existing.id
    );
    recordAdminAudit('RSVP_CODE_CHECKIN', 'rsvp', rsvpCode, `Checked in attendee ${existing.full_name} via code ${rsvpCode}`);

    const updated = db
      .prepare(
        `SELECT r.*, e.title AS event_title, e.slug AS event_slug, e.event_date AS event_date, m.membership_id
         FROM rsvps r
         LEFT JOIN events e ON e.id = r.event_id
         LEFT JOIN members m ON m.id = r.member_id
         WHERE r.id = ?`
      )
      .get(existing.id);

    return res.json({ rsvp: mapRsvpRow(updated) });
  } catch {
    return res.status(500).json({ error: 'Unable to check in RSVP code.' });
  }
});

app.patch('/api/admin/rsvps/:id/status', requireAdminAuth, (req, res) => {
  try {
    const rsvpId = Number(req.params.id);
    const status = req.body.status;
    if (!['confirmed', 'checked_in', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid RSVP status.' });
    }
    const existing = db.prepare('SELECT * FROM rsvps WHERE id = ?').get(rsvpId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'RSVP not found.' });
    }

    const checkedInAt = status === 'checked_in' ? existing.checked_in_at || new Date().toISOString() : null;
    db.prepare('UPDATE rsvps SET status = ?, checked_in_at = ? WHERE id = ?').run(
      status,
      checkedInAt,
      rsvpId
    );
    syncEventCapacityStatus(existing.event_id);
    recordAdminAudit('UPDATE_RSVP_STATUS', 'rsvp', existing.rsvp_code, `Updated RSVP ${existing.rsvp_code} to ${status}`);

    const updated = db
      .prepare(
        `SELECT r.*, e.title AS event_title, e.slug AS event_slug, e.event_date AS event_date, m.membership_id
         FROM rsvps r
         LEFT JOIN events e ON e.id = r.event_id
         LEFT JOIN members m ON m.id = r.member_id
         WHERE r.id = ?`
      )
      .get(rsvpId);

    return res.json({ rsvp: mapRsvpRow(updated) });
  } catch {
    return res.status(500).json({ error: 'Unable to update RSVP.' });
  }
});

app.patch('/api/admin/partners/:id', requireAdminAuth, (req, res) => {
  try {
    const id = Number(req.params.id);
    const status = req.body.status;
    if (!['pending', 'approved', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    const adminNotes = cleanMultilineText(req.body.adminNotes, 1000);
    const result = db
      .prepare('UPDATE partner_applications SET status = ?, admin_notes = ? WHERE id = ?')
      .run(status, adminNotes, id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Application not found.' });
    }
    recordAdminAudit('UPDATE_PARTNER_APP', 'partner_application', id, `Marked application #${id} as ${status}`);
    const updated = db.prepare('SELECT * FROM partner_applications WHERE id = ?').get(id);
    return res.json({ application: mapPartnerRow(updated) });
  } catch {
    return res.status(500).json({ error: 'Unable to update application status.' });
  }
});

// Consent-based Email & WhatsApp Notification Dispatch
app.post('/api/admin/notifications/dispatch', requireAdminAuth, (req, res) => {
  try {
    const channel = req.body.channel === 'whatsapp' ? 'whatsapp' : 'email';
    const eventId = req.body.eventId ? Number(req.body.eventId) : null;
    const subjectOrTemplate = cleanText(req.body.subjectOrTemplate, 160);
    const messageBody = cleanMultilineText(req.body.messageBody, 2000);

    if (!subjectOrTemplate || !messageBody) {
      return res.status(400).json({ error: 'Subject/template and message content are required.' });
    }

    const consentCol = channel === 'whatsapp' ? 'consent_whatsapp' : 'consent_email';
    const recipients = eventId
      ? (db
          .prepare(
            `SELECT full_name, email, whatsapp_number
             FROM rsvps
             WHERE event_id = ? AND status IN ('confirmed', 'checked_in') AND ${consentCol} = 1`
          )
          .all(eventId) as Array<{ full_name: string; email: string; whatsapp_number: string }>)
      : (db
          .prepare(
            `SELECT full_name, email, whatsapp_number
             FROM members
             WHERE ${consentCol} = 1`
          )
          .all() as Array<{ full_name: string; email: string; whatsapp_number: string }>);

    if (recipients.length === 0) {
      return res.status(400).json({
        error: `No opted-in ${channel === 'whatsapp' ? 'WhatsApp' : 'Email'} recipients found for this audience.`,
      });
    }

    const now = new Date().toISOString();
    const insertStmt = db.prepare(
      `INSERT INTO notification_logs (
        channel, recipient_name, recipient_contact, event_id, subject_or_template,
        message_preview, consent_verified, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, 'prepared', ?)`
    );

    const dispatchLinks: Array<{ name: string; contact: string; actionHref: string }> = [];

    for (const r of recipients) {
      const contact = channel === 'whatsapp' ? r.whatsapp_number : r.email;
      const preview = messageBody.slice(0, 240);
      insertStmt.run(channel, r.full_name, contact, eventId, subjectOrTemplate, preview, now);

      const cleanDigits = r.whatsapp_number.replace(/\D/g, '');
      const actionHref =
        channel === 'whatsapp'
          ? `https://wa.me/${cleanDigits}?text=${encodeURIComponent(messageBody)}`
          : `mailto:${encodeURIComponent(r.email)}?subject=${encodeURIComponent(subjectOrTemplate)}&body=${encodeURIComponent(messageBody)}`;

      dispatchLinks.push({
        name: r.full_name,
        contact,
        actionHref,
      });
    }

    return res.status(201).json({
      count: dispatchLinks.length,
      channel,
      dispatchLinks,
      message: `Prepared consent-verified ${channel} notifications for ${dispatchLinks.length} opted-in recipient(s).`,
    });
  } catch (error: any) {
    console.error('Notification dispatch error:', error);
    return res.status(500).json({ error: 'Unable to prepare consent-verified notifications.' });
  }
});

// =====================================================================
// PROVIDER STATUS, USER AUTH, BOOKINGS, PAYMENTS, VYNO REWARDS & AUDIT
// =====================================================================

function getProviderStatusSnapshot() {
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  const amadeusConfigured = Boolean(
    process.env.AMADEUS_CLIENT_ID?.trim() && process.env.AMADEUS_CLIENT_SECRET?.trim()
  );
  const hotelbedsConfigured = Boolean(process.env.HOTELBEDS_API_KEY?.trim());
  const busConfigured = Boolean(process.env.BUS_PROVIDER_API_KEY?.trim());
  const vynoContractAddress = process.env.VYNO_CONTRACT_ADDRESS?.trim() || null;
  const vynoComplianceApproved = process.env.VYNO_COMPLIANCE_APPROVED === 'true';

  return {
    stripe: {
      configured: stripeConfigured,
      mode: stripeConfigured ? 'live_rest_checkout' : 'awaiting_merchant_config',
      label: stripeConfigured ? 'Stripe Checkout Configured' : 'Awaiting Merchant Keys (Concierge Invoice)',
    },
    flights: {
      configured: amadeusConfigured,
      provider: 'Amadeus Self-Service API',
      label: amadeusConfigured ? 'Connected' : 'Awaiting API Credentials',
    },
    hotels: {
      configured: hotelbedsConfigured,
      provider: 'Hotelbeds / Supplier API',
      label: hotelbedsConfigured ? 'Connected' : 'Awaiting API Credentials',
    },
    buses: {
      configured: busConfigured,
      provider: 'Regional Bus Operator API',
      label: busConfigured ? 'Connected' : 'Awaiting API Credentials',
    },
    vynoContract: {
      configured: Boolean(vynoContractAddress),
      complianceApproved: vynoComplianceApproved,
      contractAddress: vynoContractAddress,
      chainId: process.env.VYNO_CHAIN_ID?.trim() || null,
      mode:
        vynoContractAddress && vynoComplianceApproved
          ? 'onchain_verified'
          : 'demo_points_compliance_gated',
    },
  };
}

function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getAuthenticatedUser(req: express.Request): any | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const rawToken = auth.slice(7).trim();
  if (!rawToken) return null;
  const tokenHash = hashSessionToken(rawToken);
  const session = db
    .prepare('SELECT user_id, expires_at FROM user_sessions WHERE token_hash = ?')
    .get(tokenHash) as { user_id: number; expires_at: number } | undefined;
  if (!session) return null;
  if (Date.now() > session.expires_at) {
    db.prepare('DELETE FROM user_sessions WHERE token_hash = ?').run(tokenHash);
    return null;
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id) as any;
  return user || null;
}

function issueUserSession(userId: number): string {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(token);
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  db.prepare(
    'INSERT INTO user_sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
  ).run(tokenHash, userId, expiresAt, new Date().toISOString());
  return token;
}

function normalizeAccountKey(rawKey?: string, user?: any): string {
  if (user?.id) return `user:${user.id}`;
  const cleaned = cleanText(rawKey, 120).toLowerCase();
  if (!cleaned) return '';
  if (cleaned.startsWith('0x') && /^0x[a-f0-9]{40}$/.test(cleaned)) {
    return `wallet:${cleaned}`;
  }
  if (cleaned.startsWith('vsc-uae-')) {
    return `member:${cleaned.toUpperCase()}`;
  }
  if (cleaned.startsWith('guest:') || cleaned.startsWith('email:')) {
    return cleaned.replace(/[^a-z0-9:._@-]/g, '');
  }
  return `guest:${cleaned.replace(/[^a-z0-9._@-]/g, '')}`;
}

function ensureVynoAccount(accountKey: string, displayName?: string, walletAddress?: string) {
  let row = db.prepare('SELECT * FROM vyno_accounts WHERE account_key = ?').get(accountKey) as any;
  if (!row) {
    const now = new Date().toISOString();
    const referralCode = `VYNO-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    db.prepare(
      `INSERT INTO vyno_accounts (
        account_key, display_name, wallet_address, points_balance, lifetime_points,
        checkin_streak, referral_code, created_at, updated_at
      ) VALUES (?, ?, ?, 0, 0, 0, ?, ?, ?)`
    ).run(
      accountKey,
      cleanText(displayName, 80) || 'Vanhsya Explorer',
      cleanText(walletAddress, 80) || '',
      referralCode,
      now,
      now
    );
    row = db.prepare('SELECT * FROM vyno_accounts WHERE account_key = ?').get(accountKey);
  } else if (walletAddress && !row.wallet_address) {
    db.prepare('UPDATE vyno_accounts SET wallet_address = ?, updated_at = ? WHERE account_key = ?').run(
      cleanText(walletAddress, 80),
      new Date().toISOString(),
      accountKey
    );
    row = db.prepare('SELECT * FROM vyno_accounts WHERE account_key = ?').get(accountKey);
  }
  return row;
}

function creditVynoPoints(params: {
  accountKey: string;
  sourceType: 'checkin' | 'spin' | 'scratch' | 'quiz' | 'referral' | 'admin_adjust';
  pointsDelta: number;
  description: string;
  metadata?: Record<string, any>;
}) {
  const now = new Date().toISOString();
  const entryRef = generateReference('VYN');
  db.prepare(
    `UPDATE vyno_accounts
     SET points_balance = MAX(0, points_balance + ?),
         lifetime_points = CASE WHEN ? > 0 THEN lifetime_points + ? ELSE lifetime_points END,
         updated_at = ?
     WHERE account_key = ?`
  ).run(params.pointsDelta, params.pointsDelta, params.pointsDelta, now, params.accountKey);

  db.prepare(
    `INSERT INTO vyno_ledger (entry_ref, account_key, source_type, points_delta, description, metadata_json, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'recorded', ?)`
  ).run(
    entryRef,
    params.accountKey,
    params.sourceType,
    params.pointsDelta,
    params.description,
    JSON.stringify(params.metadata || {}),
    now
  );

  return entryRef;
}

const VYNO_QUIZ_BANK = [
  {
    id: 'uae-heritage-al-bidya',
    category: 'UAE Heritage',
    question: 'Which Emirate is home to Al Bidya Mosque, the oldest known standing mosque in the UAE?',
    options: ['Sharjah', 'Fujairah', 'Ajman', 'Ras Al Khaimah'],
    correctIndex: 1,
    points: 40,
  },
  {
    id: 'social-club-doctrine',
    category: 'Vanhsya Social Club',
    question: 'What is the official campaign motto of Vanhsya Social Club for 18+ UAE residents?',
    options: [
      'Travel Far, Fly First',
      'Life Begins With a Hello — Come alone. Explore together.',
      'Solo Exclusives Only',
      'Members By Invitation',
    ],
    correctIndex: 1,
    points: 35,
  },
  {
    id: 'web3-ecdsa-safety',
    category: 'Web3 Security',
    question: 'What does ethers.verifyMessage(message, signature) prove without exposing a private key?',
    options: [
      'A guaranteed APY yield percentage',
      'The EVM signer address that cryptographically signed that exact message',
      'Automatic token custody inside browser localStorage',
      'Gas fee waiver on mainnet',
    ],
    correctIndex: 1,
    points: 45,
  },
  {
    id: 'hajar-peak-uae',
    category: 'UAE Geography',
    question: 'Jebel Jais, the highest mountain peak in the UAE, sits within which Emirate?',
    options: ['Fujairah', 'Umm Al Quwain', 'Ras Al Khaimah', 'Abu Dhabi'],
    correctIndex: 2,
    points: 40,
  },
];

// --- User Accounts & Favorites ---

app.post('/api/auth/register', authLimiter, (req, res) => {
  try {
    const fullName = cleanText(req.body.fullName, 120);
    const email = cleanText(req.body.email, 160).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const phone = cleanText(req.body.phone, 40);
    const emirate = cleanText(req.body.emirate, 60) || 'Dubai';
    const consentEmail = Boolean(req.body.consentEmail);
    const consentWhatsapp = Boolean(req.body.consentWhatsapp);

    if (!fullName || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid full name and email address are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const linkedMember = db
      .prepare('SELECT membership_id FROM members WHERE email = ?')
      .get(email) as { membership_id: string } | undefined;

    const { salt, hash } = hashPasscode(password);
    const now = new Date().toISOString();
    const result = db
      .prepare(
        `INSERT INTO users (
          full_name, email, password_salt, password_hash, phone, emirate,
          consent_email, consent_whatsapp, membership_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        fullName,
        email,
        salt,
        hash,
        phone,
        emirate,
        consentEmail ? 1 : 0,
        consentWhatsapp ? 1 : 0,
        linkedMember?.membership_id || null,
        now
      );

    const userId = Number(result.lastInsertRowid);
    const token = issueUserSession(userId);
    const createdUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    ensureVynoAccount(`user:${userId}`, fullName);

    return res.status(201).json({
      token,
      user: mapUserRow(createdUser),
    });
  } catch (error) {
    console.error('Auth register error:', error);
    return res.status(500).json({ error: 'Unable to register account.' });
  }
});

app.post('/api/auth/login', authLimiter, (req, res) => {
  try {
    const email = cleanText(req.body.email, 160).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!isValidEmail(email) || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!userRow || !verifyPasscode(password, userRow.password_salt, userRow.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = issueUserSession(Number(userRow.id));
    return res.json({
      token,
      user: mapUserRow(userRow),
    });
  } catch (error) {
    console.error('Auth login error:', error);
    return res.status(500).json({ error: 'Unable to sign in.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const tokenHash = hashSessionToken(auth.slice(7).trim());
    db.prepare('DELETE FROM user_sessions WHERE token_hash = ?').run(tokenHash);
  }
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  return res.json({ user: mapUserRow(user) });
});

app.patch('/api/auth/profile', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Sign in required to update profile.' });
  }
  const fullName = req.body.fullName !== undefined ? cleanText(req.body.fullName, 120) : user.full_name;
  const phone = req.body.phone !== undefined ? cleanText(req.body.phone, 40) : user.phone;
  const emirate = req.body.emirate !== undefined ? cleanText(req.body.emirate, 60) : user.emirate;
  const preferredCurrency =
    req.body.preferredCurrency !== undefined
      ? cleanText(req.body.preferredCurrency, 8).toUpperCase()
      : user.preferred_currency;
  const preferredLanguage =
    req.body.preferredLanguage !== undefined
      ? cleanText(req.body.preferredLanguage, 10).toLowerCase()
      : user.preferred_language;
  const consentEmail =
    req.body.consentEmail !== undefined ? (req.body.consentEmail ? 1 : 0) : user.consent_email;
  const consentWhatsapp =
    req.body.consentWhatsapp !== undefined ? (req.body.consentWhatsapp ? 1 : 0) : user.consent_whatsapp;
  const walletAddress =
    req.body.walletAddress !== undefined ? cleanText(req.body.walletAddress, 80) : user.wallet_address;

  db.prepare(
    `UPDATE users
     SET full_name = ?, phone = ?, emirate = ?, preferred_currency = ?, preferred_language = ?,
         consent_email = ?, consent_whatsapp = ?, wallet_address = ?
     WHERE id = ?`
  ).run(
    fullName,
    phone,
    emirate,
    preferredCurrency,
    preferredLanguage,
    consentEmail,
    consentWhatsapp,
    walletAddress,
    user.id
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  return res.json({ user: mapUserRow(updated) });
});

app.get('/api/favorites', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Sign in required.' });
  }
  const rows = db
    .prepare('SELECT item_type, item_slug, created_at FROM user_favorites WHERE user_id = ? ORDER BY id DESC')
    .all(user.id);
  return res.json({ favorites: rows });
});

app.post('/api/favorites', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Sign in required to save favorites.' });
  }
  const itemSlug = cleanText(req.body.itemSlug, 140);
  const itemType = req.body.itemType === 'package' ? 'package' : 'experience';
  if (!itemSlug) return res.status(400).json({ error: 'itemSlug is required.' });

  const existing = db
    .prepare('SELECT id FROM user_favorites WHERE user_id = ? AND item_slug = ?')
    .get(user.id, itemSlug);

  if (existing) {
    db.prepare('DELETE FROM user_favorites WHERE user_id = ? AND item_slug = ?').run(user.id, itemSlug);
    return res.json({ saved: false, itemSlug });
  }

  db.prepare(
    'INSERT INTO user_favorites (user_id, item_type, item_slug, created_at) VALUES (?, ?, ?, ?)'
  ).run(user.id, itemType, itemSlug, new Date().toISOString());
  return res.status(201).json({ saved: true, itemSlug });
});

// --- Travel Hub Packages, Provider Status & Honest Search Proxies ---

app.get('/api/travel/providers/status', (_req, res) => {
  res.json(getProviderStatusSnapshot());
});

app.get('/api/travel/packages', (_req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM travel_packages WHERE is_active = 1 ORDER BY id ASC').all();
    res.json({ packages: rows.map((r) => mapPackageRow(r)) });
  } catch {
    res.status(500).json({ error: 'Unable to fetch travel packages.' });
  }
});

app.post('/api/travel/flights/search', (_req, res) => {
  const status = getProviderStatusSnapshot();
  if (!status.flights.configured) {
    return res.json({
      configured: false,
      status: 'awaiting_credentials',
      provider: status.flights.provider,
      message:
        'Live flight inventory and airline fare pricing require active Amadeus Self-Service API credentials (AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET). Submit a Concierge Flight Request below or connect directly on WhatsApp.',
      items: [],
    });
  }
  return res.json({
    configured: true,
    status: 'ready',
    provider: status.flights.provider,
    message: 'Amadeus API credentials detected.',
    items: [],
  });
});

app.post('/api/travel/hotels/search', (_req, res) => {
  const status = getProviderStatusSnapshot();
  if (!status.hotels.configured) {
    return res.json({
      configured: false,
      status: 'awaiting_credentials',
      provider: status.hotels.provider,
      message:
        'Real-time hotel availability and room rates require active supplier credentials (HOTELBEDS_API_KEY). Submit a Concierge Hotel Request below and our Dubai desk will confirm live inventory.',
      items: [],
    });
  }
  return res.json({
    configured: true,
    status: 'ready',
    provider: status.hotels.provider,
    message: 'Hotel supplier credentials detected.',
    items: [],
  });
});

app.post('/api/travel/buses/search', (_req, res) => {
  const status = getProviderStatusSnapshot();
  if (!status.buses.configured) {
    return res.json({
      configured: false,
      status: 'awaiting_credentials',
      provider: status.buses.provider,
      message:
        'Intercity coach and regional bus schedules require operator API credentials (BUS_PROVIDER_API_KEY). Request regional transfer assistance via our concierge desk.',
      items: [],
    });
  }
  return res.json({
    configured: true,
    status: 'ready',
    provider: status.buses.provider,
    message: 'Bus operator credentials detected.',
    items: [],
  });
});

app.post('/api/travel/enquiries', publicWriteLimiter, (req, res) => {
  try {
    const allowed = ['flights', 'hotels', 'buses', 'custom_package'];
    const serviceType = allowed.includes(req.body.serviceType) ? req.body.serviceType : 'custom_package';
    const fullName = cleanText(req.body.fullName, 120);
    const email = cleanText(req.body.email, 160).toLowerCase();
    const phone = cleanText(req.body.phone, 40);
    const origin = cleanText(req.body.origin, 120);
    const destination = cleanText(req.body.destination, 120);
    const departDate = cleanText(req.body.departDate, 40);
    const returnDate = cleanText(req.body.returnDate, 40);
    const guests = Math.max(1, Math.min(50, Number(req.body.guests || 1)));
    const notes = cleanMultilineText(req.body.notes, 1500);

    if (!fullName || !isValidEmail(email) || !destination) {
      return res.status(400).json({ error: 'Name, valid email, and destination are required.' });
    }

    const enquiryRef = generateReference('ENQ');
    const now = new Date().toISOString();
    const result = db
      .prepare(
        `INSERT INTO travel_enquiries (
          enquiry_ref, service_type, full_name, email, phone, origin, destination,
          depart_date, return_date, guests, notes, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)`
      )
      .run(
        enquiryRef,
        serviceType,
        fullName,
        email,
        phone,
        origin,
        destination,
        departDate,
        returnDate,
        guests,
        notes,
        now
      );

    const row = db.prepare('SELECT * FROM travel_enquiries WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ enquiry: mapEnquiryRow(row) });
  } catch (error) {
    console.error('Enquiry create error:', error);
    return res.status(500).json({ error: 'Unable to save travel enquiry.' });
  }
});

// --- Server-Authoritative Travel Bookings & Stripe-Ready Checkout ---

app.post('/api/bookings', publicWriteLimiter, (req, res) => {
  try {
    const authUser = getAuthenticatedUser(req);
    const bookingType = req.body.bookingType === 'package' ? 'package' : 'experience';
    const itemSlug = cleanText(req.body.itemSlug, 160);
    const travelDate = cleanText(req.body.travelDate, 40);
    const timeSlot = cleanText(req.body.timeSlot, 80) || 'Flexible Schedule';
    const guests = Math.max(1, Math.min(30, Number(req.body.guests || 1)));
    const currency = CURRENCY_RATES_FROM_USD[req.body.currency] ? req.body.currency : 'AED';
    const customerName = cleanText(req.body.customerName || authUser?.full_name, 120);
    const customerEmail = cleanText(req.body.customerEmail || authUser?.email, 160).toLowerCase();
    const customerPhone = cleanText(req.body.customerPhone || authUser?.phone, 40);
    const specialRequests = cleanMultilineText(req.body.specialRequests, 1000);

    if (!itemSlug || !travelDate || !customerName || !isValidEmail(customerEmail)) {
      return res.status(400).json({
        error: 'Item selection, preferred travel date, traveler name, and valid email are required.',
      });
    }

    let itemTitle = '';
    let unitPriceUsd = 0;
    let meetingPoint = '';
    let discountPercent = 0;
    let discountThreshold = 999;

    if (bookingType === 'package') {
      const pkg = db
        .prepare('SELECT * FROM travel_packages WHERE slug = ? AND is_active = 1')
        .get(itemSlug) as any;
      if (!pkg) {
        return res.status(404).json({ error: 'Selected travel package was not found.' });
      }
      itemTitle = String(pkg.title);
      unitPriceUsd = Number(pkg.price_usd);
      meetingPoint = String(pkg.meeting_point || `${pkg.city}, ${pkg.country}`);
    } else {
      const tour = TOURS_DATA.find((t) => t.slug === itemSlug);
      if (!tour) {
        return res.status(404).json({ error: 'Selected travel experience was not found.' });
      }
      itemTitle = tour.title;
      unitPriceUsd = tour.basePriceUSD;
      meetingPoint = `Central Pickup / Designated Meeting Hub — ${tour.city}, ${tour.country}`;
      discountPercent = tour.groupDiscountPercent;
      discountThreshold = tour.groupDiscountThreshold;
    }

    const rawTotalUsd = unitPriceUsd * guests;
    const totalUsd =
      guests >= discountThreshold
        ? Number((rawTotalUsd * (1 - discountPercent / 100)).toFixed(2))
        : Number(rawTotalUsd.toFixed(2));
    const displayTotal = Number((totalUsd * (CURRENCY_RATES_FROM_USD[currency] || 1)).toFixed(2));

    const bookingRef = generateReference('VNS');
    const now = new Date().toISOString();

    const result = db
      .prepare(
        `INSERT INTO travel_bookings (
          booking_ref, user_id, booking_type, item_slug, item_title, travel_date, time_slot,
          meeting_point, guests, unit_price_usd, total_usd, currency, display_total,
          status, payment_status, customer_name, customer_email, customer_phone, special_requests, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_confirmation', 'pending', ?, ?, ?, ?, ?)`
      )
      .run(
        bookingRef,
        authUser?.id || null,
        bookingType,
        itemSlug,
        itemTitle,
        travelDate,
        timeSlot,
        meetingPoint,
        guests,
        unitPriceUsd,
        totalUsd,
        currency,
        displayTotal,
        customerName,
        customerEmail,
        customerPhone,
        specialRequests,
        now
      );

    const created = db.prepare('SELECT * FROM travel_bookings WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ booking: mapTravelBookingRow(created) });
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({ error: 'Unable to create booking.' });
  }
});

app.get('/api/my/bookings', (req, res) => {
  const authUser = getAuthenticatedUser(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Sign in required.' });
  }
  const rows = db
    .prepare(
      'SELECT * FROM travel_bookings WHERE user_id = ? OR LOWER(customer_email) = LOWER(?) ORDER BY id DESC'
    )
    .all(authUser.id, authUser.email);
  return res.json({ bookings: rows.map((r) => mapTravelBookingRow(r)) });
});

app.get('/api/bookings/:bookingRef', (req, res) => {
  const ref = cleanText(req.params.bookingRef, 40).toUpperCase();
  const booking = db.prepare('SELECT * FROM travel_bookings WHERE booking_ref = ?').get(ref) as any;
  if (!booking) {
    return res.status(404).json({ error: 'Booking reference not found.' });
  }
  const payment = db
    .prepare('SELECT * FROM payment_transactions WHERE booking_id = ? ORDER BY id DESC LIMIT 1')
    .get(booking.id);
  return res.json({
    booking: mapTravelBookingRow(booking),
    transaction: payment ? mapPaymentRow({ ...payment, booking_ref: booking.booking_ref }) : null,
  });
});

app.post('/api/payments/create-checkout-session', publicWriteLimiter, async (req, res) => {
  try {
    const bookingRef = cleanText(req.body.bookingRef, 40).toUpperCase();
    const booking = db.prepare('SELECT * FROM travel_bookings WHERE booking_ref = ?').get(bookingRef) as any;
    if (!booking) {
      return res.status(404).json({ error: 'Booking reference not found.' });
    }

    const txRef = generateReference('VTX');
    const now = new Date().toISOString();
    const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();

    if (!stripeKey) {
      db.prepare(
        `INSERT INTO payment_transactions (
          tx_ref, booking_id, provider, stripe_session_id, amount_usd, currency, status, receipt_summary, created_at, updated_at
        ) VALUES (?, ?, 'concierge_invoice', '', ?, ?, 'awaiting_merchant_config', ?, ?, ?)`
      ).run(
        txRef,
        booking.id,
        booking.total_usd,
        booking.currency,
        `Awaiting Stripe merchant configuration — concierge payment invoice ${txRef} generated for ${booking.item_title}.`,
        now,
        now
      );

      db.prepare('UPDATE travel_bookings SET payment_status = ?, tx_ref = ? WHERE id = ?').run(
        'awaiting_merchant_config',
        txRef,
        booking.id
      );

      const txRow = db.prepare('SELECT * FROM payment_transactions WHERE tx_ref = ?').get(txRef);
      return res.json({
        configured: false,
        status: 'awaiting_merchant_config',
        txRef,
        message:
          'Online card checkout is awaiting merchant STRIPE_SECRET_KEY configuration. Your booking & invoice reference are saved; settle via Vanhsya Concierge WhatsApp (+971 50 623 0702) or check back once keys are enabled.',
        transaction: mapPaymentRow({ ...txRow, booking_ref: booking.booking_ref }),
      });
    }

    const baseUrl =
      process.env.APP_BASE_URL?.trim() || `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
    const body = new URLSearchParams();
    body.set('mode', 'payment');
    body.set('success_url', `${baseUrl}/#/dashboard?payment_tx=${txRef}&session_id={CHECKOUT_SESSION_ID}`);
    body.set('cancel_url', `${baseUrl}/#/book?cancelled_tx=${txRef}`);
    body.set('customer_email', booking.customer_email);
    body.set('client_reference_id', booking.booking_ref);
    body.set('line_items[0][price_data][currency]', 'usd');
    body.set('line_items[0][price_data][unit_amount]', String(Math.round(Number(booking.total_usd) * 100)));
    body.set('line_items[0][price_data][product_data][name]', `${booking.item_title} (${booking.guests} guests)`);
    body.set('line_items[0][quantity]', '1');
    body.set('metadata[txRef]', txRef);
    body.set('metadata[bookingRef]', booking.booking_ref);

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    const sessionData = (await stripeRes.json()) as any;
    if (!stripeRes.ok || !sessionData.id) {
      return res.status(502).json({
        error: sessionData?.error?.message || 'Unable to initialize Stripe Checkout session.',
      });
    }

    db.prepare(
      `INSERT INTO payment_transactions (
        tx_ref, booking_id, provider, stripe_session_id, amount_usd, currency, status, receipt_summary, created_at, updated_at
      ) VALUES (?, ?, 'stripe', ?, ?, ?, 'pending', ?, ?, ?)`
    ).run(
      txRef,
      booking.id,
      sessionData.id,
      booking.total_usd,
      booking.currency,
      `Stripe Checkout session ${sessionData.id} initiated.`,
      now,
      now
    );

    db.prepare('UPDATE travel_bookings SET payment_status = ?, tx_ref = ? WHERE id = ?').run(
      'pending',
      txRef,
      booking.id
    );

    return res.json({
      configured: true,
      status: 'pending',
      txRef,
      sessionId: sessionData.id,
      checkoutUrl: sessionData.url,
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    return res.status(500).json({ error: 'Unable to initialize payment checkout.' });
  }
});

app.post('/api/payments/webhook', (req: any, res) => {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!webhookSecret) {
      return res.status(501).json({ error: 'Stripe webhook secret not configured.' });
    }
    const sigHeader = req.headers['stripe-signature'];
    if (typeof sigHeader !== 'string' || !req.rawBody) {
      return res.status(400).json({ error: 'Missing Stripe signature or payload.' });
    }

    const parts = Object.fromEntries(sigHeader.split(',').map((kv: string) => kv.split('=')));
    const timestamp = parts.t;
    const expectedSig = parts.v1;
    if (!timestamp || !expectedSig) {
      return res.status(400).json({ error: 'Malformed signature header.' });
    }

    const signedPayload = `${timestamp}.${req.rawBody.toString('utf8')}`;
    const computed = crypto.createHmac('sha256', webhookSecret).update(signedPayload).digest('hex');
    const a = Buffer.from(computed, 'hex');
    const b = Buffer.from(expectedSig, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).json({ error: 'Webhook signature verification failed.' });
    }

    const event = req.body;
    if (event?.type === 'checkout.session.completed') {
      const session = event.data?.object;
      const txRef = session?.metadata?.txRef;
      if (txRef) {
        const now = new Date().toISOString();
        const tx = db.prepare('SELECT * FROM payment_transactions WHERE tx_ref = ?').get(txRef) as any;
        if (tx && tx.status !== 'paid') {
          db.prepare('UPDATE payment_transactions SET status = ?, updated_at = ? WHERE id = ?').run(
            'paid',
            now,
            tx.id
          );
          db.prepare('UPDATE travel_bookings SET status = ?, payment_status = ? WHERE id = ?').run(
            'confirmed',
            'paid',
            tx.booking_id
          );
        }
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing error.' });
  }
});

app.get('/api/payments/verify', async (req, res) => {
  try {
    const txRef = cleanText(String(req.query.txRef || ''), 40).toUpperCase();
    if (!txRef) return res.status(400).json({ error: 'txRef query parameter required.' });

    const tx = db
      .prepare(
        `SELECT p.*, b.booking_ref
         FROM payment_transactions p
         LEFT JOIN travel_bookings b ON b.id = p.booking_id
         WHERE p.tx_ref = ?`
      )
      .get(txRef) as any;

    if (!tx) return res.status(404).json({ error: 'Transaction not found.' });

    const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (stripeKey && tx.stripe_session_id && tx.status === 'pending') {
      const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(tx.stripe_session_id)}`, {
        headers: { Authorization: `Bearer ${stripeKey}` },
      });
      if (r.ok) {
        const session = (await r.json()) as any;
        if (session.payment_status === 'paid') {
          const now = new Date().toISOString();
          db.prepare('UPDATE payment_transactions SET status = ?, updated_at = ? WHERE id = ?').run(
            'paid',
            now,
            tx.id
          );
          db.prepare('UPDATE travel_bookings SET status = ?, payment_status = ? WHERE id = ?').run(
            'confirmed',
            'paid',
            tx.booking_id
          );
          tx.status = 'paid';
        }
      }
    }

    return res.json({ transaction: mapPaymentRow(tx) });
  } catch {
    return res.status(500).json({ error: 'Unable to verify payment status.' });
  }
});

// --- VYNO Ecosystem & Server-Authoritative Interactive Rewards (Demo/Points Mode) ---

app.get('/api/vyno/status', (_req, res) => {
  const status = getProviderStatusSnapshot();
  res.json({
    contractStatus: status.vynoContract,
    tokenDistributionEnabled: Boolean(
      status.vynoContract.configured && status.vynoContract.complianceApproved
    ),
    pointsEngineMode: 'server_verified_participation_points',
    complianceNotice:
      'On-chain VYNO token transfers, APY yields, and wallet withdrawals remain disabled pending smart contract verification and UAE regulatory compliance approval. Interactive check-ins, spins, scratch cards, and quizzes award server-recorded Participation Points only.',
    quizCount: VYNO_QUIZ_BANK.length,
  });
});

app.get('/api/vyno/quiz-questions', (_req, res) => {
  res.json({
    questions: VYNO_QUIZ_BANK.map((q) => ({
      id: q.id,
      category: q.category,
      question: q.question,
      options: q.options,
      points: q.points,
    })),
  });
});

app.get('/api/vyno/profile', (req, res) => {
  try {
    const authUser = getAuthenticatedUser(req);
    const key = normalizeAccountKey(String(req.query.accountKey || ''), authUser);
    if (!key) {
      return res.status(400).json({ error: 'Provide accountKey or sign in.' });
    }
    const displayName = cleanText(String(req.query.displayName || authUser?.full_name || ''), 80);
    const walletAddress = cleanText(String(req.query.walletAddress || authUser?.wallet_address || ''), 80);
    const account = ensureVynoAccount(key, displayName, walletAddress);
    const refCountRow = db
      .prepare('SELECT COUNT(*) AS total FROM vyno_referrals WHERE referrer_account_key = ?')
      .get(key) as { total: number };
    const ledger = db
      .prepare('SELECT * FROM vyno_ledger WHERE account_key = ? ORDER BY id DESC LIMIT 30')
      .all(key);

    res.json({
      profile: mapVynoAccountRow(account, Number(refCountRow?.total || 0)),
      ledger: ledger.map((r) => mapVynoLedgerRow(r)),
    });
  } catch (error) {
    console.error('VYNO profile error:', error);
    res.status(500).json({ error: 'Unable to load VYNO participation profile.' });
  }
});

app.post('/api/vyno/checkin', publicWriteLimiter, (req, res) => {
  try {
    const authUser = getAuthenticatedUser(req);
    const key = normalizeAccountKey(req.body.accountKey, authUser);
    if (!key) return res.status(400).json({ error: 'Account key or sign-in required.' });

    const account = ensureVynoAccount(key, req.body.displayName || authUser?.full_name, req.body.walletAddress);
    const today = new Date().toISOString().slice(0, 10);
    if (account.last_checkin_date === today) {
      return res.status(429).json({ error: 'Daily check-in already claimed today.' });
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const nextStreak = account.last_checkin_date === yesterday ? Number(account.checkin_streak) + 1 : 1;
    const pointsAwarded = Math.min(100, 20 + (nextStreak - 1) * 5);
    const now = new Date().toISOString();

    db.prepare('UPDATE vyno_accounts SET checkin_streak = ?, last_checkin_date = ?, updated_at = ? WHERE account_key = ?').run(
      nextStreak,
      today,
      now,
      key
    );

    const entryRef = creditVynoPoints({
      accountKey: key,
      sourceType: 'checkin',
      pointsDelta: pointsAwarded,
      description: `Daily Explorer Check-In (Day ${nextStreak} Streak)`,
      metadata: { streak: nextStreak, date: today },
    });

    const updated = db.prepare('SELECT * FROM vyno_accounts WHERE account_key = ?').get(key);
    return res.json({
      entryRef,
      pointsAwarded,
      streak: nextStreak,
      profile: mapVynoAccountRow(updated),
    });
  } catch (error) {
    console.error('VYNO checkin error:', error);
    return res.status(500).json({ error: 'Daily check-in failed.' });
  }
});

const SPIN_SEGMENTS = [
  { index: 0, label: '15 PTS', points: 15 },
  { index: 1, label: '30 PTS', points: 30 },
  { index: 2, label: '50 PTS', points: 50 },
  { index: 3, label: '25 PTS', points: 25 },
  { index: 4, label: '75 PTS', points: 75 },
  { index: 5, label: '40 PTS', points: 40 },
  { index: 6, label: '100 PTS', points: 100 },
  { index: 7, label: '20 PTS', points: 20 },
];

app.post('/api/vyno/spin', publicWriteLimiter, (req, res) => {
  try {
    const authUser = getAuthenticatedUser(req);
    const key = normalizeAccountKey(req.body.accountKey, authUser);
    if (!key) return res.status(400).json({ error: 'Account key or sign-in required.' });

    const account = ensureVynoAccount(key, req.body.displayName || authUser?.full_name, req.body.walletAddress);
    const today = new Date().toISOString().slice(0, 10);
    if (account.last_spin_date === today) {
      return res.status(429).json({ error: 'Daily wheel spin already used today. Return tomorrow.' });
    }

    const segmentIdx = crypto.randomInt(0, SPIN_SEGMENTS.length);
    const prize = SPIN_SEGMENTS[segmentIdx];
    const now = new Date().toISOString();

    db.prepare('UPDATE vyno_accounts SET last_spin_date = ?, updated_at = ? WHERE account_key = ?').run(
      today,
      now,
      key
    );
    const entryRef = creditVynoPoints({
      accountKey: key,
      sourceType: 'spin',
      pointsDelta: prize.points,
      description: `Spin Wheel Bonus (${prize.label})`,
      metadata: { segmentIndex: segmentIdx, label: prize.label, date: today },
    });

    const updated = db.prepare('SELECT * FROM vyno_accounts WHERE account_key = ?').get(key);
    return res.json({
      entryRef,
      segmentIndex: segmentIdx,
      prizeLabel: prize.label,
      pointsAwarded: prize.points,
      profile: mapVynoAccountRow(updated),
    });
  } catch (error) {
    console.error('VYNO spin error:', error);
    return res.status(500).json({ error: 'Spin wheel error.' });
  }
});

app.post('/api/vyno/scratch', publicWriteLimiter, (req, res) => {
  try {
    const authUser = getAuthenticatedUser(req);
    const key = normalizeAccountKey(req.body.accountKey, authUser);
    if (!key) return res.status(400).json({ error: 'Account key or sign-in required.' });

    const account = ensureVynoAccount(key, req.body.displayName || authUser?.full_name, req.body.walletAddress);
    const today = new Date().toISOString().slice(0, 10);
    if (account.last_scratch_date === today) {
      return res.status(429).json({ error: 'Daily scratch card already revealed today.' });
    }

    const rewardTiers = [25, 35, 50, 65, 90];
    const pointsAwarded = rewardTiers[crypto.randomInt(0, rewardTiers.length)];
    const badgeLabel = pointsAwarded >= 65 ? 'Golden Dune Card' : 'Twilight Oasis Card';
    const now = new Date().toISOString();

    db.prepare('UPDATE vyno_accounts SET last_scratch_date = ?, updated_at = ? WHERE account_key = ?').run(
      today,
      now,
      key
    );
    const entryRef = creditVynoPoints({
      accountKey: key,
      sourceType: 'scratch',
      pointsDelta: pointsAwarded,
      description: `${badgeLabel} Reveal (+${pointsAwarded} PTS)`,
      metadata: { badgeLabel, date: today },
    });

    const updated = db.prepare('SELECT * FROM vyno_accounts WHERE account_key = ?').get(key);
    return res.json({
      entryRef,
      badgeLabel,
      pointsAwarded,
      profile: mapVynoAccountRow(updated),
    });
  } catch (error) {
    console.error('VYNO scratch error:', error);
    return res.status(500).json({ error: 'Scratch card verification failed.' });
  }
});

app.post('/api/vyno/quiz', publicWriteLimiter, (req, res) => {
  try {
    const authUser = getAuthenticatedUser(req);
    const key = normalizeAccountKey(req.body.accountKey, authUser);
    const quizId = cleanText(req.body.quizId, 80);
    const selectedIndex = Number(req.body.selectedIndex);

    if (!key || !quizId) {
      return res.status(400).json({ error: 'Account key and quizId required.' });
    }
    const q = VYNO_QUIZ_BANK.find((item) => item.id === quizId);
    if (!q) return res.status(404).json({ error: 'Quiz question not found.' });

    const account = ensureVynoAccount(key, req.body.displayName || authUser?.full_name, req.body.walletAddress);
    let completed: string[] = [];
    try { completed = JSON.parse(account.completed_quiz_ids || '[]'); } catch { completed = []; }
    if (completed.includes(quizId)) {
      return res.status(409).json({ error: 'You already earned points for this question.' });
    }

    const correct = selectedIndex === q.correctIndex;
    if (!correct) {
      return res.json({
        correct: false,
        pointsAwarded: 0,
        message: 'Not quite right — review the clue and try again!',
        profile: mapVynoAccountRow(account),
      });
    }

    completed.push(quizId);
    db.prepare('UPDATE vyno_accounts SET completed_quiz_ids = ?, updated_at = ? WHERE account_key = ?').run(
      JSON.stringify(completed),
      new Date().toISOString(),
      key
    );

    const entryRef = creditVynoPoints({
      accountKey: key,
      sourceType: 'quiz',
      pointsDelta: q.points,
      description: `Knowledge Quiz Solved: ${q.category}`,
      metadata: { quizId },
    });

    const updated = db.prepare('SELECT * FROM vyno_accounts WHERE account_key = ?').get(key);
    return res.json({
      correct: true,
      entryRef,
      pointsAwarded: q.points,
      message: `Correct! +${q.points} Participation Points added.`,
      profile: mapVynoAccountRow(updated),
    });
  } catch (error) {
    console.error('VYNO quiz error:', error);
    return res.status(500).json({ error: 'Quiz submission failed.' });
  }
});

app.post('/api/vyno/referrals', publicWriteLimiter, (req, res) => {
  try {
    const authUser = getAuthenticatedUser(req);
    const key = normalizeAccountKey(req.body.accountKey, authUser);
    const referredEmail = cleanText(req.body.referredEmail, 160).toLowerCase();
    const referredName = cleanText(req.body.referredName, 100);

    if (!key || !isValidEmail(referredEmail)) {
      return res.status(400).json({ error: 'Valid account key and friend email address are required.' });
    }
    if (authUser?.email && authUser.email.toLowerCase() === referredEmail) {
      return res.status(400).json({ error: 'Self-referrals are not permitted.' });
    }

    const account = ensureVynoAccount(key, req.body.displayName || authUser?.full_name, req.body.walletAddress);
    const existing = db.prepare('SELECT id FROM vyno_referrals WHERE referred_email = ?').get(referredEmail);
    if (existing) {
      return res.status(409).json({ error: 'This friend email has already been referred.' });
    }

    const pointsAwarded = 50;
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO vyno_referrals (
        referrer_account_key, referred_email, referred_name, referral_code, points_awarded, status, created_at
      ) VALUES (?, ?, ?, ?, ?, 'recorded', ?)`
    ).run(key, referredEmail, referredName, account.referral_code, pointsAwarded, now);

    const entryRef = creditVynoPoints({
      accountKey: key,
      sourceType: 'referral',
      pointsDelta: pointsAwarded,
      description: `Community Referral Invite (${referredName || referredEmail})`,
      metadata: { referredEmail },
    });

    const refCountRow = db
      .prepare('SELECT COUNT(*) AS total FROM vyno_referrals WHERE referrer_account_key = ?')
      .get(key) as { total: number };
    const updated = db.prepare('SELECT * FROM vyno_accounts WHERE account_key = ?').get(key);

    return res.status(201).json({
      entryRef,
      pointsAwarded,
      profile: mapVynoAccountRow(updated, Number(refCountRow?.total || 0)),
    });
  } catch (error) {
    console.error('VYNO referral error:', error);
    return res.status(500).json({ error: 'Unable to record referral.' });
  }
});

app.get('/api/vyno/leaderboard', (_req, res) => {
  const rows = db
    .prepare(
      'SELECT account_key, display_name, points_balance, lifetime_points, checkin_streak FROM vyno_accounts WHERE points_balance > 0 ORDER BY points_balance DESC, lifetime_points DESC LIMIT 20'
    )
    .all();
  res.json({
    leaderboard: rows.map((r: any, idx: number) => ({
      rank: idx + 1,
      displayName: String(r.display_name || 'Vanhsya Explorer'),
      pointsBalance: Number(r.points_balance),
      lifetimePoints: Number(r.lifetime_points),
      checkinStreak: Number(r.checkin_streak),
    })),
  });
});

app.post('/api/vyno/claims', publicWriteLimiter, (req, res) => {
  const status = getProviderStatusSnapshot();
  if (!status.vynoContract.configured || !status.vynoContract.complianceApproved) {
    return res.status(403).json({
      status: 'compliance_hold',
      error:
        'On-chain VYNO token conversion and wallet claims are disabled pending smart contract deployment (VYNO_CONTRACT_ADDRESS) and regulatory compliance approval.',
    });
  }
  return res.status(501).json({ error: 'On-chain claim execution handler not attached yet.' });
});

// --- Expanded Admin Travel, Payment & VYNO Governance Routes ---

app.post('/api/admin/packages', requireAdminAuth, (req, res) => {
  try {
    const title = cleanText(req.body.title, 160);
    const subtitle = cleanText(req.body.subtitle, 220);
    const category = cleanText(req.body.category, 80) || 'UAE Signature Package';
    const city = cleanText(req.body.city, 80);
    const country = cleanText(req.body.country, 80) || 'UAE';
    const durationLabel = cleanText(req.body.durationLabel, 80) || 'Full Day';
    const priceUsd = Math.max(10, Number(req.body.priceUsd || 100));
    const coverImageUrl = cleanText(req.body.coverImageUrl, 500);
    const meetingPoint = cleanText(req.body.meetingPoint, 240);
    const timeSlots = Array.isArray(req.body.timeSlots) ? req.body.timeSlots.map((s: any) => cleanText(s, 60)).filter(Boolean) : ['9:00 AM', '4:00 PM'];
    const highlights = Array.isArray(req.body.highlights) ? req.body.highlights.map((h: any) => cleanText(h, 160)).filter(Boolean) : [];

    if (!title || !city) {
      return res.status(400).json({ error: 'Package title and city are required.' });
    }
    const baseSlug = slugify(title);
    const slug = db.prepare('SELECT id FROM travel_packages WHERE slug = ?').get(baseSlug)
      ? `${baseSlug}-${Date.now().toString().slice(-4)}`
      : baseSlug;
    const now = new Date().toISOString();

    const result = db
      .prepare(
        `INSERT INTO travel_packages (
          slug, title, subtitle, category, city, country, duration_label, price_usd,
          cover_image_url, meeting_point, time_slots, highlights, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
      )
      .run(
        slug,
        title,
        subtitle,
        category,
        city,
        country,
        durationLabel,
        priceUsd,
        coverImageUrl,
        meetingPoint,
        JSON.stringify(timeSlots),
        JSON.stringify(highlights),
        now,
        now
      );
    const created = db.prepare('SELECT * FROM travel_packages WHERE id = ?').get(result.lastInsertRowid);
    recordAdminAudit('CREATE_PACKAGE', 'travel_package', result.lastInsertRowid as number, `Created package "${title}" ($${priceUsd})`);
    return res.status(201).json({ package: mapPackageRow(created) });
  } catch (error) {
    console.error('Admin create package error:', error);
    return res.status(500).json({ error: 'Unable to create travel package.' });
  }
});

app.patch('/api/admin/bookings/:id', requireAdminAuth, (req, res) => {
  const id = Number(req.params.id);
  const status = cleanText(req.body.status, 40);
  if (!['pending_confirmation', 'confirmed', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid booking status.' });
  }
  const existing = db.prepare('SELECT * FROM travel_bookings WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ error: 'Booking not found.' });

  db.prepare('UPDATE travel_bookings SET status = ? WHERE id = ?').run(status, id);
  recordAdminAudit('UPDATE_BOOKING_STATUS', 'travel_booking', existing.booking_ref, `Updated status to ${status}`);
  const updated = db.prepare('SELECT * FROM travel_bookings WHERE id = ?').get(id);
  return res.json({ booking: mapTravelBookingRow(updated) });
});

app.post('/api/admin/payments/:id/refund', requireAdminAuth, (req, res) => {
  const id = Number(req.params.id);
  const tx = db.prepare('SELECT * FROM payment_transactions WHERE id = ?').get(id) as any;
  if (!tx) return res.status(404).json({ error: 'Payment transaction not found.' });

  const now = new Date().toISOString();
  db.prepare('UPDATE payment_transactions SET status = ?, updated_at = ? WHERE id = ?').run('refunded', now, id);
  db.prepare('UPDATE travel_bookings SET payment_status = ?, status = ? WHERE id = ?').run(
    'refunded',
    'cancelled',
    tx.booking_id
  );
  recordAdminAudit('MARK_PAYMENT_REFUNDED', 'payment_transaction', tx.tx_ref, `Marked ${tx.tx_ref} as refunded`);
  const updated = db
    .prepare(
      'SELECT p.*, b.booking_ref FROM payment_transactions p LEFT JOIN travel_bookings b ON b.id = p.booking_id WHERE p.id = ?'
    )
    .get(id);
  return res.json({ transaction: mapPaymentRow(updated) });
});

app.patch('/api/admin/enquiries/:id', requireAdminAuth, (req, res) => {
  const id = Number(req.params.id);
  const status = req.body.status;
  if (!['new', 'in_review', 'quoted', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid enquiry status.' });
  }
  const existing = db.prepare('SELECT * FROM travel_enquiries WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ error: 'Enquiry not found.' });

  db.prepare('UPDATE travel_enquiries SET status = ? WHERE id = ?').run(status, id);
  recordAdminAudit('UPDATE_ENQUIRY_STATUS', 'travel_enquiry', existing.enquiry_ref, `Updated status to ${status}`);
  const updated = db.prepare('SELECT * FROM travel_enquiries WHERE id = ?').get(id);
  return res.json({ enquiry: mapEnquiryRow(updated) });
});

app.post('/api/admin/vyno/adjust', requireAdminAuth, (req, res) => {
  const accountKey = normalizeAccountKey(req.body.accountKey);
  const delta = Number(req.body.pointsDelta);
  const reason = cleanText(req.body.reason, 200) || 'Administrator adjustment';
  if (!accountKey || !Number.isFinite(delta) || delta === 0) {
    return res.status(400).json({ error: 'Valid accountKey and non-zero pointsDelta required.' });
  }
  ensureVynoAccount(accountKey);
  const entryRef = creditVynoPoints({
    accountKey,
    sourceType: 'admin_adjust',
    pointsDelta: Math.round(delta),
    description: reason,
    metadata: { admin: true },
  });
  recordAdminAudit('ADJUST_VYNO_POINTS', 'vyno_account', accountKey, `${delta > 0 ? '+' : ''}${Math.round(delta)} pts: ${reason}`);
  const updated = db.prepare('SELECT * FROM vyno_accounts WHERE account_key = ?').get(accountKey);
  return res.json({ entryRef, account: mapVynoAccountRow(updated) });
});

// =====================================================================
// VENTURES, FRANCHISES, KIOSKS, CHARITY, SURPRISES & MISSED CONNECTIONS
// =====================================================================

app.post('/api/ventures', publicWriteLimiter, (req, res) => {
  try {
    const allowedCats = ['investment', 'space_franchise', 'kiosk_booking', 'flight_prebooking', 'business_hub'];
    const category = allowedCats.includes(req.body.category) ? req.body.category : 'investment';
    const fullName = cleanText(req.body.fullName, 120);
    const organization = cleanText(req.body.organization, 140);
    const email = cleanText(req.body.email, 160).toLowerCase();
    const phone = cleanText(req.body.phone, 40);
    const cityEmirate = cleanText(req.body.cityEmirate, 80) || 'Dubai';
    const spaceSizeSqft = cleanText(req.body.spaceSizeSqft, 60);
    const preferredDate = cleanText(req.body.preferredDate, 40);
    const budgetBand = cleanText(req.body.budgetBand, 80);
    const summary = cleanMultilineText(req.body.summary, 2500);

    if (!fullName || !isValidEmail(email) || !summary || summary.length < 10) {
      return res.status(400).json({ error: 'Full name, valid email, and proposal/reservation details are required.' });
    }

    const requestRef = generateReference('VNT');
    const now = new Date().toISOString();
    const result = db
      .prepare(
        `INSERT INTO venture_requests (
          request_ref, category, full_name, organization, email, phone, city_emirate,
          space_size_sqft, preferred_date, budget_band, summary, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?)`
      )
      .run(
        requestRef,
        category,
        fullName,
        organization,
        email,
        phone,
        cityEmirate,
        spaceSizeSqft,
        preferredDate,
        budgetBand,
        summary,
        now
      );

    const created = db.prepare('SELECT * FROM venture_requests WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({
      venture: mapVentureRow(created),
      message: `Recorded under ${requestRef}. Our Dubai ventures & operations desk will respond via info@vanhsya.com.`,
    });
  } catch (error: any) {
    console.error('Venture request error:', error);
    return res.status(500).json({ error: 'Unable to submit request right now.' });
  }
});

app.patch('/api/admin/ventures/:id', requireAdminAuth, (req, res) => {
  const id = Number(req.params.id);
  const status = cleanText(req.body.status, 30);
  if (!['submitted', 'in_review', 'approved', 'declined'].includes(status)) {
    return res.status(400).json({ error: 'Invalid venture request status.' });
  }
  const existing = db.prepare('SELECT * FROM venture_requests WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ error: 'Venture request not found.' });

  db.prepare('UPDATE venture_requests SET status = ? WHERE id = ?').run(status, id);
  recordAdminAudit('UPDATE_VENTURE_STATUS', 'venture_request', existing.request_ref, `Updated status to ${status}`);
  const updated = db.prepare('SELECT * FROM venture_requests WHERE id = ?').get(id);
  return res.json({ venture: mapVentureRow(updated) });
});

app.get('/api/charity/impact', (_req, res) => {
  try {
    const totals = db
      .prepare(
        `SELECT
           COUNT(*) AS total_orders,
           COALESCE(SUM(CASE WHEN order_type = 'printed_tshirt' THEN quantity ELSE 0 END), 0) AS tshirts_reserved,
           COALESCE(SUM(CASE WHEN order_type IN ('charity_pledge', 'printed_tshirt') THEN pledge_amount_aed ELSE 0 END), 0) AS pledged_aed,
           COALESCE(SUM(CASE WHEN order_type = 'surprise_planner' THEN 1 ELSE 0 END), 0) AS surprises_planned,
           COALESCE(SUM(CASE WHEN order_type = 'couples_adventure' THEN 1 ELSE 0 END), 0) AS couples_requests
         FROM surprise_charity_orders
         WHERE status != 'cancelled'`
      )
      .get() as any;
    res.json({
      totalOrders: Number(totals?.total_orders || 0),
      tshirtsReserved: Number(totals?.tshirts_reserved || 0),
      pledgedAed: Number(totals?.pledged_aed || 0),
      surprisesPlanned: Number(totals?.surprises_planned || 0),
      couplesRequests: Number(totals?.couples_requests || 0),
    });
  } catch {
    res.status(500).json({ error: 'Unable to load charity impact ledger.' });
  }
});

app.post('/api/surprises', publicWriteLimiter, (req, res) => {
  try {
    const allowedTypes = ['surprise_planner', 'printed_tshirt', 'charity_pledge', 'couples_adventure'];
    const orderType = allowedTypes.includes(req.body.orderType) ? req.body.orderType : 'surprise_planner';
    const fullName = cleanText(req.body.fullName, 120);
    const email = cleanText(req.body.email, 160).toLowerCase();
    const phone = cleanText(req.body.phone, 40);
    const occasionOrPackage = cleanText(req.body.occasionOrPackage, 160);
    const recipientFirstName = cleanText(req.body.recipientFirstName, 80);
    const preferredDate = cleanText(req.body.preferredDate, 40);
    const emirate = cleanText(req.body.emirate, 60) || 'Dubai';
    const shirtSize = cleanText(req.body.shirtSize, 16);
    const shirtColor = cleanText(req.body.shirtColor, 40);
    const quantity = Math.max(1, Math.min(50, Number(req.body.quantity || 1)));
    const charityCause = cleanText(req.body.charityCause, 120);
    const pledgeAmountAed = Math.max(0, Math.min(250000, Number(req.body.pledgeAmountAed || 0)));
    const notes = cleanMultilineText(req.body.notes, 2000);

    if (!fullName || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid name and email address are required.' });
    }

    const orderRef = generateReference('VCS');
    const now = new Date().toISOString();
    const result = db
      .prepare(
        `INSERT INTO surprise_charity_orders (
          order_ref, order_type, full_name, email, phone, occasion_or_package, recipient_first_name,
          preferred_date, emirate, shirt_size, shirt_color, quantity, charity_cause, pledge_amount_aed,
          notes, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', ?)`
      )
      .run(
        orderRef,
        orderType,
        fullName,
        email,
        phone,
        occasionOrPackage,
        recipientFirstName,
        preferredDate,
        emirate,
        shirtSize,
        shirtColor,
        quantity,
        charityCause,
        pledgeAmountAed,
        notes,
        now
      );

    const created = db.prepare('SELECT * FROM surprise_charity_orders WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({
      order: mapSurpriseOrderRow(created),
      message: `Reference ${orderRef} saved. Our team will confirm details via info@vanhsya.com or WhatsApp.`,
    });
  } catch (error: any) {
    console.error('Surprise/charity order error:', error);
    return res.status(500).json({ error: 'Unable to record your request.' });
  }
});

app.patch('/api/admin/surprises/:id', requireAdminAuth, (req, res) => {
  const id = Number(req.params.id);
  const status = cleanText(req.body.status, 30);
  if (!['received', 'scheduled', 'fulfilled', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid order status.' });
  }
  const existing = db.prepare('SELECT * FROM surprise_charity_orders WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ error: 'Order not found.' });

  db.prepare('UPDATE surprise_charity_orders SET status = ? WHERE id = ?').run(status, id);
  recordAdminAudit('UPDATE_SURPRISE_ORDER', 'surprise_charity_order', existing.order_ref, `Updated status to ${status}`);
  const updated = db.prepare('SELECT * FROM surprise_charity_orders WHERE id = ?').get(id);
  return res.json({ order: mapSurpriseOrderRow(updated) });
});

// Privacy-First Missed Connections ("Didn't Make It / Connect for Life")
// NEVER returns private_email or private_phone publicly.
app.get('/api/connections/public', (_req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT c.id, c.post_ref, c.alias_name, c.emirate, c.location_or_event,
                c.encounter_date, c.public_note, c.age_confirmed_18_plus, c.consent_public_post,
                c.status, c.created_at,
                (SELECT COUNT(*) FROM connection_relays cr WHERE cr.connection_id = c.id) AS reply_count
         FROM missed_connections c
         WHERE c.status = 'active' AND c.consent_public_post = 1 AND c.age_confirmed_18_plus = 1
         ORDER BY c.id DESC
         LIMIT 40`
      )
      .all();
    res.json({ connections: rows.map((row) => mapPublicConnectionRow(row)) });
  } catch {
    res.status(500).json({ error: 'Unable to load Connect for Life notes.' });
  }
});

app.post('/api/connections', publicWriteLimiter, (req, res) => {
  try {
    const aliasName = cleanText(req.body.aliasName, 60);
    const privateEmail = cleanText(req.body.privateEmail, 160).toLowerCase();
    const privatePhone = cleanText(req.body.privatePhone, 40);
    const emirate = cleanText(req.body.emirate, 60) || 'Dubai';
    const locationOrEvent = cleanText(req.body.locationOrEvent, 160);
    const encounterDate = cleanText(req.body.encounterDate, 40);
    const publicNote = cleanMultilineText(req.body.publicNote, 600);
    const ageConfirmed18Plus = Boolean(req.body.ageConfirmed18Plus);
    const consentPublicPost = Boolean(req.body.consentPublicPost);

    if (!aliasName || aliasName.length < 2) {
      return res.status(400).json({ error: 'Please provide a public first name or alias (no last name needed).' });
    }
    if (!isValidEmail(privateEmail)) {
      return res.status(400).json({ error: 'A private email is required for admin-moderated relay (never displayed publicly).' });
    }
    if (!locationOrEvent || !publicNote || publicNote.length < 12) {
      return res.status(400).json({ error: 'Please include the meetup/place and a respectful note.' });
    }
    if (!ageConfirmed18Plus || !consentPublicPost) {
      return res.status(400).json({ error: 'You must confirm you are 18+ and consent to display your alias and note without private contact details.' });
    }

    const postRef = generateReference('VCL');
    const now = new Date().toISOString();
    const result = db
      .prepare(
        `INSERT INTO missed_connections (
          post_ref, alias_name, private_email, private_phone, emirate, location_or_event,
          encounter_date, public_note, age_confirmed_18_plus, consent_public_post, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 'active', ?)`
      )
      .run(
        postRef,
        aliasName,
        privateEmail,
        privatePhone,
        emirate,
        locationOrEvent,
        encounterDate,
        publicNote,
        now
      );

    const created = db
      .prepare(
        `SELECT id, post_ref, alias_name, emirate, location_or_event, encounter_date,
                public_note, age_confirmed_18_plus, consent_public_post, status, 0 AS reply_count, created_at
         FROM missed_connections WHERE id = ?`
      )
      .get(result.lastInsertRowid);

    return res.status(201).json({
      connection: mapPublicConnectionRow(created),
      message: 'Your note is live anonymously. Private email/phone remain sealed for opt-in relay only.',
    });
  } catch (error: any) {
    console.error('Missed connection create error:', error);
    return res.status(500).json({ error: 'Unable to publish note right now.' });
  }
});

app.post('/api/connections/:id/reply', publicWriteLimiter, (req, res) => {
  try {
    const id = Number(req.params.id);
    const conn = db.prepare("SELECT id, post_ref FROM missed_connections WHERE id = ? AND status = 'active'").get(id) as any;
    if (!conn) {
      return res.status(404).json({ error: 'Active note not found.' });
    }
    const senderAlias = cleanText(req.body.senderAlias, 60);
    const senderEmail = cleanText(req.body.senderEmail, 160).toLowerCase();
    const messageText = cleanMultilineText(req.body.messageText, 800);

    if (!senderAlias || !isValidEmail(senderEmail) || !messageText || messageText.length < 8) {
      return res.status(400).json({ error: 'Enter your alias, private email, and a short introductory note.' });
    }

    db.prepare(
      `INSERT INTO connection_relays (connection_id, sender_alias, sender_email, message_text, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, senderAlias, senderEmail, messageText, new Date().toISOString());

    return res.status(201).json({
      ok: true,
      message: 'Private relay queued securely. The recipient receives your intro only with mutual privacy protection.',
    });
  } catch {
    return res.status(500).json({ error: 'Unable to send private relay.' });
  }
});

app.patch('/api/admin/connections/:id', requireAdminAuth, (req, res) => {
  const id = Number(req.params.id);
  const status = cleanText(req.body.status, 30);
  if (!['active', 'moderated', 'archived'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  const existing = db.prepare('SELECT post_ref FROM missed_connections WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ error: 'Connection note not found.' });

  db.prepare('UPDATE missed_connections SET status = ? WHERE id = ?').run(status, id);
  recordAdminAudit('MODERATE_CONNECTION', 'missed_connection', existing.post_ref, `Set connection note to ${status}`);
  return res.json({ ok: true, id, status });
});

// --- Existing Gemini AI Proxy Endpoints ---

app.post('/api/gemini/generate-text', async (req, res) => {
  try {
    const { prompt, model = 'gemini-3.1-flash-lite', systemInstruction } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const config: any = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    res.json({ text: response.text || '' });
  } catch (error: any) {
    console.error('Error generating text:', error);
    res.status(500).json({ error: error.message || 'Failed to generate text' });
  }
});

app.post('/api/gemini/generate-stream', async (req, res) => {
  try {
    const { prompt, model = 'gemini-3.1-flash-lite', systemInstruction } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }

    const config: any = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    const stream = await generateContentStreamWithFallback({
      model,
      contents: prompt,
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    for await (const chunk of stream) {
      const text = chunk.text || '';
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Error in text stream:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Stream generation failed' });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || 'Stream interrupted' })}\n\n`);
      res.end();
    }
  }
});

app.post('/api/gemini/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio = '16:9' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const FALLBACK_GENERATED_IMAGE = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80';
    let imageUrl: string | null = null;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
          },
        },
      });

      const candidateParts = response.candidates?.[0]?.content?.parts;
      if (candidateParts) {
        for (const part of candidateParts) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType || 'image/png';
            imageUrl = `data:${mime};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    } catch (imgError) {
      console.warn('Image generation API call returned error, using fallback:', imgError);
      imageUrl = FALLBACK_GENERATED_IMAGE;
    }

    if (!imageUrl) {
      imageUrl = FALLBACK_GENERATED_IMAGE;
    }

    res.json({ imageUrl });
  } catch (error: any) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
});

app.post('/api/gemini/chat', async (req, res) => {
  try {
    const {
      message,
      history = [],
      systemInstruction,
      useSearch = true,
      useMaps = false,
      model = 'gemini-3.1-flash-lite',
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Missing message' });
    }

    const tools: any[] = [];
    if (useSearch) {
      tools.push({ googleSearch: {} });
    } else if (useMaps) {
      tools.push({ googleMaps: {} });
    }

    const config: any = {};
    if (systemInstruction) config.systemInstruction = systemInstruction;
    if (tools.length > 0) config.tools = tools;

    const formattedHistory = history.map((item: any) => ({
      role: item.role === 'model' ? 'model' : 'user',
      parts: [{ text: item.text || '' }],
    }));

    const chat = ai.chats.create({
      model,
      config: Object.keys(config).length > 0 ? config : undefined,
      history: formattedHistory.length > 0 ? formattedHistory : undefined,
    });

    let response;
    try {
      response = await chat.sendMessage({ message });
    } catch (chatError: any) {
      if (tools.length > 0) {
        console.warn('Grounding tool call failed, retrying without external tools:', chatError);
        const retryChat = ai.chats.create({
          model,
          config: systemInstruction ? { systemInstruction } : undefined,
          history: formattedHistory.length > 0 ? formattedHistory : undefined,
        });
        response = await retryChat.sendMessage({ message });
      } else {
        throw chatError;
      }
    }

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    res.json({
      text: response.text || '',
      sources,
    });
  } catch (error: any) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: error.message || 'Chat request failed' });
  }
});

app.post('/api/gemini/tts', async (req, res) => {
  try {
    const { text, voiceName = 'Kore' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Missing text' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio returned' });
    }

    res.json({ audio: base64Audio, mimeType: 'audio/wav' });
  } catch (error: any) {
    console.error('Error in TTS:', error);
    res.status(500).json({ error: error.message || 'TTS generation failed' });
  }
});

app.post('/api/gemini/generate-video', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-lite-generate-preview',
      prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9',
      },
    });

    let attempts = 0;
    while (!operation.done && attempts < 25) {
      await new Promise((resolve) => setTimeout(resolve, 8000));
      operation = await ai.operations.getVideosOperation({ operation });
      attempts++;
    }

    const downloadUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadUri) {
      return res.status(500).json({ error: 'Video generation failed or timed out' });
    }

    const vidResponse = await fetch(downloadUri, {
      headers: {
        'x-goog-api-key': apiKey,
      },
    });
    const arrayBuffer = await vidResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    res.json({ videoUrl: `data:video/mp4;base64,${base64}` });
  } catch (error: any) {
    console.error('Error in video generation:', error);
    res.status(500).json({ error: error.message || 'Video generation failed' });
  }
});

// --- Vanhsya Travels X Concierge & Translator Server Endpoints ---

const VANHSYA_PLATFORM_KNOWLEDGE = `
BRAND & IDENTITY:
- Official Name: Vanhsya Travels X — intelligent multilingual travel concierge, live translator, and platform navigator for Vanhsya Global Travels (www.vanhsya.com) & Vanhsya Social Club UAE.
- Official Website: https://www.vanhsya.com
- Official Instagram: @vanhsyatravels (https://www.instagram.com/vanhsyatravels?evlk=Zzlsd3JsdGE0NGww&utm_source=qr)
- Direct Booking & Concierge WhatsApp: +971 50 623 0702 (https://wa.me/971506230702)
- Official Bookings, Ventures & Partnerships Email: info@vanhsya.com
- Official Support, Member Care & Privacy Email: support@vanhsya.com

CORE CAMPAIGN & AUDIENCE:
- Vanhsya Social Club UAE: Campaign "Life Begins With a Hello" | Tagline "Come alone. Explore together."
- Exclusively for UAE residents aged 18+ across Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, and Umm Al Quwain.
- Founding Members receive a permanent digital pass (VSC-UAE-...) with a check-in QR code and downloadable PNG card.
- Administrators strictly verify every live meetup before listing; expired demos, fake attendees, and unverified upcoming dates are never shown.

COMPLETE PLATFORM ROUTES (for navigateTo):
- "/" — Homepage: Campaign overview, Instagram QR, WhatsApp connect, UAE curated catalog, interactive map.
- "/book" (or "/packages", "/flights", "/hotels", "/buses") — Travel Booking Hub: Interactive Vanhsya Packages & Experiences booking, plus Flight Pre-Booking / Hotel / Bus integration desks with transparent supplier status & concierge requests.
- "/ventures" (or "/invest", "/charity", "/couples") — Vanhsya Ventures, Charity & Experiences: Investment & Space/Property Franchise inquiries, Smart Travel Kiosk & Business Hub Spot bookings, Flight Pre-Booking Desks, Charity Impact & Branded Printed Vanhsya T-Shirts, Unexpected Surprises (birthdays & milestones), and Scariest Adventures for Couples.
- "/treasure-hunt" — THE BLUEPRINT: Half-Detail Doctrine, Node #0X-DE-01, interactive UAE Mission Board (Al Fahidi, Louvre Abu Dhabi, Hatta), progressive Half-Clue A / Half-Clue B decoder, Protocol 111/222/333 cards.
- "/meetups" — Stranger MeetUps: Ambient story films, 2-column vertical photo gallery, Host Spotlight, verified 18+ UAE gatherings separated into Upcoming, Sold Out, Completed, and Cancelled tabs, plus downloadable event flyers & Instagram 4:5 / 9:16 promo cards.
- "/social-club" — Vanhsya Social Club: Mobile-first 18+ UAE registration form, instant Founding Member Digital ID generation & download, consent-based Email/WhatsApp notifications, referral sharing.
- "/ai-planner" — AI Travel Planner: Real-time streaming custom multi-day itinerary architect for UAE and global trips with generated visuals.
- "/vr-experience" — VR Experience: Interactive zoomable 3D orbital globe showing travel routes, hotspots, and visual previews.
- "/vyno" (or "/web3") — VYNO Ecosystem & Web3 Console: Server-verified Participation Points & Rewards portal, ethers.js wallet connection (MetaMask, Coinbase Wallet, Phantom EVM, Ephemeral Sandbox), ECDSA signature proof verification, EVM transaction lookup, and transparent compliance review status.
- "/daily-rewards" — VYNO Rewards Centre: Daily Check-In streak, server-CSPRNG Spin Wheel, Scratch Card, Knowledge Quiz, Leaderboard & Activity Ledger (operating strictly in server-verified Participation Points mode until contract compliance approval).
- "/community" — Community Unbound: Interest circles, interactive Explorer Compatibility Icebreaker Game, Privacy-First Missed Connections ("Connect for Life") Lounge & Private Relay, verified attendee feedback, and post-event survey submissions.
- "/partners/apply" — Partners & Hosts: B2B venue partner and Community Host onboarding application.
- "/blogs" — Travel Journals: Field dispatches and curated destination stories.
- "/dashboard" — Explorer Account & Passport Dashboard: Account sign-in, profile & notification preferences, favorites, persistent bookings with HTML receipts, Trip Feedback reviews, Founding Member verification, and VYNO Points summary.
- "/legal" — Legal Center: Privacy Policy (support@vanhsya.com), Missed Connections Private Relay protections, Ventures terms, UAE 18+ Community Guidelines, and 24-hour RSVP Cancellation Terms.
- "/whitepaper" — Platform Overview & Technical Whitepaper.
- "/admin" — Authorized Administrator Console for event & package management, bookings & Stripe payment status, enquiries, ventures, surprises, missed connections moderation, VYNO points governance, and immutable audit logs.

CURATED TOURS & SLUGS (routes: "/tours/<slug>"):
1. "/tours/dubai-desert-safari" — Dubai Desert Safari: Red Dune Adventure (UAE)
2. "/tours/dubai-miracle-garden-global-village" — Dubai Miracle Garden & Global Village Tour (UAE)
3. "/tours/dubai-aquaventure-waterpark" — Aquaventure Waterpark: The Ultimate Splash (UAE)
4. "/tours/abu-dhabi-mosque-louvre-tour" — Abu Dhabi Grand Mosque & Louvre VIP Tour (UAE)
5. "/tours/jebel-jais-zipline-adventure" — Jebel Jais Zipline Adventure (Ras Al Khaimah, UAE)
6. "/tours/sharjah-cultural-tour" — Sharjah Cultural & Heritage Tour (UAE)
7. "/tours/fujairah-east-coast-tour" — Fujairah East Coast Tour & Snorkeling (UAE)
8. "/tours/hatta-mountain-safari" — Hatta Mountain Safari & Kayaking (UAE)
9. "/tours/paris-eiffel-tower-tour" — Paris Eiffel Tower Summit Tour (France)
10. "/tours/machu-picchu-inca-trail-trek" — Machu Picchu Inca Trail Trek (Peru)
11. "/tours/serengeti-great-migration-safari" — Serengeti Great Migration Safari (Tanzania)
12. "/tours/iceland-northern-lights-expedition" — Iceland Northern Lights Expedition (Iceland)
13. "/tours/kyoto-cherry-blossom-discovery" — Kyoto Cherry Blossom Discovery (Japan)

PRICING & CURRENCIES:
- Supports AED (default), USD, EUR, GBP, INR, AUD, CAD, CHF, CNY, JPY.
- Group discounts are available on tours as shown on each tour page.

COMPLIANCE & HONESTY RULES:
- Token financial promotions, staking programs, APY/yield claims, and on-chain token payouts remain disabled pending separate regulatory compliance review. VYNO rewards operate strictly as non-financial Participation Points.
- Live flight, hotel, and bus search feeds require external supplier credentials; never invent live fares or schedules—direct users to "/book" or WhatsApp +971 50 623 0702 or info@vanhsya.com.
- Never promise guaranteed investment yields/ROI on "/ventures"; venture & franchise forms log inquiries for official desk review.
- Never invent active bookings, attendee counts, or upcoming meetup dates—direct users to "/meetups" for live verified events.
`;

function safeParseModelJson<T = Record<string, any>>(rawText: string | undefined, fallback: T): T {
  const txt = (rawText || '').trim();
  if (!txt) return fallback;
  try {
    return JSON.parse(txt) as T;
  } catch {
    const stripped = txt
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    try {
      return JSON.parse(stripped) as T;
    } catch {
      const start = stripped.indexOf('{');
      const end = stripped.lastIndexOf('}');
      if (start !== -1 && end > start) {
        try {
          return JSON.parse(stripped.slice(start, end + 1)) as T;
        } catch {
          return fallback;
        }
      }
      return fallback;
    }
  }
}

function buildModulationGuidance(options: {
  lang?: string;
  voiceStyle?: string;
  slangStyle?: string;
  customStyle?: string;
}) {
  const langInstruction =
    !options.lang || options.lang === 'auto'
      ? 'LANGUAGE: Automatically detect whatever language, dialect, script, or Romanized street slang the user speaks or writes (supports English, Arabic, Hindi, Urdu, Malayalam, Tamil, Telugu, Bengali, Punjabi, Spanish, French, Russian, Mandarin, Cantonese, Japanese, Korean, German, Italian, Portuguese, Tagalog/Filipino, Turkish, Persian, Swahili, Indonesian/Malay, Thai, Vietnamese, Nigerian Pidgin, Amharic, and ALL human languages & dialects) and reply fluently.'
      : `LANGUAGE: Speak, write, and translate fluently into "${options.lang}". Preserve accurate meaning while adapting idiomatically to any requested dialect or slang.`;

  const styleMap: Record<string, string> = {
    natural: 'TONE & CADENCE: Balanced, crisp, warm, natural conversational hospitality pace.',
    'luxury-calm': 'TONE & CADENCE: Serene, unhurried, bespoke five-star concierge poise with graceful phrasing.',
    energetic: 'TONE & CADENCE: Upbeat, adventurous, brisk pacing full of excitement for travel and exploration.',
    storyteller: 'TONE & CADENCE: Evocative, vivid, cinematic storytelling flair while keeping answers concise.',
  };

  const slangMap: Record<string, string> = {
    standard: 'DIALECT & SLANG MODULATION: Clear, internationally intelligible, polished phrasing.',
    'uae-khaleeji':
      'DIALECT & SLANG MODULATION: Use warm UAE & Emirati/Khaleeji hospitality idioms naturally (e.g., "Marhaba", "Yalla", "Hayyakum", "Ya salam", Gulf Arabic warmth) while keeping details crystal clear.',
    'egyptian-masri':
      'DIALECT & SLANG MODULATION: Conversational Egyptian Masri warmth ("Ahlan", "Ya Basha", "Tamam", vibrant Cairo cadence).',
    levantine:
      'DIALECT & SLANG MODULATION: Warm Levantine Shami conversational Arabic phrasing ("Kifak", "Ahla w sahla", friendly Beirut/Amman tone).',
    'genz-social':
      'DIALECT & SLANG MODULATION: Upbeat, modern Stranger MeetUps social energy—friendly, effortless, authentic contemporary phrasing.',
    'hinglish-desi':
      'DIALECT & SLANG MODULATION: Natural Hinglish / warm South Asian conversational mix (e.g., Mumbai/Delhi friendly flow with clear info).',
    taglish:
      'DIALECT & SLANG MODULATION: Natural Taglish / Manila conversational warmth ("Tara!", "Sige", friendly OFW & traveler energy).',
    'japanese-casual':
      'DIALECT & SLANG MODULATION: Friendly, modern Japanese conversational tone (natural Tokyo casual-polite balance).',
    'parisian-street':
      'DIALECT & SLANG MODULATION: Chic contemporary Parisian conversational French expressions and relaxed rhythm.',
    'british-aussie':
      'DIALECT & SLANG MODULATION: Effortless Commonwealth traveler banter ("Brilliant", "Cheers", crisp witty tone).',
    'nigerian-pidgin':
      'DIALECT & SLANG MODULATION: Warm, expressive West African / Nigerian Pidgin conversational cadence ("How far", "No wahala", upbeat friendliness).',
    'local-street':
      'DIALECT & SLANG MODULATION: Vivid everyday colloquial street idioms, regional contractions, and native expressions of the target language without sacrificing accuracy.',
    executive:
      'DIALECT & SLANG MODULATION: Formal VIP diplomatic & investor executive protocol.',
  };

  const customNote = cleanText(options.customStyle, 140);
  return [
    langInstruction,
    styleMap[options.voiceStyle || 'natural'] || styleMap.natural,
    slangMap[options.slangStyle || 'standard'] || slangMap.standard,
    customNote ? `CUSTOM USER MODULATION PREFERENCE: "${customNote}"` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

app.post('/api/gemini/concierge', async (req, res) => {
  try {
    const message = cleanMultilineText(req.body.message, 1500);
    const history = Array.isArray(req.body.history) ? req.body.history.slice(-8) : [];
    const targetLang = cleanText(req.body.targetLang || 'auto', 60);
    const voiceStyle = cleanText(req.body.voiceStyle || 'natural', 40);
    const slangStyle = cleanText(req.body.slangStyle || 'standard', 40);
    const customStyle = cleanText(req.body.customStyle || '', 140);

    if (!message) {
      return res.status(400).json({ error: 'Please enter a message or navigation request.' });
    }

    const modulation = buildModulationGuidance({
      lang: targetLang,
      voiceStyle,
      slangStyle,
      customStyle,
    });

    const systemInstruction = `
You are "Vanhsya Travels X", the intelligent multilingual guide, live translator, and platform navigator for Vanhsya Global Travels (www.vanhsya.com) and Vanhsya Social Club UAE.

${VANHSYA_PLATFORM_KNOWLEDGE}

${modulation}

INSTRUCTIONS:
1. Give complete, helpful, accurate answers about Vanhsya tours, The Blueprint, Stranger MeetUps, Vanhsya Social Club (UAE 18+), Travel Hub (/book), Ventures/Franchises/Kiosks/Charity/Surprises/Couples (/ventures), Missed Connections & Icebreakers (/community), AI Planner, VR Globe, Web3 console, @vanhsyatravels, www.vanhsya.com, info@vanhsya.com, support@vanhsya.com, and WhatsApp (+971 50 623 0702).
2. If the user asks to navigate, open, visit, invest, book flights/kiosks, view charity/couples adventures, or explore a page/tour, set "navigateToPath" to the exact valid route (or "" if no automatic navigation is needed) AND include helpful "suggestedLinks" (1 to 3 relevant routes).
3. Keep "reply" concise (2-4 crisp sentences max), warm, and actionable in the requested or detected language & slang modulation.
`;

    const conversationPrompt =
      history.length > 0
        ? `Recent context:\n${history
            .map((h: any) => `${h.role === 'model' ? 'Vanhsya X' : 'User'}: ${cleanText(h.text, 400)}`)
            .join('\n')}\n\nUser now says: ${message}`
        : message;

    const response = await generateContentWithFallback({
      model: 'gemini-4-hydrogen',
      contents: conversationPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'Helpful concise response in the requested/detected language and slang modulation.',
            },
            detectedLanguage: {
              type: Type.STRING,
              description: 'Language used in the reply (e.g. English, Arabic, Hindi).',
            },
            navigateToPath: {
              type: Type.STRING,
              description: 'Exact Vanhsya route to navigate to immediately if requested, else empty string.',
            },
            suggestedLinks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  path: { type: Type.STRING },
                },
              },
              description: 'Up to 3 relevant Vanhsya page paths.',
            },
          },
        },
      },
    });

    const parsed = safeParseModelJson(response.text, {
      reply: response.text || 'How can I help you explore Vanhsya today?',
      detectedLanguage: targetLang,
      navigateToPath: '',
      suggestedLinks: [] as Array<{ label: string; path: string }>,
    });

    return res.json({
      reply: parsed.reply || 'How can I help you explore Vanhsya today?',
      detectedLanguage: parsed.detectedLanguage || targetLang,
      navigateToPath: typeof parsed.navigateToPath === 'string' ? parsed.navigateToPath.trim() : '',
      suggestedLinks: Array.isArray(parsed.suggestedLinks) ? parsed.suggestedLinks.slice(0, 3) : [],
    });
  } catch (error: any) {
    console.error('Vanhsya X concierge error:', error);
    return res.status(500).json({ error: error?.message || 'Concierge request failed.' });
  }
});

app.post('/api/gemini/translate', async (req, res) => {
  try {
    const text = cleanMultilineText(req.body.text, 2500);
    const sourceLang = cleanText(req.body.sourceLang || 'Auto-Detect', 60);
    const targetLang = cleanText(req.body.targetLang || 'Arabic', 60);
    const slangStyle = cleanText(req.body.slangStyle || 'standard', 40);
    const voiceStyle = cleanText(req.body.voiceStyle || 'natural', 40);
    const customStyle = cleanText(req.body.customStyle || '', 140);

    if (!text) {
      return res.status(400).json({ error: 'Enter text to translate.' });
    }

    const modulation = buildModulationGuidance({
      lang: targetLang,
      voiceStyle,
      slangStyle,
      customStyle,
    });

    const prompt = `
Translate the following text from ${sourceLang} into ${targetLang}.

${modulation}

Text to translate (may contain regional idioms, mixed script, Romanized text, or casual slang):
"""
${text}
"""

Requirements:
- Preserve exact travel dates, prices, phone numbers (+971 50 623 0702), emails (info@vanhsya.com / support@vanhsya.com), and Vanhsya brand names accurately.
- Apply the requested dialect/slang modulation naturally so it sounds genuinely native to a speaker of ${targetLang}.
- Provide a clean phonetic transliteration/pronunciation guide if the target language uses a non-Latin script (or helpful syllable cadence for learners).
- Include one brief cultural or local slang nuance tip.
`;

    const response = await generateContentWithFallback({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translatedText: { type: Type.STRING },
            detectedSourceLanguage: { type: Type.STRING },
            phoneticGuide: { type: Type.STRING },
            culturalNuanceTip: { type: Type.STRING },
          },
        },
      },
    });

    const parsed = safeParseModelJson(response.text, {
      translatedText: response.text || '',
      detectedSourceLanguage: sourceLang,
      phoneticGuide: '',
      culturalNuanceTip: '',
    });

    return res.json({
      translatedText: parsed.translatedText || '',
      detectedSourceLanguage: parsed.detectedSourceLanguage || sourceLang,
      phoneticGuide: parsed.phoneticGuide || '',
      culturalNuanceTip: parsed.culturalNuanceTip || '',
    });
  } catch (error: any) {
    console.error('Translation error:', error);
    return res.status(500).json({ error: error?.message || 'Translation failed.' });
  }
});

// Resilient Turn-Based Spoken Audio Translator (Transcribes ANY language/slang -> Translates -> Synthesizes Speech)
app.post('/api/gemini/voice-translate', publicWriteLimiter, async (req, res) => {
  try {
    const audioBase64 = typeof req.body.audioBase64 === 'string' ? req.body.audioBase64.trim() : '';
    const mimeType = cleanText(req.body.mimeType || 'audio/webm', 80);
    const targetLang = cleanText(req.body.targetLang || 'Arabic', 60);
    const slangStyle = cleanText(req.body.slangStyle || 'standard', 40);
    const voiceStyle = cleanText(req.body.voiceStyle || 'natural', 40);
    const customStyle = cleanText(req.body.customStyle || '', 140);
    const voiceName = ALLOWED_LIVE_VOICES.has(req.body.voiceName) ? req.body.voiceName : 'Zephyr';

    if (!audioBase64 || audioBase64.length < 32) {
      return res.status(400).json({ error: 'No recorded audio payload received.' });
    }

    // Step 1: Accurate speech transcription using gemini-3.5-transcribe
    const transcribeRes = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: audioBase64, mimeType } },
            { text: 'Transcribe this speech verbatim in its original language and slang/dialect. Return only the spoken words.' },
          ],
        },
      ],
    });
    const transcript = cleanMultilineText(transcribeRes.text || '', 1500);
    if (!transcript) {
      return res.status(422).json({ error: 'Could not detect clear speech. Please hold and speak closer to the mic.' });
    }

    // Step 2: Translate with slang & dialect adaptation using gemini-4-hydrogen
    const modulation = buildModulationGuidance({
      lang: targetLang,
      voiceStyle,
      slangStyle,
      customStyle,
    });
    const translateRes = await generateContentWithFallback({
      model: 'gemini-4-hydrogen',
      contents: `Translate this spoken phrase into ${targetLang}.\n${modulation}\n\nSpoken phrase: """${transcript}"""`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translatedText: { type: Type.STRING },
            detectedSourceLanguage: { type: Type.STRING },
            phoneticGuide: { type: Type.STRING },
            culturalNuanceTip: { type: Type.STRING },
          },
        },
      },
    });
    const parsed = safeParseModelJson(translateRes.text, {
      translatedText: translateRes.text || transcript,
      detectedSourceLanguage: 'Auto-Detected',
      phoneticGuide: '',
      culturalNuanceTip: '',
    });

    // Step 3: Synthesize natural speech via gemini-3.8-flash-lite-tts (best-effort)
    let replyAudio: string | null = null;
    try {
      const ttsRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [{ parts: [{ text: parsed.translatedText || transcript }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
        },
      });
      replyAudio = ttsRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (ttsErr) {
      console.warn('Voice translate TTS skipped:', ttsErr);
    }

    return res.json({
      sourceTranscript: transcript,
      translatedText: parsed.translatedText || transcript,
      detectedSourceLanguage: parsed.detectedSourceLanguage || 'Auto-Detected',
      phoneticGuide: parsed.phoneticGuide || '',
      culturalNuanceTip: parsed.culturalNuanceTip || '',
      audio: replyAudio,
    });
  } catch (error: any) {
    console.error('Voice translate pipeline error:', error);
    return res.status(500).json({ error: error?.message || 'Voice translation failed.' });
  }
});

// --- WebSocket Live API Bridge (Vanhsya Travels X Concierge & Live Speech Translator) ---

const wss = new WebSocketServer({ server, path: '/live' });

const ALLOWED_LIVE_VOICES = new Set(['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr']);

const LIVE_TRANSLATE_CODE_MAP: Record<string, string> = {
  tl: 'fil',
  fil: 'fil',
  en: 'en',
  ar: 'ar',
  hi: 'hi',
  ur: 'ur',
  es: 'es',
  fr: 'fr',
  ru: 'ru',
  zh: 'zh',
  ja: 'ja',
  ko: 'ko',
  de: 'de',
  it: 'it',
  pt: 'pt',
  tr: 'tr',
  ml: 'ml',
  ta: 'ta',
};

wss.on('connection', async (clientWs, req) => {
  let session: any = null;

  try {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const mode = url.searchParams.get('mode') === 'translate' ? 'translate' : 'concierge';
    const rawVoice = url.searchParams.get('voice') || 'Zephyr';
    const voice = ALLOWED_LIVE_VOICES.has(rawVoice) ? rawVoice : 'Zephyr';
    const lang = cleanText(url.searchParams.get('lang') || 'auto', 60);
    const targetCodeRaw = cleanText(url.searchParams.get('targetCode') || 'ar', 24).toLowerCase();
    const targetLabel = cleanText(url.searchParams.get('targetLabel') || '', 60);
    const voiceStyle = cleanText(url.searchParams.get('style') || 'natural', 40);
    const slangStyle = cleanText(url.searchParams.get('slang') || 'standard', 40);
    const customStyle = cleanText(url.searchParams.get('customStyle') || '', 140);

    const mappedBcp47 = LIVE_TRANSLATE_CODE_MAP[targetCodeRaw];
    const requiresFlexibleLiveInterpreter =
      mode === 'translate' &&
      (Boolean(targetLabel) || !mappedBcp47 || slangStyle !== 'standard' || Boolean(customStyle));

    const connectLiveConciergeOrInterpreter = async (asTranslatorOnly: boolean) => {
      const navigateToTool = {
        name: 'navigateTo',
        description:
          'Navigates the user browser directly to a specific Vanhsya Global Travels or Social Club page or tour.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            path: {
              type: Type.STRING,
              description:
                'Valid platform path, e.g. "/", "/book", "/ventures", "/treasure-hunt", "/meetups", "/social-club", "/ai-planner", "/vr-experience", "/vyno", "/community", "/partners/apply", "/blogs", "/dashboard", "/legal", "/whitepaper", or "/tours/<slug>".',
            },
          },
          required: ['path'],
        },
      };

      const targetLanguageForPrompt = targetLabel || mappedBcp47 || targetCodeRaw || 'English';
      const modulationGuidance = buildModulationGuidance({
        lang: asTranslatorOnly ? targetLanguageForPrompt : lang,
        voiceStyle,
        slangStyle,
        customStyle,
      });

      const systemInstruction = asTranslatorOnly
        ? `
You are a simultaneous spoken-language interpreter inside "Vanhsya Travels X".
${modulationGuidance}

STRICT INTERPRETER RULES:
1. Listen to the speaker in ANY human language or regional street slang (including Arabic dialects, Hinglish, Taglish, Patois, Pidgin, Russian, Japanese, Mandarin, European, or Indian languages).
2. Immediately speak ONLY the accurate natural translation into "${targetLanguageForPrompt}", faithfully reflecting the requested slang/dialect modulation and voice cadence.
3. Do NOT add commentary, greetings, or explanations—output only the translated speech.
`
        : `
IDENTITY: You are "Vanhsya Travels X", the live multilingual voice concierge, travel architect guide, and translator for Vanhsya Global Travels (www.vanhsya.com) and Vanhsya Social Club UAE.

${VANHSYA_PLATFORM_KNOWLEDGE}

${modulationGuidance}

BEHAVIOR:
1. Greet briefly and speak warmly with natural charisma—never robotic—strictly following the active language, cadence, and slang/dialect modulation settings.
2. Keep spoken replies concise (2 to 3 crisp sentences) so conversation feels effortless, unless the user asks for full tour details or a translation.
3. If the user speaks in another language or asks you to translate phrases into any language or regional slang, translate smoothly right away.
4. Use the "navigateTo" tool whenever the user wants to open, go to, book, invest, or explore any Vanhsya page or tour.
`;

      return await liveAi.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          ...(asTranslatorOnly ? {} : { tools: [{ functionDeclarations: [navigateToTool as any] }] }),
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
          systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            if (clientWs.readyState === clientWs.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'connected',
                  status: 'LIVE',
                  mode: asTranslatorOnly ? 'translate' : 'concierge',
                })
              );
            }
          },
          onmessage: (message: any) => {
            if (clientWs.readyState !== clientWs.OPEN) return;

            if (message.toolCall) {
              clientWs.send(JSON.stringify({ type: 'toolCall', toolCall: message.toolCall }));
            }
            if (message.serverContent?.inputTranscription?.text) {
              clientWs.send(
                JSON.stringify({
                  type: 'inputTranscript',
                  inputTranscript: message.serverContent.inputTranscription.text,
                })
              );
            }
            if (message.serverContent?.outputTranscription?.text) {
              clientWs.send(
                JSON.stringify({
                  type: 'transcription',
                  transcription: message.serverContent.outputTranscription.text,
                })
              );
            }
            if (message.serverContent?.turnComplete) {
              clientWs.send(JSON.stringify({ type: 'turnComplete' }));
            }
            for (const part of message.serverContent?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({ type: 'audio', audio: part.inlineData.data }));
              }
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ type: 'interrupted' }));
            }
          },
          onerror: (err: any) => {
            console.error('Gemini Live session error:', err);
            if (clientWs.readyState === clientWs.OPEN) {
              clientWs.send(JSON.stringify({ type: 'error', error: err?.message || 'Live session error' }));
            }
          },
          onclose: () => {
            if (clientWs.readyState === clientWs.OPEN) {
              clientWs.send(JSON.stringify({ type: 'closed' }));
            }
          },
        },
      });
    };

    if (mode === 'translate' && !requiresFlexibleLiveInterpreter && mappedBcp47) {
      // Dedicated low-latency speech-to-speech interpreter pipeline (no systemInstruction/tools permitted);
      // falls back seamlessly to gemini-3.8-live if setup returns an error/404.
      try {
        session = await liveAi.live.connect({
          model: 'gemini-3.5-live-translate-preview',
          config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            translationConfig: {
              targetLanguageCode: mappedBcp47,
              echoTargetLanguage: false,
            } as any,
          },
          callbacks: {
            onopen: () => {
              if (clientWs.readyState === clientWs.OPEN) {
                clientWs.send(JSON.stringify({ type: 'connected', status: 'LIVE', mode: 'translate' }));
              }
            },
            onmessage: (message: any) => {
              if (clientWs.readyState !== clientWs.OPEN) return;
              const content = message.serverContent;
              if (content?.inputTranscription?.text) {
                clientWs.send(
                  JSON.stringify({
                    type: 'inputTranscript',
                    inputTranscript: content.inputTranscription.text,
                  })
                );
              }
              if (content?.outputTranscription?.text) {
                clientWs.send(
                  JSON.stringify({
                    type: 'transcription',
                    transcription: content.outputTranscription.text,
                  })
                );
              }
              if (content?.turnComplete) {
                clientWs.send(JSON.stringify({ type: 'turnComplete' }));
              }
              for (const part of content?.modelTurn?.parts ?? []) {
                if (part.inlineData?.data) {
                  clientWs.send(JSON.stringify({ type: 'audio', audio: part.inlineData.data }));
                }
              }
              if (content?.interrupted) {
                clientWs.send(JSON.stringify({ type: 'interrupted' }));
              }
            },
            onerror: (err: any) => {
              console.error('Gemini Live Translate error:', err);
              if (clientWs.readyState === clientWs.OPEN) {
                clientWs.send(JSON.stringify({ type: 'error', error: err?.message || 'Live translation error' }));
              }
            },
            onclose: () => {
              if (clientWs.readyState === clientWs.OPEN) {
                clientWs.send(JSON.stringify({ type: 'closed' }));
              }
            },
          },
        });
      } catch (translateModelErr) {
        console.warn('gemini-3.5-live-translate-preview unavailable; using gemini-3.8-live interpreter:', translateModelErr);
        session = await connectLiveConciergeOrInterpreter(true);
      }
    } else {
      session = await connectLiveConciergeOrInterpreter(mode === 'translate');
    }

    clientWs.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.audio && session) {
          session.sendRealtimeInput({
            audio: { data: data.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (data.text && session && mode === 'concierge') {
          session.sendRealtimeInput({ text: String(data.text) });
        } else if (data.toolResponse && session && mode === 'concierge') {
          const normalized = Array.isArray(data.toolResponse.functionResponses)
            ? data.toolResponse
            : { functionResponses: [data.toolResponse.functionResponses] };
          session.sendToolResponse(normalized);
        }
      } catch (e) {
        console.error('Error handling incoming client message:', e);
      }
    });

    clientWs.on('close', () => {
      if (session) {
        try {
          session.close();
        } catch {}
        session = null;
      }
    });
  } catch (err: any) {
    console.error('Failed to initialize Gemini Live session:', err);
    if (clientWs.readyState === clientWs.OPEN) {
      clientWs.send(JSON.stringify({ type: 'error', error: err.message || 'Failed to connect Live API' }));
      clientWs.close();
    }
  }
});

// --- Frontend Mounting (Vite in dev, static files in prod) ---

const isProd =
  process.env.NODE_ENV === 'production' ||
  Boolean(process.env.K_SERVICE) ||
  process.env.npm_lifecycle_event === 'start';

if (!isProd) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distDir = path.resolve(__dirname, 'dist');
  app.use(express.static(distDir));
  app.use((_req, res) => {
    res.sendFile(path.resolve(distDir, 'index.html'));
  });
}

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT} (mode: ${isProd ? 'production' : 'development'})`);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal, closing server gracefully');
  server.close(() => {
    process.exit(0);
  });
});
