
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TOURS_DATA } from '../constants';
import TourCard from '../components/TourCard';
import { useAppContext } from '../contexts/AppContext';
import AnimateOnScroll from '../components/AnimateOnScroll';
import InteractiveMap from '../components/InteractiveMap';
import { MapMarkerData, Tour } from '../types';

const heroImages = [
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop', // Mountains/Global
  'https://images.unsplash.com/photo-1542139366-1169a53315a1?q=80&w=1974&auto=format&fit=crop', // Abu Dhabi
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2070&auto=format&fit=crop', // Paris
  'https://images.unsplash.com/photo-1528164344705-47542687000d?q=80&w=2092&auto=format&fit=crop', // Japan
  'https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=2070&auto=format&fit=crop', // Safari
  'https://images.unsplash.com/photo-1476610182048-b716b8518aae?q=80&w=2070&auto=format&fit=crop', // Iceland
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop', // Tropical Beach
];


const StatCounter: React.FC<{ target: number, isDecimal?: boolean, suffix?: string, prefix?: string }> = ({ target, isDecimal = false, suffix = "", prefix = "" }) => {
  const ref = React.useRef<HTMLParagraphElement>(null);
  
  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        let frame = 0;
        const duration = 2000;
        const frameDuration = 1000 / 60;
        const totalFrames = Math.round(duration / frameDuration);
        
        const counter = setInterval(() => {
          frame++;
          const progress = frame / totalFrames;
          const current = target * progress;
          
          if (frame === totalFrames) {
            clearInterval(counter);
            element.textContent = prefix + target.toLocaleString() + suffix;
          } else {
            if (isDecimal) {
              element.textContent = prefix + current.toFixed(1) + suffix;
            } else {
              element.textContent = prefix + Math.round(current).toLocaleString() + suffix;
            }
          }
        }, frameDuration);
        observer.unobserve(element);
      }
    }, { threshold: 0.5 });

    observer.observe(element);
    
    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [target, isDecimal, suffix, prefix]);

  return <p ref={ref} className="text-4xl lg:text-5xl font-black mb-2" style={{ color: 'var(--accent-secondary)'}}>0</p>;
};

const VisionCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="p-8 rounded-3xl border transition-all duration-500 h-full hover:border-[var(--accent-primary)]/40 hover:bg-white/5 hover:shadow-2xl hover:shadow-[var(--shadow-color-primary)]/10" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)'}}>
      <div className="flex items-center justify-center h-14 w-14 rounded-2xl mb-6 shadow-lg shadow-purple-500/10" style={{ backgroundColor: 'rgba(138, 43, 226, 0.15)', color: 'var(--accent-secondary)'}}>
        {icon}
      </div>
      <h3 className="text-2xl font-black mb-3 font-cinzel tracking-tight" style={{ color: 'var(--text-primary)'}}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)'}}>{description}</p>
  </div>
);

const BlockchainIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /><path d="M4 12h16" /><path d="M12 4v16" /></svg>;
const CommunityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.274-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.274.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const RealWorldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h8a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.886 21h8.228M12 21a9 9 0 110-18 9 9 0 010 18z" /></svg>;

const CheckmarkIcon = () => (
    <div className="flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center mr-4 bg-white/5 border border-white/5" style={{ borderColor: 'var(--border-color)' }}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" style={{color: 'var(--accent-primary)'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    </div>
);


