import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TOURS_DATA } from '../constants';
import TourCard from '../components/TourCard';
import MeetupCard from '../components/MeetupCard';
import { useAppContext } from '../contexts/AppContext';
import AnimateOnScroll from '../components/AnimateOnScroll';
import InteractiveMap from '../components/InteractiveMap';
import SeoHead from '../components/SeoHead';
import { MapMarkerData, SocialEvent } from '../types';
import { BRAND_CONTACTS, buildWhatsAppDirectEnquiryUrl } from '../utils/utm';

const heroImages = [
  '/assets/aistudio/image_db0af920.png',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/48/Burj_Khalifa_from_the_sea%2C_Dubai.jpg/1280px-Burj_Khalifa_from_the_sea%2C_Dubai.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b5/Reflet-tour-Eiffel-Paris-Luc-Viatour.jpg/1280px-Reflet-tour-Eiffel-Paris-Luc-Viatour.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9d/Golden_Pavilion%2C_Kinkaku-ji%2C_Kyoto%2C_20240820_1523_5130.jpg/1280px-Golden_Pavilion%2C_Kinkaku-ji%2C_Kyoto%2C_20240820_1523_5130.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c7/Gullfoss%2C_Iceland%2C_20230501_0949_3809.jpg/1280px-Gullfoss%2C_Iceland%2C_20230501_0949_3809.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
];

const VisionCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({
  icon,
  title,
  description,
}) => (
  <div
    className="p-8 rounded-3xl border transition-all duration-500 h-full hover:border-purple-400/40 hover:bg-white/5"
    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
  >
    <div
      className="flex items-center justify-center h-14 w-14 rounded-2xl mb-6"
      style={{ backgroundColor: 'rgba(138, 43, 226, 0.16)', color: 'var(--accent-secondary)' }}
    >
      {icon}
    </div>
    <h3 className="text-2xl font-black mb-3 font-cinzel tracking-tight" style={{ color: 'var(--text-primary)' }}>
      {title}
    </h3>
    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
      {description}
    </p>
  </div>
);

const SocialIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.274-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.274.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PlannerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h8a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.886 21h8.228M12 21a9 9 0 110-18 9 9 0 010 18z" />
  </svg>
);

const CheckmarkIcon = () => (
  <div className="flex-shrink-0 h-11 w-11 rounded-full flex items-center justify-center mr-4 bg-white/5 border border-white/10">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  </div>
);

