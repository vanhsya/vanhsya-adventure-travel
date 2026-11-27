import React, { useState } from 'react';
import SeoHead from '../components/SeoHead';
import { PartnerApplicationType } from '../types';
import { BRAND_CONTACTS, UAE_EMIRATES } from '../utils/utm';

const PARTNERSHIP_TRACKS = [
  {
    id: 'community-host',
    type: 'community_host' as PartnerApplicationType,
    tier: 'Community Host — Vanhsya Social Club',
    tagline: 'Lead verified 18+ Stranger MeetUps in your Emirate',
    highlights: [
      'Host small-group dinners, coffee circles, padel mixers, or cultural walks',
      'Full access to QR check-in rosters, flyer cards, and WhatsApp invite tools',
      'Mandatory safety onboarding & identity verification before first event',
    ],
  },
  {
    id: 'venue-hospitality',
    type: 'b2b_partner' as PartnerApplicationType,
    tier: 'UAE Venue & Hospitality Partner',
    tagline: 'Co-host curated evenings at cafes, lounges, galleries & desert camps',
    highlights: [
      'Direct verified group reservations across Dubai, Abu Dhabi & Northern Emirates',
      'Co-branded digital invitations & Instagram promotional cards',
      'Dedicated Vanhsya operations coordinator for setup & check-in',
    ],
  },
  {
    id: 'travel-operator',
    type: 'b2b_partner' as PartnerApplicationType,
    tier: 'Tour & Experience Operator',
    tagline: 'Partner with Vanhsya Global Travels on regional & international departures',
    highlights: [
      'Featured itinerary placement alongside AI Planner & VR Experience previews',
      'Verified guest feedback loops without unverified reviews',
      'Direct inquiry routing via info@vanhsya.com and admin approval queue',
    ],
  },
];

const PartnersPage: React.FC = () => {
  const [applicationType, setApplicationType] = useState<PartnerApplicationType>('community_host');
  const [tierInterest, setTierInterest] = useState<string>('Community Host — Vanhsya Social Club');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('+971 ');
  const [emirate, setEmirate] = useState('Dubai');
  const [instagramOrWebsite, setInstagramOrWebsite] = useState('');
  const [experienceSummary, setExperienceSummary] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedAppId, setSubmittedAppId] = useState<number | null>(null);

  const handleSelectTrack = (type: PartnerApplicationType, tier: string) => {
    setApplicationType(type);
    setTierInterest(tier);
    document.getElementById('partner-application-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/partners/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationType,
          tierInterest,
          fullName,
          organization,
          email,
          whatsappNumber,
          emirate,
          instagramOrWebsite,
          experienceSummary,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not submit application.');
      } else {
        setSubmittedAppId(data.application?.id || 1);
      }
    } catch {
      setErrorMsg('Network error submitting your application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#0A0812] text-gray-100">
      <SeoHead
        title="Partners & Community Hosts — Vanhsya Social Club UAE"
        description="Apply to become a verified Vanhsya Social Club Community Host or UAE hospitality partner. Real vetting, real venues, zero invented logos."
        path="/partners/apply"
      />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-14 text-center space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-purple-300">
          {BRAND_CONTACTS.clubName} · {BRAND_CONTACTS.companyName}
        </p>
        <h1 className="text-4xl sm:text-6xl font-black font-cinzel text-white">
          Partners & Community Hosts
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto font-light">
          Collaborate with Vanhsya across the United Arab Emirates. Whether you lead welcoming neighborhood conversations or operate an inspiring venue, every partner is manually reviewed by our team.
        </p>
      </section>

      {/* Tracks */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PARTNERSHIP_TRACKS.map((track) => (
            <div
              key={track.id}
              className="p-7 rounded-2xl bg-[#130E20] border border-purple-500/25 flex flex-col justify-between space-y-6 hover:border-purple-400/50 transition-colors"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-purple-300">
                  {track.type === 'community_host' ? 'Individual Host Track' : 'Venue & B2B Track'}
                </p>
                <h2 className="text-xl font-cinzel font-bold text-white mt-2">{track.tier}</h2>
                <p className="text-sm text-gray-400 mt-2">{track.tagline}</p>
                <ul className="mt-5 space-y-2.5 text-xs text-gray-300">
                  {track.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-purple-400 font-bold">✓</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handleSelectTrack(track.type, track.tier)}
                className="w-full py-3 rounded-xl bg-purple-600/25 border border-purple-400/40 hover:bg-purple-600 text-white text-xs font-bold transition-colors"
              >
                Apply for This Track
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Persistent Application Form */}
      <section id="partner-application-form" className="max-w-3xl mx-auto px-4 sm:px-6">
        {submittedAppId ? (
          <div className="p-8 rounded-3xl bg-[#130E20] border border-emerald-400/40 text-center space-y-4">
            <h2 className="text-2xl font-cinzel font-bold text-white">Application Received</h2>
            <p className="text-sm text-gray-300">
              Your {applicationType === 'community_host' ? 'Community Host' : 'Partner'} application (Ref #{submittedAppId}) has been stored for review in our administrator dashboard.
            </p>
            <p className="text-xs text-gray-400">
              Questions? Reach us at {BRAND_CONTACTS.email} or {BRAND_CONTACTS.instagramHandle}.
            </p>
            <button
              onClick={() => {
                setSubmittedAppId(null);
                setExperienceSummary('');
              }}
              className="px-6 py-2.5 rounded-xl bg-white/10 text-xs font-semibold text-white hover:bg-white/20"
            >
              Submit Another Application
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8 rounded-3xl bg-[#130E20] border border-purple-500/30 shadow-2xl space-y-5"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-purple-300">
                Direct Administrator Queue
              </p>
              <h2 className="text-2xl font-cinzel font-bold text-white mt-1">
                Submit Host or Partner Application
              </h2>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-200">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-300 mb-1.5">Application Type *</label>
                <select
                  value={applicationType}
                  onChange={(e) => setApplicationType(e.target.value as PartnerApplicationType)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0B0814] border border-white/15 text-sm text-white"
                >
                  <option value="community_host">Community Host (MeetUp Leader)</option>
                  <option value="b2b_partner">B2B / Venue / Experience Partner</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-gray-300 mb-1.5">Emirate *</label>
                <select
                  value={emirate}
                  onChange={(e) => setEmirate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0B0814] border border-white/15 text-sm text-white"
                >
                  {UAE_EMIRATES.map((em) => (
                    <option key={em} value={em}>
                      {em}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1.5">Venue / Brand Name</label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Optional for individual hosts"
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.ae"
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1.5">WhatsApp Number *</label>
                <input
                  type="tel"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+971 50 000 0000"
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-gray-300 mb-1.5">
                  Instagram Handle or Website
                </label>
                <input
                  type="text"
                  value={instagramOrWebsite}
                  onChange={(e) => setInstagramOrWebsite(e.target.value)}
                  placeholder="@handle or https://..."
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-gray-300 mb-1.5">
                  Tell us about the meetup format or venue collaboration you propose *
                </label>
                <textarea
                  required
                  rows={4}
                  value={experienceSummary}
                  onChange={(e) => setExperienceSummary(e.target.value)}
                  placeholder="Share hosting background, preferred Dubai/UAE district, venue capacity, or collaboration ideas..."
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-violet-500 hover:from-purple-500 hover:to-violet-400 text-white font-bold text-sm uppercase tracking-wider disabled:opacity-50"
            >
              {submitting ? 'Submitting Application...' : 'Submit Application'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
};

export default PartnersPage;
