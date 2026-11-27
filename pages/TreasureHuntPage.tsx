import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AnimateOnScroll from '../components/AnimateOnScroll';
import SeoHead from '../components/SeoHead';
import { BRAND_CONTACTS, buildWhatsAppDirectEnquiryUrl } from '../utils/utm';

interface MissionRoute {
  id: string;
  code: string;
  emirate: string;
  title: string;
  distance: string;
  estimatedTime: string;
  squadSize: string;
  atmosphere: string;
  image: string;
  clueA: { role: string; text: string };
  clueB: { role: string; text: string };
  checkpointHint: string;
}

const BLUEPRINT_ROUTES: MissionRoute[] = [
  {
    id: 'dubai-creek-cipher',
    code: 'NODE // DXB-01',
    emirate: 'Dubai',
    title: 'Old Dubai Creek & Al Fahidi Cipher',
    distance: '3.8 km Urban Loop',
    estimatedTime: '2.5 hrs',
    squadSize: '4–6 Explorers',
    atmosphere: 'Windtowers, brass souk alleys & abra crossings',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d0/Palm_Atlantis_Monorail_Station.jpg/1280px-Palm_Atlantis_Monorail_Station.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    clueA: {
      role: 'Nav Lead (Half-Clue A)',
      text: 'Count the wind-tower louvers above the northern courtyard arch nearest the Textile Abra Pier.',
    },
    clueB: {
      role: 'Signal Decoder (Half-Clue B)',
      text: 'Combine the numeral with the carved cedar door engraving three alleys west of the museum gate.',
    },
    checkpointHint: 'Requires two solo teammates standing at opposite ends of the lane to sync the final passphrase.',
  },
  {
    id: 'rak-jebel-jais',
    code: 'NODE // RAK-02',
    emirate: 'Ras Al Khaimah',
    title: 'Hajar Ridge Twilight Telemetry',
    distance: '6.2 km Canyon Trail',
    estimatedTime: '3.5 hrs',
    squadSize: '4–8 Explorers',
    atmosphere: 'High-altitude limestone hairpins & twilight camp overlooks',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/03/Rock_formation_at_Jebel_Jais_mountains%2C_Ras_Al_Khaimah%2C_UAE.jpg/1280px-Rock_formation_at_Jebel_Jais_mountains%2C_Ras_Al_Khaimah%2C_UAE.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    clueA: {
      role: 'Spotter (Half-Clue A)',
      text: 'Locate the elevation marker plaque facing the western gulf silhouette at viewing deck 3.',
    },
    clueB: {
      role: 'Archivist (Half-Clue B)',
      text: 'Cross-reference the compass bearing against the dry wadi cairn marker at the first rest bend.',
    },
    checkpointHint: 'Designed for sunset briefing followed by stargazing debrief at basecamp.',
  },
  {
    id: 'abudhabi-cultural-axis',
    code: 'NODE // AUH-03',
    emirate: 'Abu Dhabi',
    title: 'Qasr Al Hosn to Louvre Meridian',
    distance: '5.1 km Coastal Route',
    estimatedTime: '3 hrs',
    squadSize: '4–6 Explorers',
    atmosphere: 'Coral-stone fortress courtyards & coastal museum dome shadows',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/01/Qasr_Al_Hosn_in_Front_of_skyline.jpg/1280px-Qasr_Al_Hosn_in_Front_of_skyline.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    clueA: {
      role: 'Vanguard (Half-Clue A)',
      text: 'Read the founding inscription on the outer watchtower bastion overlooking the palm square.',
    },
    clueB: {
      role: 'Cipher (Half-Clue B)',
      text: 'Align the latitude line stamped along the waterfront promenade beneath the pierced dome.',
    },
    checkpointHint: 'Half-clues must be spoken aloud in person at the final waterfront checkpoint.',
  },
];