const HomePage: React.FC = () => {
  const { currency, theme } = useAppContext();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLElement>(null);
  
  const featuredTour = useMemo(() => TOURS_DATA.find(t => t.slug === 'dubai-desert-safari'), []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 8000);
    return () => clearInterval(timer);
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
    const buttonBgColor = theme === 'dark' ? '#00F2FE' : '#2563EB'; // Corresponds to --accent-primary
    return TOURS_DATA.map(tour => ({
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
      `
    }));
  }, [theme]);

  return (
    <div className="pt-24">
      {/* Hero Section */}
      <section 
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative text-center py-20 lg:py-40 px-4 h-[85vh] flex items-center justify-center overflow-hidden"
      >
        <div 
          className="absolute inset-[-20px] transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(${parallax.x * 20}px) translateY(${parallax.y * 20}px)`
          }}
        >
          {heroImages.map((src, index) => (
            <div
              key={src}
              className={`hero-bg-image-instance ${index === currentImageIndex ? 'active' : ''}`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/30"></div>
        <div 
          className="relative z-10 transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(${parallax.x * -40}px) translateY(${parallax.y * -40}px)`
          }}
        >
          <h1 className="text-5xl md:text-8xl font-extrabold text-white font-cinzel tracking-wider drop-shadow-lg animate-hero-text" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}>
            <span style={{ animationDelay: '0.2s' }}>Explore</span>{' '}
            <span className="text-[var(--accent-primary)]" style={{ animationDelay: '0.4s', textShadow: '0 0 20px var(--shadow-color-primary)' }}>The World</span>
            <br />
            <span style={{ animationDelay: '0.6s' }}>& Beyond</span>
          </h1>
          <div className="mt-8 max-w-2xl mx-auto text-xl text-gray-100 animate-hero-text font-light">
            <span style={{ animationDelay: '0.8s' }}>Curated adventures for the modern explorer. From the deserts of Dubai to the glaciers of Iceland.</span>
          </div>
          <div className="mt-12 animate-hero-text">
            <span style={{ animationDelay: '1.0s' }}>
              <Link to="/ai-planner" className="inline-block text-black font-black uppercase tracking-widest text-sm py-5 px-12 rounded-full transition-all transform hover:scale-110 animate-button-glow hover:shadow-[0_0_30px_rgba(0,242,254,0.5)]" style={{ backgroundColor: 'var(--accent-primary)' }}>
                Plan Your Journey
              </Link>
            </span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 z-20 hero-progress-bar bg-white/20">
            <div className="h-full bg-[var(--accent-primary)]"></div>
        </div>
      </section>

      {/* Winter Promo Section */}
      <section className="bg-gradient-to-r from-blue-900 to-indigo-900 py-5 relative overflow-hidden border-y border-blue-500/30">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/snow.png')]"></div>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between relative z-10">
            <div className="flex items-center mb-3 md:mb-0">
                <span className="text-4xl mr-4 animate-bounce">❄️</span>
                <div>
                    <h3 className="font-black text-white text-xl uppercase tracking-tighter">Winter Wanderlust Protocol</h3>
                    <p className="text-blue-200 text-sm font-medium">New explorers get <span className="text-white font-black">$50 / 185 AED OFF</span> their first expedition.</p>
                </div>
            </div>
            <div className="flex items-center gap-5">
                 <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-xl text-sm font-mono text-blue-200 border border-blue-400/30">
                    ACCESS_KEY: <span className="text-white font-black">VANHSYA24</span>
                 </div>
                 <Link to="/ai-planner" className="text-sm font-black text-white hover:text-blue-300 transition-colors uppercase tracking-[0.2em]">Book Now &rarr;</Link>
            </div>
        </div>
      </section>

      {/* Top Adventure Section */}
      {featuredTour && (
        <section className="py-16 lg:py-32 featured-adventure-bg">
          <div className="max-w-7xl mx-auto px-4">
              <div className="grid md:grid-cols-2 gap-10 lg:gap-24 items-center">
                <AnimateOnScroll>
                  <div className="relative group overflow-hidden rounded-3xl transform rotate-1 hover:rotate-0 transition-all duration-700 shadow-2xl">
                    <div className="absolute -inset-4 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-3xl opacity-40 blur-2xl group-hover:opacity-60 transition-opacity"></div>
                    <div className="relative rounded-2xl overflow-hidden">
                        <img src={featuredTour.images[0]} alt={featuredTour.title} className="w-full aspect-[4/3] object-cover featured-image-anim" />
                        <div className="absolute bottom-6 right-6 bg-white/10 backdrop-blur-xl border border-white/20 text-white px-5 py-2 rounded-2xl font-black text-xs uppercase tracking-widest">
                           Premium Protocol
                        </div>
                    </div>
                  </div>
                </AnimateOnScroll>
                <AnimateOnScroll delay="200ms" className="featured-content-anim">
                  <div className="relative z-10">
                    <span className="text-xs font-black uppercase tracking-[0.4em] border-b-2 pb-2" style={{ color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}>Mission Critical Adventure</span>
                    <h2 className="text-4xl md:text-6xl font-black mt-6 font-cinzel tracking-tighter" style={{ color: 'var(--text-primary)' }}>{featuredTour.title}</h2>
                    <p className="mt-8 text-xl leading-relaxed font-light opacity-90" style={{ color: 'var(--text-secondary)' }}>{featuredTour.description}</p>
                    <div className="mt-10 space-y-5">
                        <div className="flex items-center p-4 rounded-2xl bg-[var(--bg-primary)] border border-white/5 shadow-xl hover:border-cyan-500/30 transition-all">
                             <CheckmarkIcon />
                             <div>
                                 <h4 className="font-black text-white uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Red Dune Penetration</h4>
                                 <p className="text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>High-intensity bashing followed by sunset BBQ.</p>
                             </div>
                        </div>
                        <div className="flex items-center p-4 rounded-2xl bg-[var(--bg-primary)] border border-white/5 shadow-xl hover:border-cyan-500/30 transition-all">
                             <CheckmarkIcon />
                             <div>
                                 <h4 className="font-black text-white uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>VIP Node Access</h4>
                                 <p className="text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>Exclusive table service & luxury transport upgrades.</p>
                             </div>
                        </div>
                    </div>
                    <Link to={`/tours/${featuredTour.slug}`} className="mt-12 inline-block text-white font-black py-5 px-12 rounded-2xl transition-all transform hover:scale-105 hover:shadow-2xl uppercase tracking-[0.2em] text-sm" style={{ backgroundColor: 'var(--accent-secondary)', boxShadow: `0 10px 40px -10px var(--shadow-color-secondary)`}}>
                      Commence Journey
                    </Link>
                  </div>
                </AnimateOnScroll>
              </div>
            </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="py-20 border-y border-white/5" style={{ backgroundColor: 'var(--bg-secondary)'}}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <AnimateOnScroll>
                <div>
                  <StatCounter target={50} suffix="+" />
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] opacity-40 mt-3" style={{ color: 'var(--text-primary)'}}>Global Nodes</h3>
                </div>
              </AnimateOnScroll>
              <AnimateOnScroll delay="200ms">
                <div>
                  <StatCounter target={2400} suffix="+" />
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] opacity-40 mt-3" style={{ color: 'var(--text-primary)'}}>Expeditions Logged</h3>
                </div>
              </AnimateOnScroll>
              <AnimateOnScroll delay="400ms">
                <div>
                  <StatCounter target={100} suffix="%" />
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] opacity-40 mt-3" style={{ color: 'var(--text-primary)'}}>Mission Success</h3>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
      </section>

      {/* Global Favorites Section - PINTEREST STYLE */}
      <section className="py-24 bg-[#0A0A10]">
        <div className="max-w-7xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                    <h2 className="text-4xl md:text-5xl font-black font-cinzel text-white tracking-tighter">Global Favorites</h2>
                    <p className="mt-3 text-cyan-400 font-mono text-sm uppercase tracking-widest">/// Re-imagine your world with AI Magic</p>
                </div>
                <Link to="/ai-planner" className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">Explore Full Matrix &rarr;</Link>
            </div>
          </AnimateOnScroll>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {TOURS_DATA.filter(t => t.slug !== 'dubai-desert-safari').map((tour, index) => (
              <AnimateOnScroll key={tour.id} delay={`${index * 100}ms`}>
                <TourCard tour={tour} currency={currency} />
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-32 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-20">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-purple-400">Tactical Visualization</span>
              <h2 className="text-4xl md:text-6xl font-black font-cinzel text-white mt-4 tracking-tighter">Planetary Node Distribution</h2>
              <p className="mt-4 text-gray-500 font-light text-lg">Locate your next mission entry point on our global grid.</p>
            </div>
            <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <InteractiveMap 
                centerLat={25} 
                centerLng={20} 
                zoom={2} 
                markers={mapMarkers} 
                />
            </div>
          </AnimateOnScroll>
        </div>
      </section>
      
      {/* Vanhsya Difference Section */}
      <section className="py-32 bg-[#0A0A10]">
        <div className="max-w-7xl mx-auto px-4">
            <AnimateOnScroll>
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-7xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-500 tracking-tighter">The Travel Architect</h2>
                    <p className="mt-8 max-w-3xl mx-auto text-xl font-light leading-relaxed text-gray-400">We don't book tours. We engineer experiences. Using a decentralized neural network to optimize every step of your journey.</p>
                </div>
            </AnimateOnScroll>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <AnimateOnScroll delay="0ms">
                    <VisionCard 
                        icon={<BlockchainIcon />} 
                        title="Immutable Ledger" 
                        description="Bookings secured on-chain. Transparent rewards. Total ownership of your global footprint."
                    />
                </AnimateOnScroll>
                <AnimateOnScroll delay="200ms">
                    <VisionCard 
                        icon={<CommunityIcon />} 
                        title="The Tribe Protocol" 
                        description="Access exclusive Stranger Meetups governed by community reputation and verification."
                    />
                </AnimateOnScroll>
                <AnimateOnScroll delay="400ms">
                    <VisionCard 
                        icon={<RealWorldIcon />} 
                        title="AI-Sensing Matrix"
                        description="Dynamic AI planning that adapts to local weather, pricing volatility, and crowd density in real-time."
                    />
                </AnimateOnScroll>
            </div>
        </div>
      </section>

      {/* AI Planner CTA */}
      <section className="py-32 relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 to-blue-900/40 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
        <AnimateOnScroll>
            <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
              <h2 className="text-5xl md:text-7xl font-black text-white font-cinzel tracking-tighter">Design Your Legacy</h2>
              <p className="mt-8 text-2xl text-gray-300 font-light leading-relaxed">Our AI architect synthesizes millions of data points to craft your signature global blueprint.</p>
              <Link to="/ai-planner" className="mt-12 inline-block text-black font-black py-6 px-16 rounded-full shadow-2xl transition-all transform hover:scale-110 uppercase tracking-[0.3em] text-sm hover:shadow-cyan-500/40" style={{ backgroundColor: 'var(--accent-primary)' }}>
                Initialize AI Architect
              </Link>
            </div>
        </AnimateOnScroll>
      </section>
    </div>
  );
};

export default HomePage;
