import React from 'react';
import { Link } from 'react-router-dom';
import SeoHead from '../components/SeoHead';
import { BRAND_CONTACTS } from '../utils/utm';

const LegalPage: React.FC = () => {
  return (
    <div className="pt-28 pb-20 min-h-screen bg-[#0A0812] text-gray-200">
      <SeoHead
        title="Privacy Policy, Community Guidelines & Cancellation Terms — Vanhsya Social Club"
        description="Official privacy practices, consent-based email and WhatsApp policy, 18+ UAE community code of conduct, and RSVP cancellation terms for Vanhsya Social Club."
        path="/legal"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        <header className="space-y-3 border-b border-white/10 pb-8">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-purple-300">
            {BRAND_CONTACTS.clubName} · {BRAND_CONTACTS.companyName}
          </p>
          <h1 className="text-3xl sm:text-5xl font-black font-cinzel text-white">
            Privacy, Community Guidelines & Cancellation Terms
          </h1>
          <p className="text-sm text-gray-400">
            Last updated: November 2026 · Official channels: {BRAND_CONTACTS.websiteDisplay} & Instagram {BRAND_CONTACTS.instagramHandle}
          </p>
        </header>

        {/* Privacy Policy */}
        <section id="privacy" className="p-6 sm:p-8 rounded-3xl bg-[#130E20] border border-purple-500/25 space-y-4">
          <h2 className="text-2xl font-cinzel font-bold text-white">1. Privacy Policy & Consent-First Data Use</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            When you register as a Founding Member or confirm an RSVP with {BRAND_CONTACTS.clubName}, we collect only the information required to issue your membership ID, manage event venue capacity, and verify attendee safety: your full name, email address, WhatsApp phone number, Emirate of residence, 18+ age confirmation, and optional campaign UTM attribution parameters.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-300">
            <li>
              <strong>Consent-Based Communications:</strong> Email event invitations and WhatsApp venue arrival reminders are sent exclusively to members who actively opted into each channel. You can withdraw consent anytime by emailing {BRAND_CONTACTS.supportEmail} or {BRAND_CONTACTS.email}.
            </li>
            <li>
              <strong>No Unverified Public Exposure &amp; Private Connection Relay:</strong> Attendee phone numbers, email addresses, and private survey comments are accessible only to authorized Vanhsya administrators and are never displayed publicly. In the opt-in Missed Connections ("Connect for Life") Lounge, personal contact details are strictly withheld—first names or aliases are shown only with explicit user consent, and follow-up messages are relayed privately.
            </li>
            <li>
              <strong>Zero Unapproved Token Promotions:</strong> Token financial claims and staking incentives are disabled pending formal regulatory compliance review.
            </li>
          </ul>
        </section>

        {/* Community Guidelines */}
        <section id="guidelines" className="p-6 sm:p-8 rounded-3xl bg-[#130E20] border border-purple-500/25 space-y-4">
          <h2 className="text-2xl font-cinzel font-bold text-white">2. UAE 18+ Community Guidelines ("Life Begins With a Hello")</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            Vanhsya Social Club exists so solo explorers and UAE residents can meet new friends respectfully in curated, safe offline spaces. Participation is strictly restricted to individuals aged <strong>18 and above</strong> residing in the United Arab Emirates.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-300">
            <li>
              <strong>Respectful Conduct:</strong> Harassment, unsolicited sales pitching, discrimination, or photography of attendees without clear verbal consent are strictly prohibited.
            </li>
            <li>
              <strong>Verified Check-In:</strong> Every attendee must hold a confirmed RSVP code or Founding Member Digital ID checked in at the venue.
            </li>
            <li>
              <strong>Local Laws &amp; Venture Transparency:</strong> All gatherings and franchise/hub partner spaces operate under UAE regulations. Franchise, kiosk, and investment enquiries submitted on Vanhsya are non-binding partnership applications subject to formal legal agreements—no guaranteed financial yields are advertised online.
            </li>
          </ul>
        </section>

        {/* Cancellation Terms */}
        <section id="cancellation" className="p-6 sm:p-8 rounded-3xl bg-[#130E20] border border-purple-500/25 space-y-4">
          <h2 className="text-2xl font-cinzel font-bold text-white">3. RSVP &amp; Event Cancellation Terms</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-300">
            <li>
              <strong>Attendee Cancellations:</strong> MeetUps use strict small-group capacity caps. If you cannot attend, please notify support at {BRAND_CONTACTS.supportEmail} (or {BRAND_CONTACTS.email}) at least 24 hours prior so your seat can be released to another UAE resident.
            </li>
            <li>
              <strong>Organizer Cancellations or Rescheduling:</strong> Only administrator-verified events appear on the live calendar. If weather, venue logistics, or host illness requires cancellation, the event status is immediately updated to "Cancelled" with clear reason notices and opted-in attendees are notified promptly.
            </li>
            <li>
              <strong>Paid Experiences &amp; Couples / Surprise Bookings:</strong> Any paid meetup, adventure, or bespoke surprise reservation fee (explicitly shown in AED/USD) is refunded 100% if cancelled by the organizer or requested 24+ hours prior to start time via {BRAND_CONTACTS.supportEmail}.
            </li>
          </ul>
        </section>

        <div className="flex flex-wrap gap-4 pt-2">
          <Link to="/social-club" className="px-6 py-3 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-500">
            Register for Vanhsya Social Club
          </Link>
          <Link to="/meetups" className="px-6 py-3 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/20">
            Browse Verified MeetUps
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
