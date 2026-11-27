import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SeoHead from '../components/SeoHead';
import { EventRsvp, SocialEvent } from '../types';
import {
  BRAND_CONTACTS,
  UAE_EMIRATES,
  buildHashShareUrl,
  buildWhatsAppDirectEnquiryUrl,
  buildWhatsAppShareUrl,
  captureUtmParams,
} from '../utils/utm';
import {
  generateEventPromoCardDataUrl,
  generateQrDataUrl,
  triggerDataUrlDownload,
} from '../utils/cardGenerator';

const MeetupDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<SocialEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState<string | null>(null);

  // RSVP Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('+971 ');
  const [emirate, setEmirate] = useState('Dubai');
  const [ageConfirmed18Plus, setAgeConfirmed18Plus] = useState(false);
  const [consentEmail, setConsentEmail] = useState(true);
  const [consentWhatsapp, setConsentWhatsapp] = useState(true);
  const [consentCancellationTerms, setConsentCancellationTerms] = useState(false);

  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [confirmedRsvp, setConfirmedRsvp] = useState<EventRsvp | null>(null);
  const [issuedMembershipId, setIssuedMembershipId] = useState<string | null>(null);

  // Promotional Kit State
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [rsvpQrDataUrl, setRsvpQrDataUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatingCard, setGeneratingCard] = useState<string | null>(null);

  // Post-Event Survey Quick State (when event status === 'completed')
  const [surveyName, setSurveyName] = useState('');
  const [surveyEmail, setSurveyEmail] = useState('');
  const [surveyRsvpCode, setSurveyRsvpCode] = useState('');
  const [overallRating, setOverallRating] = useState(5);
  const [venueRating, setVenueRating] = useState(5);
  const [safetyRating, setSafetyRating] = useState(5);
  const [wouldAttendAgain, setWouldAttendAgain] = useState(true);
  const [highlights, setHighlights] = useState('');
  const [improvements, setImprovements] = useState('');
  const [consentPublish, setConsentPublish] = useState(false);
  const [surveySubmitting, setSurveySubmitting] = useState(false);
  const [surveyDone, setSurveyDone] = useState(false);
  const [surveyError, setSurveyError] = useState<string | null>(null);

  const utm = captureUtmParams();

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true);
    fetch(`/api/events/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Event not found');
        if (active) setEvent(data.event);
      })
      .catch((err) => {
        if (active) setNotFoundError(err.message || 'Verified meetup not found');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const canonicalEventShareUrl = useMemo(() => {
    if (!event) return '';
    return buildHashShareUrl(`/meetups/${event.slug}`, {
      source: 'event-share',
      medium: 'direct-link',
      campaign: event.slug,
    });
  }, [event]);

  const flyerQrUrl = useMemo(() => {
    if (!event) return '';
    return buildHashShareUrl(`/meetups/${event.slug}`, {
      source: 'printed-flyer',
      medium: 'qr',
      campaign: event.slug,
    });
  }, [event]);

  const instagramStoryShareUrl = useMemo(() => {
    if (!event) return '';
    return buildHashShareUrl(`/meetups/${event.slug}`, {
      source: 'instagram',
      medium: 'promo-card',
      campaign: event.slug,
    });
  }, [event]);

  useEffect(() => {
    if (!flyerQrUrl) return;
    generateQrDataUrl(flyerQrUrl).then(setQrDataUrl).catch(() => {});
  }, [flyerQrUrl]);

  useEffect(() => {
    if (!confirmedRsvp) return;
    generateQrDataUrl(`VANHSYA-CHECKIN:${confirmedRsvp.rsvpCode}`).then(setRsvpQrDataUrl).catch(() => {});
  }, [confirmedRsvp]);

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setRsvpError(null);
    setRsvpSubmitting(true);

    try {
      const response = await fetch(`/api/events/${encodeURIComponent(event.slug)}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          whatsappNumber,
          emirate,
          ageConfirmed18Plus,
          consentEmail,
          consentWhatsapp,
          consentCancellationTerms,
          ...utm,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setRsvpError(data.error || 'Could not confirm RSVP.');
      } else {
        setConfirmedRsvp(data.rsvp);
        if (data.membershipId) setIssuedMembershipId(data.membershipId);
        if (data.event) setEvent(data.event);
      }
    } catch {
      setRsvpError('Network error while submitting RSVP. Please try again.');
    } finally {
      setRsvpSubmitting(false);
    }
  };

  const handleDownloadCard = async (format: 'invitation' | 'instagram-feed' | 'instagram-story') => {
    if (!event) return;
    setGeneratingCard(format);
    try {
      const targetUrl = format === 'invitation' ? flyerQrUrl : instagramStoryShareUrl;
      const dataUrl = await generateEventPromoCardDataUrl(event, targetUrl, format);
      triggerDataUrlDownload(dataUrl, `${event.slug}-${format}.png`);
    } finally {
      setGeneratingCard(null);
    }
  };

  const handleCopyShareLink = () => {
    if (!canonicalEventShareUrl) return;
    navigator.clipboard.writeText(canonicalEventShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSurveySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setSurveyError(null);
    setSurveySubmitting(true);

    try {
      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          eventTitle: event.title,
          rsvpCode: surveyRsvpCode,
          respondentName: surveyName,
          email: surveyEmail,
          overallRating,
          venueRating,
          safetyWelcomeRating: safetyRating,
          wouldAttendAgain,
          highlights,
          improvements,
          consentPublish,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setSurveyError(data.error || 'Could not submit survey.');
      } else {
        setSurveyDone(true);
      }
    } catch {
      setSurveyError('Connection error while saving feedback.');
    } finally {
      setSurveySubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-32 pb-20 min-h-screen bg-[#0A0812] text-center text-gray-300">
        Loading verified meetup details...
      </div>
    );
  }

  if (notFoundError || !event) {
    return (
      <div className="pt-32 pb-20 min-h-screen bg-[#0A0812] px-4 text-center">
        <div className="max-w-lg mx-auto p-8 rounded-2xl bg-[#130E20] border border-purple-500/30 space-y-4">
          <h1 className="text-2xl font-cinzel font-bold text-white">Event Not Available</h1>
          <p className="text-sm text-gray-400">
            {notFoundError || 'This meetup may still be in draft review or does not exist.'}
          </p>
          <Link
            to="/meetups"
            className="inline-block px-6 py-3 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-500"
          >
            Browse Verified MeetUps
          </Link>
        </div>
      </div>
    );
  }

  const attendees = event.attendeesCount || 0;
  const spotsLeft = Math.max(0, event.capacity - attendees);
  const progress = event.capacity > 0 ? Math.min(100, (attendees / event.capacity) * 100) : 0;

  const whatsappShareHref = buildWhatsAppShareUrl(
    `You're invited to ${event.title} (${event.city}, ${event.emirate})!\n` +
      `${BRAND_CONTACTS.campaignTitle} — ${BRAND_CONTACTS.tagline}\n\n` +
      `Date: ${event.eventDate} at ${event.startTime}\n` +
      `Venue: ${event.venueName}\n` +
      `RSVP here: ${buildHashShareUrl(`/meetups/${event.slug}`, { source: 'whatsapp', medium: 'share', campaign: event.slug })}\n\n` +
      `Instagram: ${BRAND_CONTACTS.instagramHandle}`
  );

  return (
    <div className="pt-24 pb-20 bg-[#0A0812] min-h-screen text-gray-100">
      <SeoHead
        title={`${event.title} — Vanhsya Social Club (${event.emirate})`}
        description={`${event.subtitle || event.description.slice(0, 150)} · ${event.eventDate} in ${event.city}, UAE.`}
        path={`/meetups/${event.slug}`}
        image={event.coverImageUrl || undefined}
        type="event"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'SocialEvent',
          name: event.title,
          description: event.description,
          startDate: event.eventDate,
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          location: {
            '@type': 'Place',
            name: event.venueName,
            address: {
              '@type': 'PostalAddress',
              addressLocality: event.city,
              addressRegion: event.emirate,
              addressCountry: 'AE',
            },
          },
          organizer: {
            '@type': 'Organization',
            name: BRAND_CONTACTS.clubName,
            url: BRAND_CONTACTS.websiteUrl,
          },
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="mb-6">
          <Link to="/meetups" className="text-xs font-semibold text-purple-300 hover:text-white">
            &larr; Back to Verified MeetUps
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Event Details & Promotional Kit */}
          <div className="lg:col-span-7 space-y-8">
            <div className="rounded-3xl overflow-hidden border border-purple-500/25 bg-[#130E20] shadow-2xl">
              {event.coverImageUrl ? (
                <div className="relative h-64 sm:h-80 overflow-hidden">
                  <img
                    src={event.coverImageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#130E20] via-transparent to-black/20" />
                </div>
              ) : null}

              <div className="p-6 sm:p-8 space-y-5">
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                  <span className="px-2.5 py-1 rounded-md bg-purple-600/25 border border-purple-400/40 text-purple-200 uppercase">
                    {event.status.replace('_', ' ')}
                  </span>
                  <span className="text-purple-300">
                    {event.category} · {event.ageRestriction}
                  </span>
                </div>

                <div>
                  <h1 className="text-3xl sm:text-4xl font-black font-cinzel text-white leading-tight">
                    {event.title}
                  </h1>
                  {event.subtitle && (
                    <p className="text-base text-purple-200 mt-2 font-light">{event.subtitle}</p>
                  )}
                </div>

                {event.status === 'cancelled' && event.cancellationReason && (
                  <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200">
                    <strong>Cancellation Notice:</strong> {event.cancellationReason}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-black/35 border border-white/10">
                    <p className="text-[11px] uppercase tracking-wider text-purple-300 font-semibold">Date & Time</p>
                    <p className="text-sm font-bold text-white mt-1">
                      {event.eventDate} · {event.startTime}
                      {event.endTime ? ` – ${event.endTime}` : ''}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-black/35 border border-white/10">
                    <p className="text-[11px] uppercase tracking-wider text-purple-300 font-semibold">Location & Venue</p>
                    <p className="text-sm font-bold text-white mt-1">
                      {event.venueName} · {event.city}, {event.emirate}
                    </p>
                    {event.venueAddress && <p className="text-xs text-gray-400 mt-0.5">{event.venueAddress}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-purple-300">
                    About This Gathering
                  </h2>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                    {event.description}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-2">
                  <div className="flex justify-between text-xs text-gray-300">
                    <span>Verified Capacity</span>
                    <span className="font-semibold text-purple-300">
                      {attendees} / {event.capacity} Confirmed ({spotsLeft} left)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-violet-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs text-gray-300">
                  <div className="p-4 rounded-xl bg-black/30 border border-white/10">
                    <h3 className="font-bold text-white mb-1">Safety & Host Guidelines</h3>
                    <p className="leading-relaxed text-gray-400">{event.guidelinesSummary}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-black/30 border border-white/10">
                    <h3 className="font-bold text-white mb-1">Cancellation Policy</h3>
                    <p className="leading-relaxed text-gray-400">{event.cancellationPolicy}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Share, Flyers, Dynamic QR & Instagram Promo Kit */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#130E20] border border-purple-500/25 space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300">
                  Invitations & Promotional Assets
                </p>
                <h2 className="text-2xl font-cinzel font-bold text-white mt-1">
                  Share Link, Flyer QR & Instagram Cards
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  All assets include campaign attribution, event details, {BRAND_CONTACTS.websiteDisplay}, and {BRAND_CONTACTS.instagramHandle}.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                <div className="sm:col-span-4 flex flex-col items-center p-4 rounded-2xl bg-white text-black">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt={`Flyer QR for ${event.title}`} className="w-36 h-36" />
                  ) : (
                    <div className="w-36 h-36 flex items-center justify-center text-xs text-gray-500">Generating QR</div>
                  )}
                  <span className="text-[11px] font-bold uppercase tracking-wider mt-2 text-center">
                    Printed Flyer QR
                  </span>
                </div>

                <div className="sm:col-span-8 space-y-3">
                  <div className="p-3 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-purple-200 break-all">
                    {canonicalEventShareUrl}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      onClick={handleCopyShareLink}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                    >
                      {copiedLink ? 'Share Link Copied' : 'Copy Unique Share Link'}
                    </button>

                    <a
                      href={whatsappShareHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold text-center transition-colors"
                    >
                      Share via WhatsApp
                    </a>

                    {qrDataUrl && (
                      <button
                        onClick={() => triggerDataUrlDownload(qrDataUrl, `${event.slug}-flyer-qr.png`)}
                        className="px-4 py-2.5 rounded-xl bg-purple-600/25 border border-purple-400/40 hover:bg-purple-600/40 text-purple-100 text-xs font-semibold transition-colors"
                      >
                        Download Print Flyer QR
                      </button>
                    )}

                    <button
                      onClick={() => handleDownloadCard('invitation')}
                      disabled={Boolean(generatingCard)}
                      className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {generatingCard === 'invitation' ? 'Rendering Card...' : 'Download Digital Invitation'}
                    </button>

                    <button
                      onClick={() => handleDownloadCard('instagram-feed')}
                      disabled={Boolean(generatingCard)}
                      className="px-4 py-2.5 rounded-xl bg-fuchsia-700/40 border border-fuchsia-400/40 hover:bg-fuchsia-700/60 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {generatingCard === 'instagram-feed' ? 'Rendering 4:5...' : 'Instagram 4:5 Promo Card'}
                    </button>

                    <button
                      onClick={() => handleDownloadCard('instagram-story')}
                      disabled={Boolean(generatingCard)}
                      className="px-4 py-2.5 rounded-xl bg-fuchsia-700/40 border border-fuchsia-400/40 hover:bg-fuchsia-700/60 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {generatingCard === 'instagram-story' ? 'Rendering 9:16...' : 'Instagram 9:16 Story Card'}
                    </button>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-gray-300">
                    <a
                      href={buildWhatsAppDirectEnquiryUrl(`Hello Vanhsya Team, I have an enquiry about "${event.title}" (${event.city}, ${event.emirate}).`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-300 hover:text-emerald-200 underline font-semibold"
                    >
                      Direct Concierge WhatsApp: {BRAND_CONTACTS.whatsappDisplay}
                    </a>
                    <span className="text-gray-600">&bull;</span>
                    <a
                      href={BRAND_CONTACTS.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-300 hover:text-white underline"
                    >
                      {BRAND_CONTACTS.instagramHandle}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: RSVP / Capacity Card + Post-Event Survey */}
          <div className="lg:col-span-5 space-y-6">
            {confirmedRsvp ? (
              <div className="p-6 sm:p-8 rounded-3xl bg-[#140F22] border border-emerald-400/40 shadow-2xl space-y-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                    Seat Confirmed
                  </span>
                  <h2 className="text-2xl font-cinzel font-bold text-white mt-1">
                    See You There, {confirmedRsvp.fullName}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Present this RSVP pass at venue check-in.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white text-black flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-gray-600 font-bold">
                      RSVP Pass Code
                    </p>
                    <p className="text-2xl font-black font-mono text-[#160B2B]">
                      {confirmedRsvp.rsvpCode}
                    </p>
                    {issuedMembershipId && (
                      <p className="text-xs text-purple-800 font-mono mt-1">
                        Member ID: {issuedMembershipId}
                      </p>
                    )}
                  </div>
                  {rsvpQrDataUrl && (
                    <img src={rsvpQrDataUrl} alt="RSVP Check-in QR" className="w-24 h-24 shrink-0" />
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleDownloadCard('invitation')}
                    className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                  >
                    Download Event Invitation
                  </button>
                  <a
                    href={whatsappShareHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold text-center"
                  >
                    Share on WhatsApp
                  </a>
                </div>
              </div>
            ) : event.status === 'upcoming' && spotsLeft > 0 ? (
              <form
                onSubmit={handleRsvpSubmit}
                className="p-6 sm:p-8 rounded-3xl bg-[#130E20] border border-purple-500/35 shadow-2xl space-y-4"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-purple-300">
                    RSVP Confirmation · {spotsLeft} Seats Left
                  </p>
                  <h2 className="text-2xl font-cinzel font-bold text-white mt-1">
                    Reserve Your Seat
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    {event.priceAed && event.priceAed > 0
                      ? `Entry: AED ${event.priceAed} · Includes curated host introduction`
                      : 'Complimentary verified community RSVP'}
                  </p>
                </div>

                {rsvpError && (
                  <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-200">
                    {rsvpError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+971 50 000 0000"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Emirate *</label>
                  <select
                    value={emirate}
                    onChange={(e) => setEmirate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0B0814] border border-white/15 text-sm text-white focus:outline-none focus:border-purple-400"
                  >
                    {UAE_EMIRATES.map((em) => (
                      <option key={em} value={em}>
                        {em}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs text-gray-300">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ageConfirmed18Plus}
                      onChange={(e) => setAgeConfirmed18Plus(e.target.checked)}
                      required
                      className="mt-0.5 accent-purple-500"
                    />
                    <span>I confirm I am a UAE resident aged 18 or older. *</span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentEmail}
                      onChange={(e) => setConsentEmail(e.target.checked)}
                      className="mt-0.5 accent-purple-500"
                    />
                    <span>Send my confirmation & venue details via Email (opt-in).</span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentWhatsapp}
                      onChange={(e) => setConsentWhatsapp(e.target.checked)}
                      className="mt-0.5 accent-purple-500"
                    />
                    <span>Send event arrival reminders via WhatsApp (opt-in).</span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentCancellationTerms}
                      onChange={(e) => setConsentCancellationTerms(e.target.checked)}
                      required
                      className="mt-0.5 accent-purple-500"
                    />
                    <span>
                      I agree to the{' '}
                      <Link to="/legal" className="text-purple-300 underline">
                        Guidelines & Cancellation Terms
                      </Link>
                      . *
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={rsvpSubmitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-500 hover:from-purple-500 hover:to-violet-400 text-white font-bold text-sm uppercase tracking-wider disabled:opacity-50"
                >
                  {rsvpSubmitting ? 'Confirming Seat...' : 'Confirm RSVP'}
                </button>
              </form>
            ) : (
              <div className="p-6 sm:p-8 rounded-3xl bg-[#130E20] border border-white/15 space-y-3">
                <h2 className="text-xl font-cinzel font-bold text-white">
                  {event.status === 'sold_out' || spotsLeft <= 0
                    ? 'Event Sold Out'
                    : event.status === 'cancelled'
                    ? 'Event Cancelled'
                    : 'Event Completed'}
                </h2>
                <p className="text-sm text-gray-400">
                  {event.status === 'completed'
                    ? 'This meetup has concluded. If you attended, please share your feedback below.'
                    : 'RSVPs are currently closed for this date. Join the Vanhsya Social Club directory for future releases.'}
                </p>
                <Link
                  to="/social-club"
                  className="inline-block px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500"
                >
                  Get Notified About Next Events
                </Link>
              </div>
            )}

            {/* Post-Event Survey Card */}
            {event.status === 'completed' && (
              <div className="p-6 sm:p-8 rounded-3xl bg-[#130E20] border border-purple-500/25 space-y-4">
                <h2 className="text-xl font-cinzel font-bold text-white">
                  Post-Event Survey
                </h2>
                {surveyDone ? (
                  <p className="text-sm text-emerald-300">
                    Thank you! Your survey response has been saved for Vanhsya Social Club organizers.
                  </p>
                ) : (
                  <form onSubmit={handleSurveySubmit} className="space-y-3 text-xs">
                    {surveyError && (
                      <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-200">
                        {surveyError}
                      </div>
                    )}
                    <input
                      type="text"
                      required
                      value={surveyName}
                      onChange={(e) => setSurveyName(e.target.value)}
                      placeholder="Your name *"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white"
                    />
                    <input
                      type="email"
                      required
                      value={surveyEmail}
                      onChange={(e) => setSurveyEmail(e.target.value)}
                      placeholder="Email *"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white"
                    />
                    <input
                      type="text"
                      value={surveyRsvpCode}
                      onChange={(e) => setSurveyRsvpCode(e.target.value)}
                      placeholder="RSVP Code (optional)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <label className="text-gray-300">
                        Overall (1-5)
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={overallRating}
                          onChange={(e) => setOverallRating(Number(e.target.value))}
                          className="mt-1 w-full px-2.5 py-2 rounded-lg bg-black/50 border border-white/15 text-white"
                        />
                      </label>
                      <label className="text-gray-300">
                        Venue (1-5)
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={venueRating}
                          onChange={(e) => setVenueRating(Number(e.target.value))}
                          className="mt-1 w-full px-2.5 py-2 rounded-lg bg-black/50 border border-white/15 text-white"
                        />
                      </label>
                      <label className="text-gray-300">
                        Safety (1-5)
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={safetyRating}
                          onChange={(e) => setSafetyRating(Number(e.target.value))}
                          className="mt-1 w-full px-2.5 py-2 rounded-lg bg-black/50 border border-white/15 text-white"
                        />
                      </label>
                    </div>
                    <textarea
                      required
                      rows={3}
                      value={highlights}
                      onChange={(e) => setHighlights(e.target.value)}
                      placeholder="What stood out about the meetup? *"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white"
                    />
                    <textarea
                      rows={2}
                      value={improvements}
                      onChange={(e) => setImprovements(e.target.value)}
                      placeholder="What can we improve for future events?"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white"
                    />
                    <label className="flex items-center gap-2 text-gray-300">
                      <input
                        type="checkbox"
                        checked={wouldAttendAgain}
                        onChange={(e) => setWouldAttendAgain(e.target.checked)}
                        className="accent-purple-500"
                      />
                      <span>I would attend another Vanhsya Social Club meetup</span>
                    </label>
                    <label className="flex items-center gap-2 text-gray-300">
                      <input
                        type="checkbox"
                        checked={consentPublish}
                        onChange={(e) => setConsentPublish(e.target.checked)}
                        className="accent-purple-500"
                      />
                      <span>Consent to display my feedback publicly</span>
                    </label>
                    <button
                      type="submit"
                      disabled={surveySubmitting}
                      className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                    >
                      {surveySubmitting ? 'Saving...' : 'Submit Survey'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetupDetailPage;