const HomePage: React.FC = () => {
  const { currency, theme } = useAppContext();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [verifiedEvents, setVerifiedEvents] = useState<SocialEvent[]>([]);
  const heroRef = useRef<HTMLElement>(null);

  const featuredTour = useMemo(() => TOURS_DATA.find((t) => t.slug === 'dubai-desert-safari'), []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (active && Array.isArray(data.events)) {
          setVerifiedEvents(data.events.filter((e: SocialEvent) => e.status === 'upcoming').slice(0, 3));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!heroRef.current) return;
    const { width, height, left, top } = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    setParallax({ x, y });
  };

  const handleMouseLeave = () => {
    setParallax({ x: 0, y: 0 });
  };

  const mapMarkers: MapMarkerData[] = useMemo(() => {
    const buttonBgColor = theme === 'dark' ? '#8A2BE2' : '#4F46E5';
    return TOURS_DATA.map((tour) => ({
      lat: tour.latitude,
      lng: tour.longitude,
      popupContent: `
        <div style="font-family: Inter, sans-serif; color: #1E293B;">
          <h3 style="font-weight: bold; margin-bottom: 4px; font-size: 16px;">${tour.title}</h3>
          <a href="#/tours/${tour.slug}"
             style="display: inline-block; background-color: ${buttonBgColor}; color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">
             View Details
          </a>
        </div>
      `,
    }));
  }, [theme]);

  return (
    <div className="pt-20">
      <SeoHead
        title="Vanhsya Social Club & Global Travels — Life Begins With a Hello"
        description="Come alone. Explore together. Join UAE's 18+ social club for verified Stranger MeetUps alongside Vanhsya Global Travels AI Planner and VR Experience."
        path="/"
      />

      {/* Hero Section */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative text-center py-20 lg:py-36 px-4 min-h-[82vh] flex items-center justify-center overflow-hidden"
      >
        <div
          className="absolute inset-[-20px] transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(${parallax.x * 20}px) translateY(${parallax.y * 20}px)`,
          }}
        >
          {heroImages.map((src, index) => (
            <img
              key={src}
              src={src}
              alt={`Vanhsya destination backdrop ${index + 1}`}
              className={`hero-bg-image-instance ${index === currentImageIndex ? 'active' : ''} absolute inset-0 w-full h-full object-cover`}
              referrerPolicy="no-referrer"
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0812] via-[#0A0812]/55 to-black/50" />
        <div
          className="relative z-10 transition-transform duration-300 ease-out max-w-4xl mx-auto"
          style={{
            transform: `translateX(${parallax.x * -30}px) translateY(${parallax.y * -30}px)`,
          }}
        >
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.28em] text-purple-300 mb-4">
            {BRAND_CONTACTS.clubName} · {BRAND_CONTACTS.companyName}
          </p>
          <h1
            className="text-4xl sm:text-6xl md:text-8xl font-extrabold text-white font-cinzel tracking-wide drop-shadow-lg"
            style={{ textShadow: '0 2px 24px rgba(0,0,0,0.85)' }}
          >
            Life Begins <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-white to-purple-400">
              With a Hello
            </span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-2xl text-gray-100 font-light">
            {BRAND_CONTACTS.tagline} Curated 18+ Stranger MeetUps in the UAE & intelligent global travel blueprints.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/social-club"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-wider text-xs sm:text-sm shadow-xl transition-all"
            >
              Join Vanhsya Social Club (UAE 18+)
            </Link>
            <Link
              to="/book"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider text-xs sm:text-sm shadow-xl transition-all"
            >
              Book Travel, Flights &amp; Concierge
            </Link>
            <Link
              to="/ventures"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold uppercase tracking-wider text-xs sm:text-sm backdrop-blur-md transition-all"
            >
              Ventures, Surprises &amp; Couples
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 z-20 hero-progress-bar bg-white/15">
          <div className="h-full bg-purple-400" />
        </div>
      </section>

      {/* Dedicated Vanhsya Social Club Community Section */}
      <section className="py-20 bg-gradient-to-b from-[#0E0A18] to-[#0A0812] border-y border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5">
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-purple-300">
                {BRAND_CONTACTS.clubName} · {BRAND_CONTACTS.audienceNote}
              </p>
              <h2 className="text-3xl sm:text-5xl font-black font-cinzel text-white leading-tight">
                {BRAND_CONTACTS.campaignTitle}
              </h2>
              <p className="text-lg text-purple-200 font-medium">
                {BRAND_CONTACTS.tagline}
              </p>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-2xl">
                Stepping into a new city or routine should never feel isolating. Vanhsya Social Club hosts verified small-group Stranger MeetUps across Dubai, Abu Dhabi, Sharjah, and the Northern Emirates—designed so solo attendees arrive comfortably and leave with real friendships.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
                <div className="p-4 rounded-2xl bg-[#150F24] border border-purple-500/20">
                  <p className="font-bold text-white">Founding Member ID</p>
                  <p className="text-gray-400 mt-1">Instant digital ID card & QR check-in pass.</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#150F24] border border-purple-500/20">
                  <p className="font-bold text-white">Admin-Verified Only</p>
                  <p className="text-gray-400 mt-1">Every meetup date & venue is confirmed before listing.</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#150F24] border border-purple-500/20">
                  <p className="font-bold text-white">Consent-First Alerts</p>
                  <p className="text-gray-400 mt-1">Opt-in email & WhatsApp updates only when you choose.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  to="/social-club"
                  className="px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold uppercase tracking-wider"
                >
                  Claim Founding Member Pass
                </Link>
                <Link
                  to="/meetups"
                  className="px-6 py-3.5 rounded-xl bg-white/5 border border-white/20 hover:bg-white/10 text-white text-xs sm:text-sm font-semibold"
                >
                  Browse Verified MeetUps &rarr;
                </Link>
              </div>
            </div>

            {/* Official Instagram QR & Direct Contacts Card */}
            <div className="lg:col-span-5">
              <div className="p-6 sm:p-8 rounded-3xl bg-[#140F22] border border-purple-400/30 shadow-2xl flex flex-col sm:flex-row lg:flex-col items-center gap-6 text-center">
                <a
                  href={BRAND_CONTACTS.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-44 h-44 rounded-2xl overflow-hidden bg-white p-1.5 shadow-xl border border-white/30"
                >
                  <img
                    src={BRAND_CONTACTS.instagramQrPath}
                    alt="Scan official @vanhsyatravels Instagram QR code"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </a>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300">
                    Connect With Vanhsya
                  </p>
                  <h3 className="text-xl font-cinzel font-bold text-white">
                    {BRAND_CONTACTS.instagramHandle}
                  </h3>
                  <p className="text-xs text-gray-300">
                    Scan for Instagram stories, venue drops, and Founding Member spotlights.
                  </p>
                  <div className="pt-2 flex flex-wrap justify-center gap-2.5 text-xs">
                    <a
                      href={buildWhatsAppDirectEnquiryUrl('Hello Vanhsya Global Travels, I would like to enquire about bookings & upcoming UAE meetups.')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                    >
                      WhatsApp {BRAND_CONTACTS.whatsappDisplay}
                    </a>
                    <a
                      href={BRAND_CONTACTS.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                    >
                      Follow Instagram
                    </a>
                    <a
                      href={BRAND_CONTACTS.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold"
                    >
                      {BRAND_CONTACTS.websiteDisplay}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Verified Upcoming Events Preview */}
          <div className="pt-6 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
              <div>
                <h3 className="text-2xl font-cinzel font-bold text-white">
                  Verified UAE Gatherings
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Live administrator-verified schedule · Updated in real time
                </p>
              </div>
              <Link to="/meetups" className="text-xs font-semibold text-purple-300 hover:text-white">
                View All Verified Events &rarr;
              </Link>
            </div>

            {verifiedEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {verifiedEvents.map((ev) => (
                  <MeetupCard key={ev.id} event={ev} />
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-dashed border-purple-500/30 bg-[#120E1D] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-sm font-semibold text-white">
                    New UAE meetup dates are published only after venue & host verification.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Join the Founding Member directory to get first notice via email or WhatsApp.
                  </p>
                </div>
                <Link
                  to="/social-club"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shrink-0"
                >
                  Notify Me First
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Dubai Signature Experience */}
      {featuredTour && (
        <section className="py-16 lg:py-28 featured-adventure-bg">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-10 lg:gap-20 items-center">
              <AnimateOnScroll>
                <div className="relative group overflow-hidden rounded-3xl shadow-2xl">
                  <div className="relative rounded-2xl overflow-hidden">
                    <img
                      src={featuredTour.images[0]}
                      alt={featuredTour.title}
                      className="w-full aspect-[4/3] object-cover featured-image-anim"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </AnimateOnScroll>
              <AnimateOnScroll delay="150ms" className="featured-content-anim">
                <div className="relative z-10">
                  <span
                    className="text-xs font-bold uppercase tracking-[0.3em] border-b-2 pb-1.5"
                    style={{ color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}
                  >
                    UAE Signature Expedition
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black mt-5 font-cinzel tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {featuredTour.title}
                  </h2>
                  <p className="mt-6 text-lg leading-relaxed font-light" style={{ color: 'var(--text-secondary)' }}>
                    {featuredTour.description}
                  </p>
                  <div className="mt-8 space-y-4">
                    <div className="flex items-center p-4 rounded-2xl bg-[var(--bg-primary)] border border-white/10">
                      <CheckmarkIcon />
                      <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                          Red Dune Adventure
                        </h4>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          4x4 desert drive followed by sunset photography & camp dinner.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center p-4 rounded-2xl bg-[var(--bg-primary)] border border-white/10">
                      <CheckmarkIcon />
                      <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                          Interactive VR Preview Available
                        </h4>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Preview routes in our 3D VR globe before you depart.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/tours/${featuredTour.slug}`}
                    className="mt-8 inline-block text-white font-bold py-4 px-10 rounded-xl transition-all uppercase tracking-wider text-xs"
                    style={{ backgroundColor: 'var(--accent-secondary)' }}
                  >
                    Explore Itinerary
                  </Link>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>
      )}

      {/* Global Travel Catalogue */}
      <section className="py-20 bg-[#0A0812]">
        <div className="max-w-7xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-purple-300">
                  Vanhsya Travel Catalogue
                </p>
                <h2 className="text-3xl md:text-5xl font-black font-cinzel text-white tracking-tight mt-1">
                  Curated Global Experiences
                </h2>
              </div>
              <Link
                to="/ai-planner"
                className="px-6 py-3 bg-white/5 border border-white/15 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-purple-600 transition-all text-white"
              >
                Build Custom Itinerary With AI &rarr;
              </Link>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {TOURS_DATA.filter((t) => t.slug !== 'dubai-desert-safari').map((tour, index) => (
              <AnimateOnScroll key={tour.id} delay={`${index * 60}ms`}>
                <TourCard tour={tour} currency={currency} />
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-24 bg-[#07050D] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-14">
              <span className="text-xs font-bold uppercase tracking-[0.35em] text-purple-300">
                Global Destination Grid
              </span>
              <h2 className="text-3xl md:text-5xl font-black font-cinzel text-white mt-3">
                Explore Our Destinations
              </h2>
              <p className="mt-3 text-gray-400 text-base">
                Select any pin across the UAE and worldwide routes to inspect itineraries.
              </p>
            </div>
            <InteractiveMap centerLat={25} centerLng={35} zoom={2} markers={mapMarkers} />
          </AnimateOnScroll>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-24 bg-[#0A0812] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black font-cinzel text-white">
                Built for Connection & Discovery
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-base text-gray-400">
                Combining offline UAE community hospitality with AI travel planning and immersive VR previews.
              </p>
            </div>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimateOnScroll delay="0ms">
              <VisionCard
                icon={<SocialIcon />}
                title="Vanhsya Social Club"
                description="Verified 18+ UAE gatherings built around welcoming solo arrivals, small-group chemistry, and safe venues."
              />
            </AnimateOnScroll>
            <AnimateOnScroll delay="150ms">
              <VisionCard
                icon={<PlannerIcon />}
                title="AI Travel Architect"
                description="Real-time day-by-day blueprints tailored to your pace, budget, and preferred Emirate or international destination."
              />
            </AnimateOnScroll>
            <AnimateOnScroll delay="300ms">
              <VisionCard
                icon={<GlobeIcon />}
                title="3D VR Globe Experience"
                description="Inspect routes visually with interactive zoom, route paths, and audio concierge guidance before booking."
              />
            </AnimateOnScroll>
          </div>

          {/* Explore Full Vanhsya Ecosystem Links */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/book"
              className="p-5 rounded-2xl bg-[#130E20] border border-emerald-500/25 hover:border-emerald-400/60 transition-all group"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                Travel Hub
              </p>
              <h3 className="text-lg font-cinzel font-bold text-white mt-1 group-hover:text-emerald-200">
                Book Travel &amp; Flight Desks &rarr;
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Live package checkout, flight pre-booking, hotels &amp; intercity coach requests.
              </p>
            </Link>

            <Link
              to="/ventures"
              className="p-5 rounded-2xl bg-[#130E20] border border-amber-500/25 hover:border-amber-400/60 transition-all group"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">
                Ventures &amp; Lifestyle
              </p>
              <h3 className="text-lg font-cinzel font-bold text-white mt-1 group-hover:text-amber-200">
                Invest, Franchises &amp; Surprises &rarr;
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Smart kiosks, business hub spots, charity merch, birthday surprises &amp; couples thrill nights.
              </p>
            </Link>

            <Link
              to="/treasure-hunt"
              className="p-5 rounded-2xl bg-[#130E20] border border-purple-500/25 hover:border-cyan-400/50 transition-all group"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                The Blueprint
              </p>
              <h3 className="text-lg font-cinzel font-bold text-white mt-1 group-hover:text-cyan-200">
                Explore Quests &rarr;
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Interactive UAE mission clues and Half-Detail discovery routes.
              </p>
            </Link>

            <Link
              to="/meetups"
              className="p-5 rounded-2xl bg-[#130E20] border border-purple-500/25 hover:border-purple-400/60 transition-all group"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-purple-300">
                Stranger MeetUps
              </p>
              <h3 className="text-lg font-cinzel font-bold text-white mt-1 group-hover:text-purple-200">
                Live Gatherings &rarr;
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Verified UAE 18+ social meetups, hosts, and downloadable flyers.
              </p>
            </Link>

            <Link
              to="/vr-experience"
              className="p-5 rounded-2xl bg-[#130E20] border border-purple-500/25 hover:border-purple-400/60 transition-all group"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-purple-300">
                VR Globe
              </p>
              <h3 className="text-lg font-cinzel font-bold text-white mt-1 group-hover:text-purple-200">
                Launch 3D Atlas &rarr;
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Zoomable 3D orbital destination routes and visual previews.
              </p>
            </Link>

            <Link
              to="/vyno"
              className="p-5 rounded-2xl bg-[#130E20] border border-purple-500/25 hover:border-cyan-400/50 transition-all group"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                Web3 Console
              </p>
              <h3 className="text-lg font-cinzel font-bold text-white mt-1 group-hover:text-cyan-200">
                Wallet Verification &rarr;
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Connect MetaMask via ethers.js for signature &amp; tx verification.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