const PROTOCOL_TIERS = [
  {
    level: 'PROTOCOL 111 · ENTRY',
    title: 'The Drifter',
    price: 'AED 111',
    usdPrice: '$30',
    accentBorder: 'border-cyan-500/35',
    accentText: 'text-cyan-400',
    dotBg: 'bg-cyan-400',
    tag: 'Solo Entry',
    tagBg: 'bg-cyan-400 text-black',
    description:
      'Step into your first coordinated city route. Designed for solo UAE newcomers ready to pair up and decode half-clues.',
    features: [
      'Printed & Digital Field Dossier',
      'Half-Clue Squad Pairing (18+)',
      'Standard Waypoint Briefing',
      'Post-Quest Social Lounge Check-In',
    ],
  },
  {
    level: 'PROTOCOL 222 · RECOMMENDED',
    title: 'The Corsair',
    price: 'AED 222',
    usdPrice: '$60',
    accentBorder: 'border-purple-500/60 shadow-[0_25px_70px_-15px_rgba(138,43,226,0.35)]',
    accentText: 'text-purple-300',
    dotBg: 'bg-purple-400',
    tag: 'Recommended',
    tagBg: 'bg-purple-500 text-white',
    featured: true,
    description:
      'Our signature small-group Blueprint extraction with curated cafe stops, multi-stage puzzle relays, and priority table seating.',
    features: [
      'Multi-Stage Half-Clue Relays',
      'Curated Hospitality Refreshments',
      'Squad Captain Kit & Compass Token',
      'Verified Host Route Escort',
      'Priority Access to Next Meetup Drop',
    ],
  },
  {
    level: 'PROTOCOL 333 · PRIVATE CHARTER',
    title: 'The Legend',
    price: 'AED 333',
    usdPrice: '$90',
    accentBorder: 'border-amber-400/40',
    accentText: 'text-amber-300',
    dotBg: 'bg-amber-400',
    tag: 'Full Command',
    tagBg: 'bg-amber-400 text-black',
    description:
      'Private desert or coastal Blueprint charter for custom cohorts, milestone nights, or bespoke corporate offsites in the UAE.',
    features: [
      'Custom Emirate Route Architecture',
      'Dedicated Experience Architect & Host',
      'Private Sunset Lounge Hospitality',
      'Bespoke Printed Invitation Cards',
      'WhatsApp Concierge Support (+971 50 623 0702)',
    ],
  },
];

const DecryptingText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const [display, setDisplay] = useState(text);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#*%&';

  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplay(
        text
          .split('')
          .map((letter, index) => {
            if (letter === ' ' || letter === '•') return letter;
            if (index < iteration) return text[index];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );
      if (iteration >= text.length) clearInterval(interval);
      iteration += 0.5;
    }, 28);
    return () => clearInterval(interval);
  }, [text]);

  return <span className={`font-mono ${className}`}>{display}</span>;
};

const MISSION_STORAGE_KEY = 'vanhsya_blueprint_progress_v1';

