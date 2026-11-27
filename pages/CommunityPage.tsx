import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AnimateOnScroll from '../components/AnimateOnScroll';
import SeoHead from '../components/SeoHead';
import { SocialEvent, MissedConnectionRecord } from '../types';
import { BRAND_CONTACTS, UAE_EMIRATES, buildWhatsAppDirectEnquiryUrl } from '../utils/utm';

interface PublicSurvey {
  id: number;
  eventId: number | null;
  eventTitle: string;
  respondentName: string;
  overallRating: number;
  venueRating: number;
  safetyWelcomeRating: number;
  wouldAttendAgain: boolean;
  highlights: string;
  createdAt: string;
}

const COMMUNITY_CIRCLES = [
  {
    title: 'Coffee & Creators',
    subtitle: 'UAE Morning Circles',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop',
  },
  {
    title: 'Trail & Canyon',
    subtitle: 'Wadi & Summit Hikes',
    image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=2070&auto=format&fit=crop',
  },
  {
    title: 'Evening Lounges',
    subtitle: 'Coastal & Cultural Nights',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e5/A_breathtaking_view_of_the_Khor_Fakkan_Monument.jpg/1280px-A_breathtaking_view_of_the_Khor_Fakkan_Monument.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  },
  {
    title: 'Supper Tables',
    subtitle: 'Long-Table Storytelling',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop',
  },
];

const ICEBREAKER_QUESTIONS = [
  {
    category: 'Arrival Energy',
    prompt: 'If a stranger greets you at a Dubai coffee circle, what opens the conversation fastest?',
    options: [
      { label: 'Hidden spot recommendations across the Emirates', vibe: 'Explorer' },
      { label: 'How they landed in the UAE & biggest surprise', vibe: 'Storyteller' },
      { label: 'Planning a spontaneous weekend sunrise trek', vibe: 'Thrill-Seeker' },
      { label: 'Sharing favorite quiet galleries or supper clubs', vibe: 'Culture Curator' },
    ],
  },
  {
    category: 'Weekend Instinct',
    prompt: 'Friday 4:30 PM arrives unexpectedly free. Your move?',
    options: [
      { label: 'Drive out toward Hatta or Jebel Jais ridge', vibe: 'Thrill-Seeker' },
      { label: 'Try a zero-clue Alserkal or Sharjah art walk', vibe: 'Culture Curator' },
      { label: 'Book a yacht deck or desert stargazing bonfire', vibe: 'Explorer' },
      { label: 'Gather 4 people around slow espresso & notebooks', vibe: 'Storyteller' },
    ],
  },
  {
    category: 'Life Connection',
    prompt: 'What makes a friendship formed at a Vanhsya meetup last beyond one evening?',
    options: [
      { label: 'Showing up consistently for monthly city quests', vibe: 'Explorer' },
      { label: 'Honest midnight talks without small-talk masks', vibe: 'Storyteller' },
      { label: 'Daring to try a scary canyon or night dive together', vibe: 'Thrill-Seeker' },
      { label: 'Building creative side projects or giving back', vibe: 'Culture Curator' },
    ],
  },
  {
    category: 'Give-Back Spirit',
    prompt: 'Pick one unexpected gesture you love bringing to the table:',
    options: [
      { label: 'Sponsoring a warm meal / charity explorer tee', vibe: 'Culture Curator' },
      { label: 'Bringing Polaroid snaps for everyone at the table', vibe: 'Storyteller' },
      { label: 'Planning a surprise birthday cake for a solo traveler', vibe: 'Explorer' },
      { label: 'Leading the group down an unmarked trail clue', vibe: 'Thrill-Seeker' },
    ],
  },
];

