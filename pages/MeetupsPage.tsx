import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import MeetupCard from '../components/MeetupCard';
import SeoHead from '../components/SeoHead';
import { SocialEvent, SocialEventStatus } from '../types';
import {
  BRAND_CONTACTS,
  UAE_EMIRATES,
  buildWhatsAppDirectEnquiryUrl,
} from '../utils/utm';

type PublicStatusTab = Exclude<SocialEventStatus, 'draft'>;

const STATUS_TABS: Array<{ key: PublicStatusTab | 'all'; label: string }> = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'sold_out', label: 'Sold Out' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'all', label: 'All Verified' },
];

const EXPERIENCE_FORMATS = [
  {
    vibe: 'SILENCE & RESET',
    badgeClass: 'bg-cyan-500/15 border-cyan-400/35 text-cyan-200',
    title: 'Coffee & Slow Morning Circles',
    emirate: 'Dubai & Abu Dhabi',
    description:
      'Intimate specialty coffee tables capped at 10–14 residents so solo arrivals join warm unhurried conversation.',
    image: '/assets/aistudio/image_22851a6e.png',
  },
  {
    vibe: 'HORIZON EXPLORATION',
    badgeClass: 'bg-purple-500/15 border-purple-400/35 text-purple-200',
    title: 'Desert Stargazing & Wadi Trails',
    emirate: 'Ras Al Khaimah & Al Qudra',
    description:
      'Sunset dune walks, lantern-lit fireside talks, and mountain sunrise hikes guided with verified Vanhsya hosts.',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cc/Dubai_Skyline_mit_Burj_Khalifa_%2818241030269%29.jpg/1280px-Dubai_Skyline_mit_Burj_Khalifa_%2818241030269%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  },
  {
    vibe: 'CREATIVE IMMERSION',
    badgeClass: 'bg-violet-500/15 border-violet-400/35 text-violet-200',
    title: 'Gallery Nights & Supper Clubs',
    emirate: 'Alserkal & Sharjah Art Quarter',
    description:
      'Shared long-table dinners and evening gallery walks designed around curiosity, culture, and zero cliques.',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/26/Louvre_Abu_Dhabi_01.jpg/1280px-Louvre_Abu_Dhabi_01.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  },
];

const MARQUEE_GALLERY = [
  {
    src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7f/Abra_at_Dubai_Creek_%28_Old_Dubai_%29.jpg/1280px-Abra_at_Dubai_Creek_%28_Old_Dubai_%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    caption: 'Dubai Creek Heritage Abra',
  },
  {
    src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fb/Al_Fahidi_Historical_Neighborhood_01.jpg/1280px-Al_Fahidi_Historical_Neighborhood_01.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    caption: 'Al Fahidi Courtyard Gatherings',
  },
  {
    src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/09/Louvre_abu_dhabi%2C_interno%2C_cortile_coperto_01.jpg/1280px-Louvre_abu_dhabi%2C_interno%2C_cortile_coperto_01.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    caption: 'Museum & Architecture Circles',
  },
  {
    src: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=1200',
    caption: 'Coastal Perspectives',
  },
  {
    src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/17/Mountain_view%2C_Jebel_Jais_Ras_al_Khaimah%2C_UAE.jpg/1280px-Mountain_view%2C_Jebel_Jais_Ras_al_Khaimah%2C_UAE.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    caption: 'Jebel Jais High-Altitude Trails',
  },
  {
    src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0c/KhorFakkan.jpg/1280px-KhorFakkan.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    caption: 'Khor Fakkan Coastline',
  },
];