const TreasureHuntPage: React.FC = () => {
  const [activeRouteId, setActiveRouteId] = useState<string>(BLUEPRINT_ROUTES[0].id);
  const [revealedClues, setRevealedClues] = useState<Record<string, { a: boolean; b: boolean; completed: boolean }>>(() => {
    try {
      const saved = localStorage.getItem(MISSION_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage failure
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(MISSION_STORAGE_KEY, JSON.stringify(revealedClues));
    } catch {
      // ignore
    }
  }, [revealedClues]);

  const activeRoute = BLUEPRINT_ROUTES.find((r) => r.id === activeRouteId) || BLUEPRINT_ROUTES[0];
  const activeState = revealedClues[activeRoute.id] || { a: false, b: false, completed: false };

  const toggleClue = (routeId: string, field: 'a' | 'b' | 'completed') => {
    setRevealedClues((prev) => {
      const cur = prev[routeId] || { a: false, b: false, completed: false };
      return {
        ...prev,
        [routeId]: { ...cur, [field]: !cur[field] },
      };
    });
  };

  const completedCount = BLUEPRINT_ROUTES.filter((r) => revealedClues[r.id]?.completed).length;

  return (
    <div className="min-h-screen bg-[#05050A] text-gray-200 pt-20 selection:bg-cyan-500 selection:text-black">
      <SeoHead
        title="The Blueprint | Physical Exploration & Half-Clue Quests — Vanhsya"
        description="Explore Vanhsya's original Blueprint tactical city quests across Dubai, Ras Al Khaimah, and Abu Dhabi. Interactive half-clue discovery built for real-world connection."
        path="/treasure-hunt"
      />

      {/* Cinematic Opening Hero */}
      <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden border-b border-white/10 px-4 sm:px-8 py-20">
        <div className="absolute inset-0">
          <img
            src="https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f3/Sheikh_Zayed_Grand_Mosque_in_Abu_Dhabi_-_panoramio.jpg/1280px-Sheikh_Zayed_Grand_Mosque_in_Abu_Dhabi_-_panoramio.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail"
            alt="The Blueprint Tactical Exploration Backdrop"
            className="w-full h-full object-cover opacity-20 contrast-125 scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05050A] via-[#05050A]/70 to-[#090612]/60" />
        </div>

        <div className="relative z-10 text-center max-w-6xl mx-auto flex flex-col items-center">
          <div className="mb-8 inline-flex items-center gap-3 px-6 py-2 rounded-full border border-cyan-500/30 bg-cyan-950/30 backdrop-blur-xl">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_16px_#00f2fe]" />
            <span className="text-cyan-300 text-[11px] font-black uppercase tracking-[0.35em] font-mono">
              THE BLUEPRINT · UAE QUEST ARCHITECTURE
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-[7.5rem] font-black font-cinzel text-white mb-6 tracking-tight leading-[0.88] uppercase drop-shadow-2xl">
            THE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-300 to-purple-400">
              BLUEPRINT
            </span>
          </h1>

          <div className="mb-8 bg-black/75 px-6 sm:px-10 py-3 rounded-full border border-white/10 backdrop-blur-md">
            <DecryptingText
              text="LOYALTY IS LIFE • EXPLORE TOGETHER"
              className="text-xs sm:text-sm text-cyan-200 tracking-[0.28em] uppercase"
            />
          </div>

          <p className="text-base sm:text-xl text-gray-300 font-light max-w-3xl mx-auto mb-10 leading-relaxed">
            Hidden architectural routes, two-person half-clue mechanics, and curated desert-to-coast expeditions crafted so solo strangers collaborate in person across the Emirates.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={() => document.getElementById('blueprint-mission-board')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-white text-black font-black uppercase tracking-[0.22em] text-xs rounded-2xl hover:bg-cyan-400 transition-all shadow-2xl"
            >
              Open Mission Board
            </button>
            <a
              href={buildWhatsAppDirectEnquiryUrl('Hi Vanhsya! I would like to book or enquire about The Blueprint UAE Quest Passes (Protocol 111/222/333).')}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-2xl border border-emerald-400/40 bg-emerald-950/35 hover:bg-emerald-900/50 text-emerald-200 font-bold uppercase tracking-[0.18em] text-xs transition-all"
            >
              WhatsApp Quest Desk ({BRAND_CONTACTS.whatsappDisplay})
            </a>
            <Link
              to="/meetups"
              className="px-8 py-4 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-[0.18em] text-xs transition-all"
            >
              Verified MeetUps
            </Link>
          </div>
        </div>

        <div className="hidden lg:block absolute bottom-6 left-8 opacity-40 font-mono text-[10px] text-cyan-300 space-y-1 uppercase tracking-[0.25em]">
          <p>SECTOR: UAE_GRID_07_EMIRATES</p>
          <p>PROTOCOL: HALF_CLUE_COLLABORATION</p>
        </div>
      </section>

      {/* The Unbound Doctrine + Node #0X-DE-01 Scanner Showcase */}
      <section className="py-24 bg-[#07060D] border-b border-white/10 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <AnimateOnScroll>
              <span className="text-xs font-black text-purple-400 uppercase tracking-[0.35em] font-mono block mb-3">
                THE HALF-DETAIL MECHANIC
              </span>
              <h2 className="text-4xl sm:text-6xl font-cinzel font-black text-white leading-[0.95] uppercase">
                No Clue Solves <br />
                <span className="text-cyan-400">Alone</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-300 font-light leading-relaxed border-l-4 border-purple-500 pl-5 mt-6">
                Every participant starts with half of a cipher. You cannot unlock a physical checkpoint without meeting your paired teammate face-to-face, combining observations, and verifying the route together.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-400/40 transition-colors">
                  <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold mb-2">
                    01 · Come Alone
                  </p>
                  <h3 className="font-cinzel font-bold text-white text-lg">Natural Icebreaker</h3>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                    Shared coordinates eliminate awkward small talk—conversation begins with the mission.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-purple-400/40 transition-colors">
                  <p className="text-xs font-mono text-purple-300 uppercase tracking-widest font-bold mb-2">
                    02 · Real Geography
                  </p>
                  <h3 className="font-cinzel font-bold text-white text-lg">Desert to Mountain</h3>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                    Routes celebrate real UAE heritage quarters, coastal promenades, and mountain ridges.
                  </p>
                </div>
              </div>
            </AnimateOnScroll>
          </div>

          <div className="lg:col-span-6">
            <AnimateOnScroll delay="150ms">
              <div className="relative group max-w-lg mx-auto">
                <div className="absolute -inset-6 bg-cyan-500/10 blur-3xl rounded-full opacity-50 group-hover:opacity-80 transition-opacity" />
                <div className="relative rounded-3xl overflow-hidden border border-white/15 aspect-[4/5] shadow-2xl">
                  <img
                    src="https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5a/Rocky_terrain_of_Jebel_Jais_mountains%2C_Ras_Al_Khaimah%2C_UAE.jpg/1280px-Rocky_terrain_of_Jebel_Jais_mountains%2C_Ras_Al_Khaimah%2C_UAE.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail"
                    alt="Target Node #0X-DE-01 Desert Ghost Link"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-6 left-6 right-6 bg-black/85 backdrop-blur-xl border border-cyan-500/35 p-6 rounded-2xl">
                    <p className="text-cyan-400 font-mono text-[11px] uppercase tracking-[0.28em] font-bold mb-1">
                      TARGET NODE: #0X-DE-01
                    </p>
                    <h3 className="text-white font-cinzel font-black text-2xl uppercase">
                      Desert Ghost Meridian
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      UAE flagship Blueprint corridor · Physical squad check-in required
                    </p>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Interactive Mission Board & Progressive Challenge Presentation */}
      <section id="blueprint-mission-board" className="py-24 px-4 sm:px-8 bg-[#05050A] border-b border-white/10">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-[0.3em] font-bold">
                INTERACTIVE MISSION BOARD
              </span>
              <h2 className="text-3xl sm:text-5xl font-cinzel font-black text-white mt-2 uppercase">
                Explore Sample Route Concepts
              </h2>
              <p className="text-sm text-gray-400 mt-2 max-w-2xl">
                Test how our Half-Clue discovery mechanics work across three UAE corridors. Progress below is saved locally in your browser; live event dates appear only once administrator-verified.
              </p>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-white/5 border border-cyan-500/30 font-mono text-xs text-cyan-300 shrink-0">
              Training Briefs Completed: <strong className="text-white">{completedCount} / {BLUEPRINT_ROUTES.length}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Route selector list */}
            <div className="lg:col-span-4 space-y-3">
              {BLUEPRINT_ROUTES.map((route) => {
                const isSelected = route.id === activeRoute.id;
                const isDone = Boolean(revealedClues[route.id]?.completed);
                return (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => setActiveRouteId(route.id)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-[#111222] border-cyan-400/60 shadow-[0_0_25px_rgba(0,242,254,0.12)]'
                        : 'bg-[#0C0B14] border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                      <span className="text-cyan-400 font-bold">{route.code}</span>
                      {isDone ? (
                        <span className="text-emerald-300 font-bold">✓ BRIEFED</span>
                      ) : (
                        <span className="text-gray-400">{route.emirate}</span>
                      )}
                    </div>
                    <h3 className="font-cinzel font-bold text-white text-base">{route.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {route.distance} · {route.estimatedTime}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Active interactive mission card */}
            <div className="lg:col-span-8 rounded-3xl overflow-hidden border border-white/15 bg-[#0D0C17] shadow-2xl">
              <div className="relative h-56 sm:h-64 overflow-hidden">
                <img
                  src={activeRoute.image}
                  alt={activeRoute.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0C17] via-black/40 to-transparent" />
                <div className="absolute bottom-5 left-6 right-6 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-mono text-cyan-300 uppercase tracking-widest font-bold">
                      {activeRoute.code} · {activeRoute.emirate}
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-cinzel font-black text-white mt-1">
                      {activeRoute.title}
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-black/70 border border-white/15 text-xs font-mono text-purple-200">
                    {activeRoute.squadSize}
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Environment:</strong> {activeRoute.atmosphere}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Clue A */}
                  <div className="p-5 rounded-2xl bg-black/45 border border-cyan-500/25 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase text-cyan-300 font-bold">
                        {activeRoute.clueA.role}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleClue(activeRoute.id, 'a')}
                        className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-[11px] font-mono text-cyan-200"
                      >
                        {activeState.a ? 'Hide Half-Clue' : 'Reveal Half-Clue A'}
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-200 leading-relaxed min-h-[3.25rem]">
                      {activeState.a
                        ? activeRoute.clueA.text
                        : '████████ ███ ██████ — Tap "Reveal Half-Clue A" to preview teammate 1 instructions.'}
                    </p>
                  </div>

                  {/* Clue B */}
                  <div className="p-5 rounded-2xl bg-black/45 border border-purple-500/25 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase text-purple-300 font-bold">
                        {activeRoute.clueB.role}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleClue(activeRoute.id, 'b')}
                        className="px-3 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-[11px] font-mono text-purple-200"
                      >
                        {activeState.b ? 'Hide Half-Clue' : 'Reveal Half-Clue B'}
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-200 leading-relaxed min-h-[3.25rem]">
                      {activeState.b
                        ? activeRoute.clueB.text
                        : '████████ ███ ██████ — Tap "Reveal Half-Clue B" to preview teammate 2 instructions.'}
                    </p>
                  </div>
                </div>

                {activeState.a && activeState.b && (
                  <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-400/35 text-xs text-cyan-100 animate-fadeIn">
                    <strong className="font-mono uppercase text-cyan-300">Combined Check-In Protocol:</strong>{' '}
                    {activeRoute.checkpointHint}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => toggleClue(activeRoute.id, 'completed')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                      activeState.completed
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                        : 'bg-white/5 border-white/20 text-white hover:bg-white/10'
                    }`}
                  >
                    {activeState.completed ? '✓ Marked Briefing Reviewed' : 'Mark Briefing Reviewed'}
                  </button>

                  <a
                    href={buildWhatsAppDirectEnquiryUrl(
                      `Hi Vanhsya! I want to enquire about the Blueprint route: ${activeRoute.title} (${activeRoute.emirate}).`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-emerald-300 hover:text-emerald-200 underline"
                  >
                    Enquire for Private Squad Date via WhatsApp &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Protocol 111 / 222 / 333 Access Cards + Compliance Boundary */}
      <section className="py-24 px-4 sm:px-8 bg-[#07060D] border-b border-white/10 relative">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')" }}
        />
        <div className="max-w-7xl mx-auto relative z-10 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-[0.35em] text-cyan-400">
              SELECT YOUR QUEST PROTOCOL
            </span>
            <h2 className="text-4xl sm:text-6xl font-cinzel font-black text-white uppercase">
              Protocol 111 · 222 · 333
            </h2>
            <p className="text-sm sm:text-base text-gray-400">
              Choose your Blueprint physical quest pass format. Reserve enquiries directly via WhatsApp (+971 50 623 0702) or join Vanhsya Social Club for scheduled UAE releases.
            </p>
          </div>

          <div className="max-w-4xl mx-auto p-5 rounded-2xl border border-amber-500/35 bg-amber-950/20 text-xs sm:text-sm text-amber-100 leading-relaxed">
            <strong className="font-mono uppercase text-amber-300 block mb-1">
              Compliance Review Gate
            </strong>
            Crypto prize pools, token airdrops, and staking promotions remain disabled pending a separate compliance review. Protocols 111, 222, and 333 represent physical UAE Social Club quest formats only.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {PROTOCOL_TIERS.map((tier) => (
              <div
                key={tier.title}
                className={`relative p-8 rounded-3xl border bg-[#110E1D] flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1 ${tier.accentBorder} ${
                  tier.featured ? 'md:-translate-y-3' : ''
                }`}
              >
                {tier.tag && (
                  <span
                    className={`absolute top-0 right-6 px-4 py-1.5 rounded-b-xl text-[10px] font-black uppercase tracking-wider ${tier.tagBg}`}
                  >
                    {tier.tag}
                  </span>
                )}
                <div>
                  <p className={`text-[11px] font-mono uppercase tracking-[0.25em] font-bold mb-2 ${tier.accentText}`}>
                    {tier.level}
                  </p>
                  <h3 className="text-3xl font-cinzel font-black text-white mb-3">{tier.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-6">{tier.description}</p>

                  <div className="mb-6 p-5 rounded-2xl bg-black/60 border border-white/10 text-center">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl font-black text-white font-mono">{tier.price}</span>
                      <span className="text-xs text-gray-400 font-mono">/ {tier.usdPrice}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 text-xs sm:text-sm text-gray-300">
                    {tier.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-3">
                        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${tier.dotBg}`} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href={buildWhatsAppDirectEnquiryUrl(
                    `Hello Vanhsya! I would like to enquire about booking ${tier.title} (${tier.price}) for The Blueprint UAE Quest.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-full text-center py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors ${
                    tier.featured
                      ? 'bg-white text-black hover:bg-cyan-300'
                      : 'border border-white/20 text-white hover:bg-white hover:text-black'
                  }`}
                >
                  Enquire on WhatsApp →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vanhsya Social Club Integration */}
      <section className="py-20 px-4 sm:px-8 text-center">
        <div className="max-w-4xl mx-auto p-10 rounded-3xl border border-purple-500/25 bg-[#120E1E] space-y-5">
          <p className="text-xs font-mono uppercase tracking-[0.28em] text-purple-300">
            {BRAND_CONTACTS.clubName} · {BRAND_CONTACTS.campaignTitle}
          </p>
          <h2 className="text-3xl sm:text-4xl font-cinzel font-black text-white">
            Join the Next Verified UAE Quest Drop
          </h2>
          <p className="text-sm text-gray-300 max-w-xl mx-auto">
            Register your 18+ Founding Member Pass to get notified as soon as administrators verify and publish the next physical Blueprint route date.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              to="/social-club"
              className="px-7 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider"
            >
              Claim Founding Member Pass
            </Link>
            <Link
              to="/vyno"
              className="px-7 py-3.5 rounded-xl border border-cyan-500/40 bg-cyan-950/25 text-cyan-200 hover:bg-cyan-950/50 font-bold text-xs uppercase tracking-wider"
            >
              Web3 Verification Console
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TreasureHuntPage;
