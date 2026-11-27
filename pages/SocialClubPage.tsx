import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SeoHead from '../components/SeoHead';
import MeetupCard from '../components/MeetupCard';
import { SocialEvent, SocialMember } from '../types';
import {
  BRAND_CONTACTS,
  UAE_EMIRATES,
  buildHashShareUrl,
  buildWhatsAppDirectEnquiryUrl,
  buildWhatsAppShareUrl,
  captureUtmParams,
} from '../utils/utm';
import {
  generateFoundingMemberPassDataUrl,
  generateQrDataUrl,
  triggerDataUrlDownload,
} from '../utils/cardGenerator';

const INTEREST_OPTIONS = [
  'Coffee & Conversations',
  'Desert Stargazing',
  'Art & Museums',
  'Supper Clubs',
  'Hiking & Wadis',
  'Padel & Wellness',
  'Cultural Heritage',
  'Book & Film Circles',
];

const SocialClubPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('+971 ');
  const [emirate, setEmirate] = useState<string>('Dubai');
  const [interests, setInterests] = useState<string[]>(['Coffee & Conversations', 'Cultural Heritage']);
  const [ageConfirmed18Plus, setAgeConfirmed18Plus] = useState(false);
  const [consentEmail, setConsentEmail] = useState(true);
  const [consentWhatsapp, setConsentWhatsapp] = useState(true);
  const [consentGuidelines, setConsentGuidelines] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredMember, setRegisteredMember] = useState<SocialMember | null>(null);
  const [memberQrUrl, setMemberQrUrl] = useState<string>('');
  const [passDownloading, setPassDownloading] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const [upcomingEvents, setUpcomingEvents] = useState<SocialEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const utm = captureUtmParams();

  useEffect(() => {
    let active = true;
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (active && Array.isArray(data.events)) {
          setUpcomingEvents(data.events.filter((e: SocialEvent) => e.status === 'upcoming').slice(0, 3));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setEventsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!registeredMember) return;
    const verifyUrl = buildHashShareUrl('/social-club', {
      source: 'member-pass',
      medium: 'qr',
      campaign: 'life-begins-with-a-hello',
      content: registeredMember.membershipId,
    });
    generateQrDataUrl(verifyUrl).then(setMemberQrUrl).catch(() => {});
  }, [registeredMember]);

  const toggleInterest = (item: string) => {
    setInterests((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/members/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          whatsappNumber,
          emirate,
          interests,
          ageConfirmed18Plus,
          consentEmail,
          consentWhatsapp,
          consentGuidelines,
          ...utm,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || 'Could not complete registration. Please check your details.');
      } else {
        setRegisteredMember(data.member);
      }
    } catch {
      setErrorMsg('Network error while connecting to registration server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPass = async () => {
    if (!registeredMember) return;
    setPassDownloading(true);
    try {
      const verifyUrl = buildHashShareUrl('/social-club', {
        source: 'member-pass',
        medium: 'qr',
        campaign: 'founding-member',
        content: registeredMember.membershipId,
      });
      const dataUrl = await generateFoundingMemberPassDataUrl(registeredMember, verifyUrl);
      triggerDataUrlDownload(dataUrl, `${registeredMember.membershipId}-Vanhsya-Pass.png`);
    } finally {
      setPassDownloading(false);
    }
  };

  const referralShareUrl = buildHashShareUrl('/social-club', {
    source: 'whatsapp',
    medium: 'member-invite',
    campaign: 'life-begins-with-a-hello',
    content: registeredMember?.membershipId || 'uae-community',
  });

  const whatsappInviteHref = buildWhatsAppShareUrl(
    `Life Begins With a Hello — Come alone. Explore together.\n\nJoin Vanhsya Social Club (UAE Residents 18+) for curated Stranger MeetUps and Founding Member passes:\n${referralShareUrl}\n\nInstagram: ${BRAND_CONTACTS.instagramHandle} | ${BRAND_CONTACTS.websiteDisplay}`
  );

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(referralShareUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  return (
    <div className="pt-24 pb-20 min-h-screen bg-[#0A0812] text-gray-100">
      <SeoHead
        title="Vanhsya Social Club UAE — Life Begins With a Hello"
        description="Come alone. Explore together. Register for your Vanhsya Social Club Founding Member ID and RSVP to verified UAE 18+ Stranger MeetUps."
        path="/social-club"
      />

      {/* Mobile-First Hero + Registration Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Campaign Identity Column */}
          <div className="lg:col-span-6 space-y-7">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-purple-300">
                {BRAND_CONTACTS.clubName} · {BRAND_CONTACTS.audienceNote}
              </p>
              <h1 className="text-4xl sm:text-6xl font-black font-cinzel text-white leading-tight">
                Life Begins <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-violet-200 to-purple-400">
                  With a Hello
                </span>
              </h1>
              <p className="text-xl sm:text-2xl font-light text-purple-200">
                {BRAND_CONTACTS.tagline}
              </p>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-xl">
                Built for residents across the United Arab Emirates aged 18 and above who want genuine offline conversations, small-group city experiences, and welcoming Stranger MeetUps vetted by the Vanhsya team.
              </p>
            </div>

            {/* Key Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#130E20] border border-purple-500/20">
                <h2 className="text-sm font-bold text-white">Founding Member Digital ID</h2>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Receive a permanent <span className="text-purple-300 font-mono">VSC-UAE</span> pass with QR check-in for verified UAE meetups.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-[#130E20] border border-purple-500/20">
                <h2 className="text-sm font-bold text-white">18+ Admin-Verified Venues</h2>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Every meetup date, venue, capacity limit, and host is reviewed by administrators before going live.
                </p>
              </div>
            </div>

            {/* Official Instagram QR & Direct Contacts */}
            <div className="p-5 rounded-2xl bg-[#120D1D] border border-purple-500/25 flex flex-col sm:flex-row items-center gap-5">
              <a
                href={BRAND_CONTACTS.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-28 h-28 rounded-xl overflow-hidden bg-white shrink-0 border border-white/20 shadow-lg"
              >
                <img
                  src={BRAND_CONTACTS.instagramQrPath}
                  alt="Instagram QR code for @vanhsyatravels"
                  className="w-full h-full object-cover"
                />
              </a>
              <div className="space-y-2 text-center sm:text-left">
                <p className="text-xs font-bold uppercase tracking-widest text-purple-300">
                  Official Vanhsya Social Channels
                </p>
                <p className="text-sm text-gray-200">
                  Follow upcoming drops on Instagram{' '}
                  <a
                    href={BRAND_CONTACTS.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-300 font-semibold underline hover:text-white"
                  >
                    {BRAND_CONTACTS.instagramHandle}
                  </a>
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2.5 pt-1">
                  <a
                    href={buildWhatsAppDirectEnquiryUrl('Hello Vanhsya Social Club, I have an enquiry about Founding Membership & UAE Stranger MeetUps.')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors"
                  >
                    WhatsApp {BRAND_CONTACTS.whatsappDisplay}
                  </a>
                  <a
                    href={BRAND_CONTACTS.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-purple-600/20 border border-purple-400/40 text-xs font-semibold text-purple-200 hover:bg-purple-600/40 transition-colors"
                  >
                    Open Instagram
                  </a>
                  <a
                    href={BRAND_CONTACTS.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/15 text-xs font-semibold text-gray-200 hover:bg-white/10 transition-colors"
                  >
                    {BRAND_CONTACTS.websiteDisplay}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Registration Form OR Issued Founding Member Card */}
          <div className="lg:col-span-6">
            {registeredMember ? (
              <div className="p-6 sm:p-8 rounded-3xl bg-[#140F22] border border-purple-400/40 shadow-2xl space-y-6">
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                      Founding Member Active
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-white mt-1">
                      {registeredMember.fullName}
                    </h2>
                    <p className="text-sm font-mono text-purple-300 mt-1">
                      {registeredMember.membershipId}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {registeredMember.emirate}, UAE · Age 18+ Verified
                    </p>
                  </div>
                  {memberQrUrl && (
                    <div className="p-2 bg-white rounded-xl shrink-0">
                      <img src={memberQrUrl} alt="Founding Member QR Pass" className="w-24 h-24" />
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs text-gray-300 space-y-1.5">
                  <p>
                    <span className="text-gray-400">Email Updates:</span>{' '}
                    <strong className="text-white">{registeredMember.consentEmail ? 'Opted In' : 'Not Subscribed'}</strong>
                  </p>
                  <p>
                    <span className="text-gray-400">WhatsApp Invites:</span>{' '}
                    <strong className="text-white">{registeredMember.consentWhatsapp ? 'Opted In' : 'Not Subscribed'}</strong>
                  </p>
                  <p>
                    <span className="text-gray-400">Official Desk:</span> {BRAND_CONTACTS.websiteDisplay} · {BRAND_CONTACTS.email}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleDownloadPass}
                    disabled={passDownloading}
                    className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    {passDownloading ? 'Generating Pass...' : 'Download Digital Member ID'}
                  </button>
                  <a
                    href={whatsappInviteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold text-center transition-colors"
                  >
                    Invite Friends on WhatsApp
                  </a>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10 text-xs">
                  <button
                    onClick={handleCopyInviteLink}
                    className="text-purple-300 hover:text-white underline font-medium"
                  >
                    {copiedInvite ? 'Share link copied' : 'Copy personal invite URL'}
                  </button>
                  <Link to="/meetups" className="text-white font-semibold hover:text-purple-300">
                    Browse Verified MeetUps &rarr;
                  </Link>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="p-6 sm:p-8 rounded-3xl bg-[#130E20] border border-purple-500/30 shadow-2xl space-y-5"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300">
                    UAE Founding Membership
                  </p>
                  <h2 className="text-2xl font-cinzel font-bold text-white mt-1">
                    Register for Early Access & Digital ID
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Receive verified Stranger MeetUp invitations across the Emirates.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-200">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="vsc-full-name" className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      id="vsc-full-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label htmlFor="vsc-email" className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      id="vsc-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label htmlFor="vsc-whatsapp" className="block text-xs font-semibold text-gray-300 mb-1.5">
                      WhatsApp Number *
                    </label>
                    <input
                      id="vsc-whatsapp"
                      type="tel"
                      required
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+971 50 000 0000"
                      className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="vsc-emirate" className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Emirate of Residence (UAE) *
                    </label>
                    <select
                      id="vsc-emirate"
                      value={emirate}
                      onChange={(e) => setEmirate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#0B0814] border border-white/15 text-sm text-white focus:outline-none focus:border-purple-400"
                    >
                      {UAE_EMIRATES.map((em) => (
                        <option key={em} value={em}>
                          {em}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-gray-300 mb-2">
                    MeetUp Interests
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map((item) => {
                      const active = interests.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleInterest(item)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            active
                              ? 'bg-purple-600/30 border-purple-400 text-purple-100'
                              : 'bg-black/30 border-white/10 text-gray-400 hover:border-white/30'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mandatory 18+ Verification & Consent Checkboxes */}
                <div className="space-y-3 pt-2 border-t border-white/10 text-xs text-gray-300">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ageConfirmed18Plus}
                      onChange={(e) => setAgeConfirmed18Plus(e.target.checked)}
                      required
                      className="mt-0.5 rounded accent-purple-500"
                    />
                    <span>
                      <strong className="text-white">Age 18+ Confirmation:</strong> I confirm that I reside in the UAE and am at least 18 years old. *
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentEmail}
                      onChange={(e) => setConsentEmail(e.target.checked)}
                      className="mt-0.5 rounded accent-purple-500"
                    />
                    <span>
                      I consent to receive verified event announcements and RSVP confirmations via email.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentWhatsapp}
                      onChange={(e) => setConsentWhatsapp(e.target.checked)}
                      className="mt-0.5 rounded accent-purple-500"
                    />
                    <span>
                      I consent to receive meetup venue updates and check-in alerts via WhatsApp.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentGuidelines}
                      onChange={(e) => setConsentGuidelines(e.target.checked)}
                      required
                      className="mt-0.5 rounded accent-purple-500"
                    />
                    <span>
                      I agree to the{' '}
                      <Link to="/legal" className="text-purple-300 underline hover:text-white">
                        Privacy Policy, Community Guidelines & Cancellation Terms
                      </Link>
                      . *
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-violet-500 hover:from-purple-500 hover:to-violet-400 text-white font-bold text-sm uppercase tracking-wider shadow-lg transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Issuing Membership ID...' : 'Generate Founding Member Pass'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Live Verified Events Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 border-t border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-300">
              Admin-Verified Calendar
            </p>
            <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-white mt-1">
              Upcoming UAE Stranger MeetUps
            </h2>
          </div>
          <Link to="/meetups" className="text-sm font-semibold text-purple-300 hover:text-white">
            View Full Verified Schedule &rarr;
          </Link>
        </div>

        {eventsLoading ? (
          <p className="text-sm text-gray-400 py-8">Loading verified meetups...</p>
        ) : upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingEvents.map((ev) => (
              <MeetupCard key={ev.id} event={ev} />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-dashed border-purple-500/30 bg-[#120E1D] text-center space-y-3">
            <h3 className="text-lg font-cinzel font-bold text-white">
              Next Verified UAE Dates Announcing Soon
            </h3>
            <p className="text-sm text-gray-400 max-w-xl mx-auto">
              Every meetup is verified by Vanhsya administrators before publication. Register your Founding Member ID above to receive direct WhatsApp or email alerts as soon as our next Dubai or Abu Dhabi gathering opens.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <a
                href={BRAND_CONTACTS.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-purple-600/20 border border-purple-400/40 text-xs font-semibold text-purple-200 hover:bg-purple-600/40"
              >
                Follow {BRAND_CONTACTS.instagramHandle}
              </a>
              <Link
                to="/partners/apply"
                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs font-semibold text-gray-200 hover:bg-white/10"
              >
                Apply to Host a MeetUp
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default SocialClubPage;