const CommunityPage: React.FC = () => {
  const [events, setEvents] = useState<SocialEvent[]>([]);
  const [verifiedSurveys, setVerifiedSurveys] = useState<PublicSurvey[]>([]);
  const [connections, setConnections] = useState<MissedConnectionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Icebreaker Mini-Game State
  const [gameStep, setGameStep] = useState(0);
  const [vibeCounts, setVibeCounts] = useState<Record<string, number>>({});
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Connect for Life Form State
  const [aliasName, setAliasName] = useState('');
  const [privateEmail, setPrivateEmail] = useState('');
  const [privatePhone, setPrivatePhone] = useState('');
  const [connEmirate, setConnEmirate] = useState('Dubai');
  const [locationOrEvent, setLocationOrEvent] = useState('');
  const [encounterDate, setEncounterDate] = useState('');
  const [publicNote, setPublicNote] = useState('');
  const [age18Plus, setAge18Plus] = useState(false);
  const [consentPublicPost, setConsentPublicPost] = useState(false);
  const [connSubmitting, setConnSubmitting] = useState(false);
  const [connError, setConnError] = useState<string | null>(null);
  const [connSuccess, setConnSuccess] = useState<string | null>(null);

  // Private Relay Reply State
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null);
  const [replyAlias, setReplyAlias] = useState('');
  const [replyEmail, setReplyEmail] = useState('');
  const [replyMsg, setReplyMsg] = useState('');
  const [replyStatus, setReplyStatus] = useState<string | null>(null);
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Post-Event Survey Form State
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [customEventTitle, setCustomEventTitle] = useState('Vanhsya Social Club Gathering');
  const [rsvpCode, setRsvpCode] = useState('');
  const [respondentName, setRespondentName] = useState('');
  const [email, setEmail] = useState('');
  const [overallRating, setOverallRating] = useState(5);
  const [venueRating, setVenueRating] = useState(5);
  const [safetyWelcomeRating, setSafetyWelcomeRating] = useState(5);
  const [wouldAttendAgain, setWouldAttendAgain] = useState(true);
  const [highlights, setHighlights] = useState('');
  const [improvements, setImprovements] = useState('');
  const [consentPublish, setConsentPublish] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadData = () => {
    Promise.all([
      fetch('/api/events').then((r) => r.json()).catch(() => ({ events: [] })),
      fetch('/api/surveys/verified').then((r) => r.json()).catch(() => ({ surveys: [] })),
      fetch('/api/connections/public').then((r) => r.json()).catch(() => ({ connections: [] })),
    ])
      .then(([evData, svData, connData]) => {
        setEvents(Array.isArray(evData.events) ? evData.events : []);
        setVerifiedSurveys(Array.isArray(svData.surveys) ? svData.surveys : []);
        setConnections(Array.isArray(connData.connections) ? connData.connections : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGamePick = (vibe: string) => {
    setVibeCounts((prev) => ({ ...prev, [vibe]: (prev[vibe] || 0) + 1 }));
    setGameStep((prev) => prev + 1);
  };

  const resetGame = () => {
    setGameStep(0);
    setVibeCounts({});
    setCopiedPrompt(false);
  };

  const dominantVibe = Object.entries(vibeCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || 'Explorer';

  const handlePostConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnError(null);
    setConnSuccess(null);
    setConnSubmitting(true);
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aliasName,
          privateEmail,
          privatePhone,
          emirate: connEmirate,
          locationOrEvent,
          encounterDate,
          publicNote,
          ageConfirmed18Plus: age18Plus,
          consentPublicPost,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setConnError(data.error || 'Could not publish anonymous note.');
      } else {
        setConnSuccess(data.message || 'Published anonymously without exposing private contacts.');
        setAliasName('');
        setPrivateEmail('');
        setPrivatePhone('');
        setLocationOrEvent('');
        setEncounterDate('');
        setPublicNote('');
        setAge18Plus(false);
        setConsentPublicPost(false);
        loadData();
      }
    } catch {
      setConnError('Network error while saving Connect for Life note.');
    } finally {
      setConnSubmitting(false);
    }
  };

  const handleSendRelay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTargetId) return;
    setReplySubmitting(true);
    setReplyStatus(null);
    try {
      const res = await fetch(`/api/connections/${replyTargetId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderAlias: replyAlias,
          senderEmail: replyEmail,
          messageText: replyMsg,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReplyStatus(data.error || 'Could not queue private relay.');
      } else {
        setReplyStatus(data.message || 'Private relay queued securely.');
        setReplyAlias('');
        setReplyEmail('');
        setReplyMsg('');
        loadData();
      }
    } catch {
      setReplyStatus('Network error sending relay.');
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEventId ? Number(selectedEventId) : null,
          eventTitle: customEventTitle,
          rsvpCode,
          respondentName,
          email,
          overallRating,
          venueRating,
          safetyWelcomeRating,
          wouldAttendAgain,
          highlights,
          improvements,
          consentPublish,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Could not submit feedback.');
      } else {
        setSubmitSuccess(true);
        setHighlights('');
        setImprovements('');
        loadData();
      }
    } catch {
      setSubmitError('Network error while saving your feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-20 pb-20 min-h-screen bg-[#07050C] text-gray-200 overflow-hidden">
      <SeoHead
        title="Community Collective & Feedback — Vanhsya Social Club UAE"
        description="Explore Vanhsya's UAE community circles, Blueprint missions, official Instagram & WhatsApp channels, and consented post-event attendee surveys."
        path="/community"
      />

      {/* Restored Atmospheric Collective Hero */}
      <section className="relative py-24 lg:py-32 px-4 sm:px-6 flex items-center justify-center overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2070&auto=format&fit=crop"
            alt="Vanhsya Collective Gathering"
            className="w-full h-full object-cover opacity-25 contrast-125"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#07050C]/65 via-[#07050C]/75 to-[#07050C]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center space-y-6">
          <span className="inline-block py-1.5 px-5 rounded-full bg-purple-900/35 border border-purple-400/35 text-purple-200 text-xs font-mono font-bold uppercase tracking-[0.28em] backdrop-blur-md">
            {BRAND_CONTACTS.clubName} · {BRAND_CONTACTS.audienceNote}
          </span>
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-white font-cinzel tracking-tight uppercase leading-[0.9]">
            Collective <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-white to-cyan-300">
              Unbound
            </span>
          </h1>
          <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto font-light leading-relaxed">
            {BRAND_CONTACTS.tagline} Explore our UAE social interest circles, host partnerships, and authentic attendee reflections gathered strictly with consent.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              to="/social-club"
              className="px-7 py-3.5 rounded-xl bg-white text-black font-black uppercase tracking-wider text-xs hover:bg-purple-300 transition-colors"
            >
              Join Founding Registry
            </Link>
            <a
              href={buildWhatsAppDirectEnquiryUrl('Hi Vanhsya Community Desk! I would like to connect about UAE meetups and circles.')}
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-3.5 rounded-xl bg-emerald-950/60 border border-emerald-400/40 text-emerald-200 font-bold uppercase tracking-wider text-xs hover:bg-emerald-900/70 transition-colors"
            >
              WhatsApp {BRAND_CONTACTS.whatsappDisplay}
            </a>
          </div>
        </div>
      </section>

      {/* Restored Community Circles Grid */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-b border-white/10">
        <AnimateOnScroll>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-[0.28em] text-purple-300 block mb-2">
                CURATED INTEREST CIRCLES
              </span>
              <h2 className="text-3xl sm:text-5xl font-cinzel font-black text-white uppercase">
                Community Circles
              </h2>
            </div>
            <Link to="/meetups" className="text-xs font-bold uppercase tracking-widest text-purple-300 hover:text-white">
              Browse Verified MeetUps &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {COMMUNITY_CIRCLES.map((circle) => (
              <Link
                to="/social-club"
                key={circle.title}
                className="relative group overflow-hidden rounded-3xl aspect-[4/5] border border-white/10 shadow-2xl block"
              >
                <img
                  src={circle.image}
                  alt={circle.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-[11px] font-mono uppercase tracking-widest text-purple-300 font-semibold">
                    {circle.subtitle}
                  </p>
                  <h3 className="text-2xl font-cinzel font-black text-white mt-1">{circle.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </AnimateOnScroll>
      </section>

      {/* Restored Ecosystem Infrastructure + Official Contacts Strip */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto border-b border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
          <Link to="/treasure-hunt" className="p-6 rounded-2xl bg-[#120D1D] border border-cyan-500/25 hover:border-cyan-400/60 transition-colors">
            <p className="text-xs font-mono text-cyan-300 font-bold uppercase">Interactive Quests</p>
            <h3 className="text-xl font-cinzel font-bold text-white mt-2">The Blueprint &rarr;</h3>
            <p className="text-xs text-gray-400 mt-2">Half-clue UAE city quests designed for collaborative teams.</p>
          </Link>
          <Link to="/ventures" className="p-6 rounded-2xl bg-[#120D1D] border border-amber-500/25 hover:border-amber-400/60 transition-colors">
            <p className="text-xs font-mono text-amber-300 font-bold uppercase">Lifestyle &amp; Charity</p>
            <h3 className="text-xl font-cinzel font-bold text-white mt-2">Couples, Merch &amp; Surprises &rarr;</h3>
            <p className="text-xs text-gray-400 mt-2">Scariest couples challenges, explorer tees, charity &amp; business kiosks.</p>
          </Link>
          <Link to="/partners/apply" className="p-6 rounded-2xl bg-[#120D1D] border border-purple-500/25 hover:border-purple-400/60 transition-colors">
            <p className="text-xs font-mono text-purple-300 font-bold uppercase">Hosts &amp; Venues</p>
            <h3 className="text-xl font-cinzel font-bold text-white mt-2">Partner Desk &rarr;</h3>
            <p className="text-xs text-gray-400 mt-2">Host verified cafes, supper clubs, or activity sessions.</p>
          </Link>
          <Link to="/vyno" className="p-6 rounded-2xl bg-[#120D1D] border border-cyan-500/25 hover:border-cyan-400/60 transition-colors">
            <p className="text-xs font-mono text-cyan-300 font-bold uppercase">ethers.js Console</p>
            <h3 className="text-xl font-cinzel font-bold text-white mt-2">Web3 Verification &rarr;</h3>
            <p className="text-xs text-gray-400 mt-2">Connect wallet and inspect signed receipts securely.</p>
          </Link>
          <div className="p-5 rounded-2xl bg-[#120D1D] border border-purple-500/25 flex items-center gap-4">
            <a
              href={BRAND_CONTACTS.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0 border border-white/20"
            >
              <img
                src={BRAND_CONTACTS.instagramQrPath}
                alt="@vanhsyatravels Instagram QR Code"
                className="w-full h-full object-cover"
              />
            </a>
            <div className="text-xs space-y-1 min-w-0">
              <a
                href={BRAND_CONTACTS.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-purple-300 font-semibold hover:text-white truncate"
              >
                {BRAND_CONTACTS.instagramHandle}
              </a>
              <a
                href={BRAND_CONTACTS.whatsappDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-emerald-300 font-mono hover:text-emerald-200"
              >
                {BRAND_CONTACTS.whatsappDisplay}
              </a>
              <a
                href={`mailto:${BRAND_CONTACTS.infoEmail}`}
                className="block text-gray-300 underline truncate"
              >
                {BRAND_CONTACTS.infoEmail}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Icebreaker Card Game & Compatibility Deck */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto border-b border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-[0.26em] text-cyan-300">
              INTERACTIVE MINI-GAME · ZERO AWKWARD SILENCE
            </span>
            <h2 className="text-3xl sm:text-4xl font-cinzel font-black text-white">
              Explorer Compatibility Deck
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              Play this 4-card warm-up before arriving at a meetup or share your Explorer Archetype card at the table to spark authentic lifelong friendships.
            </p>
            <div className="flex flex-wrap gap-3 text-xs">
              <Link
                to="/meetups"
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
              >
                Match at Next MeetUp
              </Link>
              <Link
                to="/ventures#couples"
                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 text-gray-200 font-semibold"
              >
                Explore Couples Challenges &rarr;
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#140F24] to-[#0D0A16] border border-purple-400/30 shadow-2xl space-y-5">
              {gameStep < ICEBREAKER_QUESTIONS.length ? (
                <>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-purple-300 font-bold uppercase">
                      Card {gameStep + 1} of {ICEBREAKER_QUESTIONS.length} · {ICEBREAKER_QUESTIONS[gameStep].category}
                    </span>
                    <span className="text-gray-400">UAE 18+ Icebreaker</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300"
                      style={{ width: `${((gameStep + 1) / ICEBREAKER_QUESTIONS.length) * 100}%` }}
                    />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-cinzel font-bold text-white">
                    {ICEBREAKER_QUESTIONS[gameStep].prompt}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ICEBREAKER_QUESTIONS[gameStep].options.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => handleGamePick(opt.vibe)}
                        className="p-4 rounded-2xl text-left bg-black/45 border border-white/10 hover:border-purple-400/60 hover:bg-purple-950/30 transition-all text-xs sm:text-sm text-gray-200"
                      >
                        <span className="block font-semibold text-white">{opt.label}</span>
                        <span className="block text-[10px] font-mono uppercase tracking-widest text-cyan-300 mt-1.5">
                          +{opt.vibe}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-4 text-center py-4">
                  <p className="text-xs font-mono uppercase tracking-[0.25em] text-emerald-300 font-bold">
                    Your Social Archetype
                  </p>
                  <h3 className="text-3xl font-cinzel font-black text-white">
                    {dominantVibe} Circle Fit
                  </h3>
                  <p className="text-sm text-gray-300 max-w-md mx-auto">
                    {dominantVibe === 'Thrill-Seeker'
                      ? 'You thrive in Jebel Jais ridge hikes, twilight desert runs, and Blueprint clue sprints.'
                      : dominantVibe === 'Storyteller'
                      ? 'You shine at cozy specialty coffee circles and meaningful long-table suppers.'
                      : dominantVibe === 'Culture Curator'
                      ? 'You bring heart to Alserkal gallery walks, printed tee charity pledges, and heritage trails.'
                      : 'You bridge solo newcomers together across waterfront promenades and UAE weekend escapes.'}
                  </p>
                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          `My Vanhsya Social Club vibe is "${dominantVibe}" — Life Begins With a Hello! www.vanhsya.com`
                        );
                        setCopiedPrompt(true);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-cyan-500 text-black text-xs font-bold"
                    >
                      {copiedPrompt ? '✓ Copied Result!' : 'Copy Table Icebreaker'}
                    </button>
                    <button
                      type="button"
                      onClick={resetGame}
                      className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                    >
                      Play Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Privacy-First Missed Connections / "Didn't Make It — Connect for Life" */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto border-b border-white/10">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-[0.26em] text-purple-300">
              DIDN&apos;T MAKE IT OR MISSED SOMEONE? · CONNECT FOR LIFE
            </span>
            <h2 className="text-3xl sm:text-4xl font-cinzel font-black text-white mt-2">
              Privacy-First UAE Connect Board
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
              Couldn&apos;t attend the meetup or lost touch before swapping socials? Post an alias note without exposing your email or phone. Private contact details stay sealed server-side for consent-based relay only.
            </p>
          </div>
          <span className="px-4 py-2 rounded-xl bg-emerald-950/50 border border-emerald-400/30 text-[11px] font-mono text-emerald-200 shrink-0">
            🔒 Zero Public Emails or Phone Numbers
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Post a Connect for Life Note */}
          <form
            onSubmit={handlePostConnection}
            className="lg:col-span-5 p-6 sm:p-7 rounded-3xl bg-[#130E20] border border-purple-500/30 space-y-4 text-xs"
          >
            <h3 className="text-xl font-cinzel font-bold text-white">Leave an Anonymous Connect Note</h3>
            {connError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200">{connError}</div>
            )}
            {connSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200">{connSuccess}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-300 mb-1">Public Alias / First Name *</label>
                <input
                  type="text"
                  required
                  value={aliasName}
                  onChange={(e) => setAliasName(e.target.value)}
                  placeholder="e.g., Maya (Blue Tote)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-300 mb-1">Emirate *</label>
                <select
                  value={connEmirate}
                  onChange={(e) => setConnEmirate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0814] border border-white/15 text-sm text-white"
                >
                  {UAE_EMIRATES.map((em) => (
                    <option key={em} value={em}>{em}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-300 mb-1">Private Relay Email * (Sealed)</label>
                <input
                  type="email"
                  required
                  value={privateEmail}
                  onChange={(e) => setPrivateEmail(e.target.value)}
                  placeholder="never shown publicly"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-300 mb-1">Private WhatsApp (Optional)</label>
                <input
                  type="tel"
                  value={privatePhone}
                  onChange={(e) => setPrivatePhone(e.target.value)}
                  placeholder="+971... (never public)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-300 mb-1">MeetUp / Spot *</label>
                <input
                  type="text"
                  required
                  value={locationOrEvent}
                  onChange={(e) => setLocationOrEvent(e.target.value)}
                  placeholder="e.g., Alserkal Coffee Circle"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-300 mb-1">Date / Approximate Time</label>
                <input
                  type="date"
                  value={encounterDate}
                  onChange={(e) => setEncounterDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-300 mb-1">Respectful Note *</label>
              <textarea
                required
                rows={3}
                value={publicNote}
                onChange={(e) => setPublicNote(e.target.value)}
                placeholder="Share what you missed, which conversation inspired you, or invite folks to the next table..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
              />
            </div>

            <label className="flex items-start gap-2 text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={age18Plus}
                onChange={(e) => setAge18Plus(e.target.checked)}
                className="mt-0.5 accent-purple-500"
              />
              <span>I confirm I am aged 18+ and abide by Vanhsya respectful community conduct.</span>
            </label>

            <label className="flex items-start gap-2 text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={consentPublicPost}
                onChange={(e) => setConsentPublicPost(e.target.checked)}
                className="mt-0.5 accent-purple-500"
              />
              <span>Publish my alias &amp; note publicly while sealing my email/phone strictly for opt-in relay.</span>
            </label>

            <button
              type="submit"
              disabled={connSubmitting}
              className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-wider disabled:opacity-50"
            >
              {connSubmitting ? 'Publishing Safely...' : 'Post Connect for Life Note'}
            </button>
          </form>

          {/* Public Anonymous Notes & Private Relay Trigger */}
          <div className="lg:col-span-7 space-y-4">
            {connections.length > 0 ? (
              connections.map((item) => (
                <div key={item.id} className="p-6 rounded-2xl bg-[#130E20] border border-white/10 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-200 font-bold">
                        {item.aliasName}
                      </span>
                      <span className="text-gray-400">
                        {item.emirate} · {item.locationOrEvent}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-gray-400">
                      {item.postRef} · {item.replyCount || 0} relays
                    </span>
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed">"{item.publicNote}"</p>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10 text-xs">
                    <span className="text-gray-400">
                      {item.encounterDate ? `Date: ${item.encounterDate}` : new Date(item.createdAt).toLocaleDateString('en-AE')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTargetId(replyTargetId === item.id ? null : item.id);
                        setReplyStatus(null);
                      }}
                      className="px-4 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-400/35 text-cyan-200 hover:bg-cyan-500/25 font-semibold"
                    >
                      {replyTargetId === item.id ? 'Close Relay' : 'Send Private Relay Intro'}
                    </button>
                  </div>

                  {replyTargetId === item.id && (
                    <form onSubmit={handleSendRelay} className="mt-3 p-4 rounded-xl bg-black/50 border border-cyan-500/25 space-y-3 text-xs">
                      <p className="text-cyan-200 font-semibold">
                        Send a sealed intro to {item.aliasName}. Support ({BRAND_CONTACTS.supportEmail}) moderates relays so personal details remain private.
                      </p>
                      {replyStatus && <p className="text-emerald-300 font-semibold">{replyStatus}</p>}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          required
                          value={replyAlias}
                          onChange={(e) => setReplyAlias(e.target.value)}
                          placeholder="Your first name / alias"
                          className="px-3 py-2 rounded-lg bg-[#0D0A16] border border-white/15 text-white"
                        />
                        <input
                          type="email"
                          required
                          value={replyEmail}
                          onChange={(e) => setReplyEmail(e.target.value)}
                          placeholder="Your private email"
                          className="px-3 py-2 rounded-lg bg-[#0D0A16] border border-white/15 text-white"
                        />
                      </div>
                      <textarea
                        required
                        rows={2}
                        value={replyMsg}
                        onChange={(e) => setReplyMsg(e.target.value)}
                        placeholder="Say hello and mention where you met or would love to meet at an upcoming circle..."
                        className="w-full px-3 py-2 rounded-lg bg-[#0D0A16] border border-white/15 text-white"
                      />
                      <button
                        type="submit"
                        disabled={replySubmitting}
                        className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-bold"
                      >
                        {replySubmitting ? 'Sending...' : 'Queue Private Relay'}
                      </button>
                    </form>
                  )}
                </div>
              ))
            ) : (
              <div className="p-10 rounded-2xl border border-dashed border-purple-500/30 bg-[#130E20] text-center space-y-3">
                <h3 className="text-lg font-cinzel font-bold text-white">No Active Connect Notes Yet</h3>
                <p className="text-sm text-gray-400 max-w-md mx-auto">
                  Missed a gathering or wanted to reconnect with someone who sparked great conversation? Leave the first respectful anonymous note on the left.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Post-Event Survey & Consented Attendee Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5">
          {submitSuccess ? (
            <div className="p-8 rounded-3xl bg-[#130E20] border border-emerald-400/40 space-y-4">
              <h2 className="text-2xl font-cinzel font-bold text-white">Thank You for Your Input</h2>
              <p className="text-sm text-gray-300">
                Your survey response has been persistently saved for organizer review.
              </p>
              <button
                onClick={() => setSubmitSuccess(false)}
                className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500"
              >
                Submit Another Response
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="p-6 sm:p-8 rounded-3xl bg-[#130E20] border border-purple-500/30 shadow-2xl space-y-4 text-xs"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-purple-300">
                  Post-Event Survey
                </p>
                <h2 className="text-2xl font-cinzel font-bold text-white mt-1">
                  Rate Your MeetUp Experience
                </h2>
              </div>

              {submitError && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200">
                  {submitError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Select Verified Event</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => {
                    setSelectedEventId(e.target.value);
                    const matched = events.find((ev) => String(ev.id) === e.target.value);
                    if (matched) setCustomEventTitle(matched.title);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0814] border border-white/15 text-sm text-white"
                >
                  <option value="">General Vanhsya Social Club / Other Event</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={String(ev.id)}>
                      {ev.title} ({ev.eventDate})
                    </option>
                  ))}
                </select>
              </div>

              {!selectedEventId && (
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">Event / Experience Name *</label>
                  <input
                    type="text"
                    required
                    value={customEventTitle}
                    onChange={(e) => setCustomEventTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={respondentName}
                    onChange={(e) => setRespondentName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">RSVP Pass Code (optional)</label>
                <input
                  type="text"
                  value={rsvpCode}
                  onChange={(e) => setRsvpCode(e.target.value)}
                  placeholder="VSC-XXXXXX"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <label className="text-gray-300 font-semibold">
                  Overall (1-5)
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={overallRating}
                    onChange={(e) => setOverallRating(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white"
                  />
                </label>
                <label className="text-gray-300 font-semibold">
                  Venue (1-5)
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={venueRating}
                    onChange={(e) => setVenueRating(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white"
                  />
                </label>
                <label className="text-gray-300 font-semibold">
                  Safety (1-5)
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={safetyWelcomeRating}
                    onChange={(e) => setSafetyWelcomeRating(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white"
                  />
                </label>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Highlights &amp; Reflections *</label>
                <textarea
                  required
                  rows={3}
                  value={highlights}
                  onChange={(e) => setHighlights(e.target.value)}
                  placeholder="How welcoming did the gathering feel? What worked well?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Suggestions for Improvement</label>
                <textarea
                  rows={2}
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  placeholder="Timing, venue seating, group size, or host notes..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white"
                />
              </div>

              <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wouldAttendAgain}
                  onChange={(e) => setWouldAttendAgain(e.target.checked)}
                  className="accent-purple-500"
                />
                <span>I would attend another Vanhsya Social Club meetup</span>
              </label>

              <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentPublish}
                  onChange={(e) => setConsentPublish(e.target.checked)}
                  className="accent-purple-500"
                />
                <span>Consent to share my first name and highlight publicly on this page</span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-wider disabled:opacity-50"
              >
                {submitting ? 'Saving Feedback...' : 'Submit Post-Event Survey'}
              </button>
            </form>
          )}
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-2xl font-cinzel font-bold text-white">
              Verified Attendee Feedback
            </h2>
            <Link to="/meetups" className="text-xs font-semibold text-purple-300 hover:text-white">
              Browse Events &rarr;
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400">Loading feedback...</p>
          ) : verifiedSurveys.length > 0 ? (
            <div className="space-y-4">
              {verifiedSurveys.map((sv) => (
                <article key={sv.id} className="p-6 rounded-2xl bg-[#130E20] border border-white/10 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-purple-300">{sv.eventTitle}</span>
                    <span className="text-gray-300 font-semibold">
                      Overall {sv.overallRating}/5 · Venue {sv.venueRating}/5 · Safety {sv.safetyWelcomeRating}/5
                    </span>
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed">"{sv.highlights}"</p>
                  <p className="text-xs text-gray-400">
                    — {sv.respondentName} · {new Date(sv.createdAt).toLocaleDateString('en-AE')}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-10 rounded-2xl border border-dashed border-purple-500/30 bg-[#130E20] text-center space-y-3">
              <h3 className="text-lg font-cinzel font-bold text-white">
                No Published Attendee Reviews Yet
              </h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                Vanhsya Social Club never displays invented testimonials. Attend a verified meetup and submit your honest reflection using the survey form.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CommunityPage;