const MeetupsPage: React.FC = () => {
  const [events, setEvents] = useState<SocialEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PublicStatusTab | 'all'>('upcoming');
  const [emirateFilter, setEmirateFilter] = useState<string>('All');
  const [heroVideoMuted, setHeroVideoMuted] = useState(true);
  const [showcasePaused, setShowcasePaused] = useState(false);

  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  const showcaseVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (active && Array.isArray(data.events)) {
          setEvents(data.events);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      upcoming: 0,
      sold_out: 0,
      completed: 0,
      cancelled: 0,
      all: events.length,
    };
    for (const ev of events) {
      if (counts[ev.status] !== undefined) counts[ev.status] += 1;
    }
    return counts;
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchStatus = statusFilter === 'all' ? true : ev.status === statusFilter;
      const matchEmirate = emirateFilter === 'All' ? true : ev.emirate === emirateFilter;
      return matchStatus && matchEmirate;
    });
  }, [events, statusFilter, emirateFilter]);

  const toggleHeroAudio = () => {
    if (!heroVideoRef.current) return;
    heroVideoRef.current.muted = !heroVideoMuted;
    setHeroVideoMuted(!heroVideoMuted);
  };

  const toggleShowcasePlayback = () => {
    if (!showcaseVideoRef.current) return;
    if (showcaseVideoRef.current.paused) {
      showcaseVideoRef.current.play().catch(() => {});
      setShowcasePaused(false);
    } else {
      showcaseVideoRef.current.pause();
      setShowcasePaused(true);
    }
  };

  return (
    <div className="pt-20 pb-20 bg-[#07050C] min-h-screen text-white">
      <SeoHead
        title="Stranger MeetUps UAE — Vanhsya Social Club"
        description="Come alone. Explore together. Watch our Stranger MeetUps story and browse administrator-verified 18+ gatherings across Dubai, Abu Dhabi, and the UAE."
        path="/meetups"
      />

      {/* Restored Cinematic Video Hero + Scrolling Vertical Marquee */}
      <section className="relative overflow-hidden border-b border-white/10">
        <video
          ref={heroVideoRef}
          autoPlay
          loop
          muted={heroVideoMuted}
          playsInline
          poster="https://thumb.wikimedia.org/wikipedia/commons/thumb/6/61/Dubai_Creek_from_an_abra_3.jpg/1280px-Dubai_Creek_from_an_abra_3.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail"
          className="absolute inset-0 w-full h-full object-cover opacity-35 brightness-75"
          src="https://videos.pexels.com/video-files/3209298/3209298-uhd_2560_1440_25fps.mp4"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07050C]/75 via-[#07050C]/70 to-[#07050C]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-purple-400/35 bg-purple-950/50 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-purple-200">
                {BRAND_CONTACTS.clubName} · {BRAND_CONTACTS.campaignTitle}
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black font-cinzel text-white leading-[0.95] uppercase">
              Stranger <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-white to-cyan-300">
                MeetUps UAE
              </span>
            </h1>

            <p className="text-lg sm:text-2xl text-purple-100/90 font-light max-w-2xl leading-relaxed">
              {BRAND_CONTACTS.tagline} Real-world tables for UAE residents aged 18+ seeking honest human connection, shared city discovery, and zero social pressure.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/social-club"
                className="px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-xl transition-colors"
              >
                Get Founding Member ID
              </Link>
              <a
                href={buildWhatsAppDirectEnquiryUrl(
                  'Hello Vanhsya! I would like to enquire about upcoming Stranger MeetUps or private bookings.'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-400/40 text-emerald-200 text-xs sm:text-sm font-semibold transition-colors"
              >
                WhatsApp Enquiries ({BRAND_CONTACTS.whatsappDisplay})
              </a>
              <button
                type="button"
                onClick={toggleHeroAudio}
                className="px-4 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-mono text-gray-200"
              >
                {heroVideoMuted ? '🔇 Unmute Ambient Film' : '🔊 Mute Film'}
              </button>
            </div>
          </div>

          {/* Restored Scrolling Vertical Photography Gallery (uses @keyframes scroll-up in index.html) */}
          <div className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-4 h-[360px] sm:h-[420px] overflow-hidden rounded-3xl border border-white/10 bg-black/50 p-3 backdrop-blur-md relative">
              <div className="space-y-4 animate-[scroll-up_26s_linear_infinite]">
                {[...MARQUEE_GALLERY, ...MARQUEE_GALLERY].map((item, idx) => (
                  <div key={`col1-${idx}`} className="relative rounded-2xl overflow-hidden h-44 border border-white/10">
                    <img
                      src={item.src}
                      alt={item.caption}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/90 to-transparent">
                      <p className="text-[11px] font-semibold text-white">{item.caption}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 animate-[scroll-up_34s_linear_infinite_reverse] hidden sm:block">
                {[...MARQUEE_GALLERY.slice().reverse(), ...MARQUEE_GALLERY.slice().reverse()].map((item, idx) => (
                  <div key={`col2-${idx}`} className="relative rounded-2xl overflow-hidden h-44 border border-white/10">
                    <img
                      src={item.src}
                      alt={item.caption}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/90 to-transparent">
                      <p className="text-[11px] font-semibold text-white">{item.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#07050C] to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#07050C] to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Administrator-Verified Live Events Schedule (Separated Strictly from Concept Showcase) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 border-b border-white/10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-[0.24em] text-purple-300">
              LIVE VERIFIED CALENDAR
            </p>
            <h2 className="text-3xl sm:text-4xl font-cinzel font-black text-white mt-1">
              Upcoming &amp; Archived Gatherings
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Only administrator-verified events appear below. Drafts and unconfirmed dates are never published.
            </p>
          </div>

          {/* Emirate Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="meetup-emirate-filter" className="text-xs text-gray-400">
              Emirate:
            </label>
            <select
              id="meetup-emirate-filter"
              value={emirateFilter}
              onChange={(e) => setEmirateFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-[#120D1D] border border-white/15 text-xs text-white focus:outline-none focus:border-purple-400"
            >
              <option value="All">All UAE Emirates</option>
              {UAE_EMIRATES.map((em) => (
                <option key={em} value={em}>
                  {em}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Separated Status Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  active
                    ? 'bg-purple-600 border-purple-400 text-white'
                    : 'bg-[#120D1D] border-white/10 text-gray-300 hover:border-purple-400/50'
                }`}
              >
                {tab.label} ({statusCounts[tab.key] || 0})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">
            Loading verified Vanhsya Social Club events...
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <MeetupCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="p-10 rounded-3xl border border-dashed border-purple-500/35 bg-[#120D1D] text-center space-y-4">
            <h3 className="text-xl font-cinzel font-bold text-white">
              No {statusFilter === 'all' ? 'verified' : statusFilter.replace('_', ' ')} events currently listed
            </h3>
            <p className="text-sm text-gray-400 max-w-lg mx-auto">
              We strictly publish events only after venue, host, and capacity verification—never fabricated attendance or unconfirmed placeholder dates. Join the Founding Member list or reach us on WhatsApp ({BRAND_CONTACTS.whatsappDisplay}) to reserve for the next drop.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              {statusFilter !== 'all' && (
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setEmirateFilter('All');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white/10 text-xs font-semibold text-white hover:bg-white/20"
                >
                  Show All Statuses
                </button>
              )}
              <Link
                to="/social-club"
                className="px-5 py-2.5 rounded-xl bg-purple-600 text-xs font-bold text-white hover:bg-purple-500"
              >
                Register for Meetup Alerts
              </Link>
              <Link
                to="/partners/apply"
                className="px-5 py-2.5 rounded-xl border border-white/20 bg-white/5 text-xs font-semibold text-gray-200 hover:bg-white/10"
              >
                Apply to Host a Gathering
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Concept Formats Archive / Original Meetups Experience Archetypes (Clearly Separated from Live Verified Schedule) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 border-b border-white/10">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-[0.26em] text-cyan-400">
              CURATED EXPERIENCE FORMATS
            </span>
            <h2 className="text-3xl sm:text-4xl font-cinzel font-black text-white mt-2">
              How Our Stranger MeetUps Work
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
              Concept formats showcasing the atmosphere of Vanhsya circles. These are format previews—not scheduled dates or active bookings.
            </p>
          </div>
          <Link to="/partners/apply" className="text-xs font-semibold text-purple-300 hover:text-white">
            Propose a Venue or Host Format &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {EXPERIENCE_FORMATS.map((fmt) => (
            <div
              key={fmt.title}
              className="group rounded-3xl overflow-hidden border border-white/10 bg-[#120D1D] flex flex-col shadow-xl"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={fmt.image}
                  alt={fmt.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#120D1D] via-transparent to-black/40" />
                <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${fmt.badgeClass}`}>
                  {fmt.vibe}
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <p className="text-xs text-purple-300 font-semibold">{fmt.emirate} · Concept Format</p>
                <h3 className="text-xl font-cinzel font-bold text-white mt-1.5">{fmt.title}</h3>
                <p className="text-sm text-gray-400 mt-2.5 leading-relaxed flex-1">{fmt.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Restored Host & Storytelling Video Section + Official Channels */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#120D1D] border border-purple-500/25 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <span className="text-xs font-mono font-bold uppercase tracking-[0.28em] text-cyan-400">
              HOST &amp; COMMUNITY STORIES
            </span>
            <h2 className="text-3xl sm:text-5xl font-cinzel font-black text-white leading-tight">
              Host a Curated UAE Gathering
            </h2>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              Venues, coffee roasters, wellness studios, and thoughtful community hosts across the UAE can partner with Vanhsya Social Club to welcome 18+ Founding Members safely.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                to="/partners/apply"
                className="px-6 py-3 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-cyan-300 transition-colors"
              >
                Partner / Host Application
              </Link>
              <a
                href={BRAND_CONTACTS.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl bg-white/5 border border-white/15 text-white hover:bg-white/10 text-xs font-semibold"
              >
                Follow {BRAND_CONTACTS.instagramHandle}
              </a>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl">
              <video
                ref={showcaseVideoRef}
                autoPlay
                loop
                muted
                playsInline
                poster="https://thumb.wikimedia.org/wikipedia/commons/thumb/5/50/Al_Fahidi_Historical_Neighborhood_02.jpg/1280px-Al_Fahidi_Historical_Neighborhood_02.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail"
                className="w-full h-full object-cover brightness-75"
                src="https://videos.pexels.com/video-files/3195650/3195650-uhd_2560_1440_25fps.mp4"
              />
              <button
                type="button"
                onClick={toggleShowcasePlayback}
                aria-label={showcasePaused ? 'Play showcase video' : 'Pause showcase video'}
                className="absolute bottom-4 right-4 px-3.5 py-2 rounded-xl bg-black/75 hover:bg-black border border-white/20 text-xs font-mono text-white backdrop-blur-md"
              >
                {showcasePaused ? '▶ Play Film' : '❚❚ Pause Film'}
              </button>
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-black/70 border border-white/15 text-[10px] font-mono text-purple-200">
                <img
                  src={BRAND_CONTACTS.instagramQrPath}
                  alt="Instagram QR"
                  className="w-5 h-5 rounded object-cover"
                />
                <span>{BRAND_CONTACTS.instagramHandle} · {BRAND_CONTACTS.websiteDisplay}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MeetupsPage;
