
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

  return <p ref={ref} className="text-4xl lg:text-5xl font-bold mb-2" style={{ color: 'var(--accent-secondary)'}}>0</p>;
};

const VisionCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="p-6 rounded-xl border transition-all duration-300 h-full hover:border-[var(--accent-primary)] hover:shadow-lg hover:shadow-[var(--shadow-color-primary)]" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)'}}>
      <div className="flex items-center justify-center h-12 w-12 rounded-full mb-4" style={{ backgroundColor: 'rgba(192, 132, 252, 0.1)', color: 'var(--accent-secondary)'}}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)'}}>{title}</h3>
      <p className="text-sm" style={{ color: 'var(--text-secondary)'}}>{description}</p>
  </div>
);

const BlockchainIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /><path d="M4 12h16" /><path d="M12 4v16" /></svg>;
const CommunityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.274-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.274.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const RealWorldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h8a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.886 21h8.228M12 21a9 9 0 110-18 9 9 0 010 18z" /></svg>;

const CheckmarkIcon = () => (
    <div className="flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center mr-4 bg-white/10" style={{ borderColor: 'var(--border-color)' }}>
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30"></div>
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
              <Link to="/ai-planner" className="inline-block text-black font-bold py-4 px-10 rounded-full transition-transform transform hover:scale-110 animate-button-glow" style={{ backgroundColor: 'var(--accent-primary)' }}>
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
      <section className="bg-gradient-to-r from-blue-900 to-indigo-900 py-4 relative overflow-hidden border-y border-blue-500/30">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/snow.png')]"></div>
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between relative z-10">
            <div className="flex items-center mb-2 md:mb-0">
                <span className="text-3xl mr-3">❄️</span>
                <div>
                    <h3 className="font-bold text-white text-lg">Winter Wanderlust Sale</h3>
                    <p className="text-blue-200 text-sm">Newcomers get <span className="text-white font-bold">$50 OFF</span> their first booking!</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                 <div className="bg-white/10 px-4 py-2 rounded text-sm font-mono text-blue-200 border border-blue-400/30">
                    Code: <span className="text-white font-bold">VANHSYA24</span>
                 </div>
                 <Link to="/ai-planner" className="text-sm font-bold text-white hover:text-blue-300 transition-colors">Book Now &rarr;</Link>
            </div>
        </div>
      </section>

      {/* Top Adventure Section */}
      {featuredTour && (
        <section className="py-16 lg:py-24 featured-adventure-bg">
          <div className="max-w-7xl mx-auto px-4">
              <div className="grid md:grid-cols-2 gap-10 lg:gap-20 items-center">
                <AnimateOnScroll>
                  <div className="relative group overflow-hidden rounded-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
                    <div className="absolute -inset-2.5 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-2xl opacity-70 blur-lg animate-pulse"></div>
                    <div className="relative rounded-xl overflow-hidden shadow-2xl">
                        <img src={featuredTour.images[0]} alt={featuredTour.title} className="w-full aspect-[4/3] object-cover featured-image-anim" />
                        <div className="absolute bottom-4 right-4 bg-white/90 text-black px-4 py-1 rounded-full font-bold text-sm">
                           Premium Experience
                        </div>
                    </div>
                  </div>
                </AnimateOnScroll>
                <AnimateOnScroll delay="200ms" className="featured-content-anim">
                  <div className="relative z-10">
                    <span className="text-sm font-bold uppercase tracking-widest border-b-2 pb-1" style={{ color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}>Top Rated Experience</span>
                    <h2 className="text-4xl md:text-5xl font-bold mt-4 font-cinzel" style={{ color: 'var(--text-primary)' }}>{featuredTour.title}</h2>
                    <p className="mt-6 text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{featuredTour.description}</p>
                    <div className="mt-8 grid grid-cols-1 gap-4">
                        <div className="flex items-center p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]">
                             <CheckmarkIcon />
                             <div>
                                 <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>Dune Bashing & BBQ</h4>
                                 <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Thrills followed by flavor.</p>
                             </div>
                        </div>
                        <div className="flex items-center p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]">
                             <CheckmarkIcon />
                             <div>
                                 <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>VIP Service Available</h4>
                                 <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Upgrade for table service & private 4x4.</p>
                             </div>
                        </div>
                    </div>
                    <Link to={`/tours/${featuredTour.slug}`} className="mt-10 inline-block text-white font-bold py-4 px-10 rounded-lg transition-transform transform hover:scale-105" style={{ backgroundColor: 'var(--accent-secondary)', boxShadow: `0 4px 20px 0 var(--shadow-color-secondary)`}}>
                      Book Adventure
                    </Link>
                  </div>
                </AnimateOnScroll>
              </div>
            </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="py-16 border-y" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)'}}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <AnimateOnScroll>
                <div>
                  <StatCounter target={50} suffix="+" />
                  <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)'}}>Global Destinations</h3>
                </div>
              </AnimateOnScroll>
              <AnimateOnScroll delay="200ms">
                <div>
                  <StatCounter target={200} suffix="+" />
                  <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)'}}>Curated Tours</h3>
                </div>
              </AnimateOnScroll>
              <AnimateOnScroll delay="400ms">
                <div>
                  <StatCounter target={100} suffix="%" />
                  <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)'}}>Adventure Guaranteed</h3>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
      </section>

      {/* Global Adventures Section */}
      <section className="py-20" style={{ backgroundColor: 'var(--bg-primary)'}}>
        <div className="max-w-7xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold font-cinzel" style={{ color: 'var(--text-primary)'}}>Global Favorites</h2>
                    <p className="mt-2" style={{ color: 'var(--text-secondary)'}}>Explore our most popular international journeys.</p>
                </div>
                <Link to="/ai-planner" className="mt-4 md:mt-0 text-[var(--accent-secondary)] font-bold hover:underline">View All Destinations &rarr;</Link>
            </div>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {TOURS_DATA.filter(t => t.slug !== 'dubai-desert-safari').map((tour, index) => (
              <AnimateOnScroll key={tour.id} delay={`${index * 150}ms`}>
                <TourCard tour={tour} currency={currency} />
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-20" style={{ backgroundColor: 'var(--bg-secondary)'}}>
        <div className="max-w-6xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-cinzel" style={{ color: 'var(--text-primary)'}}>Interactive Destination Map</h2>
              <p className="mt-2" style={{ color: 'var(--text-secondary)'}}>Explore our tour locations across the globe.</p>
            </div>
            <InteractiveMap 
              centerLat={25} 
              centerLng={20} 
              zoom={2} 
              markers={mapMarkers} 
            />
          </AnimateOnScroll>
        </div>
      </section>
      
      {/* Vanhsya Difference Section */}
      <section className="py-20" style={{ backgroundColor: 'var(--bg-primary)'}}>
        <div className="max-w-6xl mx-auto px-4">
            <AnimateOnScroll>
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] via-purple-500 to-[var(--accent-secondary)] drop-shadow-md">The Future of Travel</h2>
                    <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl font-light leading-relaxed" style={{ color: 'var(--text-secondary)' }}>We're building a decentralized travel ecosystem powered by cutting-edge technology for a more secure, transparent, and rewarding journey.</p>
                </div>
            </AnimateOnScroll>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <AnimateOnScroll delay="0ms">
                    <VisionCard 
                        icon={<BlockchainIcon />} 
                        title="Blockchain Security" 
                        description="Your bookings and rewards are secured on the blockchain, ensuring transparent and immutable transactions."
                    />
                </AnimateOnScroll>
                <AnimateOnScroll delay="200ms">
                    <VisionCard 
                        icon={<CommunityIcon />} 
                        title="Decentralized Community" 
                        description="Join a travel ecosystem governed by its members. Your voice matters in shaping the future of Vanhsya."
                    />
                </AnimateOnScroll>
                <AnimateOnScroll delay="400ms">
                    <VisionCard 
                        icon={<RealWorldIcon />} 
                        title="AI & VR Integration"
                        description="From personalized AI-planned trips to immersive VR previews, we bridge the digital and physical worlds."
                    />
                </AnimateOnScroll>
            </div>
        </div>
      </section>

      {/* AI Planner CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-indigo-900 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
        <AnimateOnScroll>
            <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white font-cinzel">Can't Decide? Let AI Help!</h2>
              <p className="mt-6 text-xl text-gray-200">Our intelligent planner crafts personalized itineraries based on your interests, budget, and travel style.</p>
              <Link to="/ai-planner" className="mt-10 inline-block text-black font-bold py-4 px-10 rounded-full shadow-lg transition-transform transform hover:scale-105" style={{ backgroundColor: 'var(--accent-primary)', boxShadow: `0 4px 20px 0 rgba(0,0,0,0.5)`}}>
                Plan Your Dream Trip
              </Link>
            </div>
        </AnimateOnScroll>
      </section>
    </div>
  );
};

export default HomePage;
