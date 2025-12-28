
import React, { useState, useMemo } from 'react';
import { MEETUPS_DATA } from '../constants';
import MeetupCard from '../components/MeetupCard';
import AnimateOnScroll from '../components/AnimateOnScroll';

// --- ICONS ---
const FindIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const JoinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const ConnectIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.274-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.274.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
const TrendingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;

// --- COMPONENTS ---

const StepCard: React.FC<{ icon: React.ReactNode; title: string; description: string; step: number }> = ({ icon, title, description, step }) => (
    <div className="p-8 rounded-2xl bg-gray-900/60 border border-gray-700 backdrop-blur-sm relative transition-all duration-300 hover:-translate-y-2 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-900/20">
        <div className="absolute -top-6 left-8 w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-600/40 transform -rotate-6">
          {step}
        </div>
        <div className="pt-8">
            <div className="flex items-center gap-3 mb-4 text-purple-400">
                {icon}
                <h3 className="text-xl font-bold text-white font-cinzel">{title}</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
        </div>
    </div>
);

const StatCard: React.FC<{ value: string; label: string; icon: React.ReactNode }> = ({ value, label, icon }) => (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="p-3 bg-white/10 rounded-lg text-purple-400">
            {icon}
        </div>
        <div>
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
        </div>
    </div>
);

const FilterButton: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
            active 
            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40' 
            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
        }`}
    >
        {label}
    </button>
);

const galleryImages = [
    'https://images.unsplash.com/photo-1523908511403-7fc7b25592f4?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop', 
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1524984553335-a6e5a82647c2?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1541595801925-1ea9f323c533?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1556742518-a69c179872ab?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522881451255-f5f7c3a39f3c?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1533106418989-88406e76825a?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1530541930197-58e36e841f32?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544434689-2158872a08f5?q=80&w=800&auto=format&fit=crop'
];

const galleryColumns = [
    galleryImages.slice(0, 4),
    galleryImages.slice(4, 8),
    galleryImages.slice(8, 12),
];

// --- MAIN PAGE ---

const MeetupsPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Food & Drink', 'Adventure', 'Culture', 'Wellness'];

  const filteredMeetups = useMemo(() => {
    if (activeCategory === 'All') return MEETUPS_DATA;
    // Simple keyword matching for demo purposes since data is small
    return MEETUPS_DATA.filter(meetup => {
        const text = (meetup.title + meetup.description).toLowerCase();
        if (activeCategory === 'Food & Drink') return text.includes('food') || text.includes('picnic') || text.includes('market');
        if (activeCategory === 'Adventure') return text.includes('aurora') || text.includes('hunt') || text.includes('hiking');
        if (activeCategory === 'Culture') return text.includes('history') || text.includes('tour') || text.includes('picnic');
        if (activeCategory === 'Wellness') return text.includes('meditation') || text.includes('yoga') || text.includes('relax');
        return true;
    });
  }, [activeCategory]);

  return (
    <div className="pt-24 bg-[#0A0A10] min-h-screen text-white overflow-hidden">
      
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
         <div className="absolute inset-0 z-0">
             <video
                src="https://videos.pexels.com/video-files/3195650/3195650-uhd_2560_1440_25fps.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover opacity-40 scale-105"
            ></video>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A10] via-[#0A0A10]/60 to-transparent"></div>
         </div>
        
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 animate-fadeIn">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-widest text-green-300">Live Community Hub</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 mb-6 drop-shadow-2xl">
                Stranger Meetups™
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-300 font-light leading-relaxed">
                Turn solo trips into shared stories. Connect with like-minded adventurers for exclusive, intimate experiences in cities around the world.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                <button onClick={() => document.getElementById('browse-meetups')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 bg-purple-600 text-white font-bold rounded-full shadow-lg shadow-purple-600/30 hover:bg-purple-500 transition-all transform hover:scale-105">
                    Find Your Crew
                </button>
                <button className="px-8 py-4 bg-transparent border border-white/20 text-white font-bold rounded-full hover:bg-white/10 transition-all">
                    How It Works
                </button>
            </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="border-y border-white/10 bg-white/5 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 py-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <StatCard 
                      icon={<TrendingIcon />} 
                      value="24 Active" 
                      label="Meetups Happening Now"
                  />
                  <StatCard 
                      icon={<UsersIcon />} 
                      value="12k+" 
                      label="Travelers Connected"
                  />
                  <StatCard 
                      icon={<StarIcon />} 
                      value="4.9/5" 
                      label="Community Rating"
                  />
              </div>
          </div>
      </div>

      {/* How it Works Section */}
      <section className="py-24 relative">
        <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <AnimateOnScroll>
                    <StepCard 
                        step={1}
                        icon={<FindIcon />} 
                        title="Discover" 
                        description="Browse curated events hosted by verified locals and travelers. From rooftop drinks to hidden food walks."
                    />
                </AnimateOnScroll>
                <AnimateOnScroll delay="200ms">
                    <StepCard 
                        step={2}
                        icon={<JoinIcon />} 
                        title="Reserve" 
                        description="Secure your spot instantly. Groups are kept small (6-12 people) to ensure real connections."
                    />
                </AnimateOnScroll>
                <AnimateOnScroll delay="400ms">
                     <StepCard 
                        step={3}
                        icon={<ConnectIcon />} 
                        title="Experience" 
                        description="Show up, meet your new friends, and create memories that last longer than your trip."
                    />
                </AnimateOnScroll>
            </div>
        </div>
      </section>

       {/* Browse Meetups Section */}
      <section id="browse-meetups" className="py-24 bg-gradient-to-b from-[#0F0F16] to-[#0A0A10]">
        <div className="max-w-7xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                <div>
                    <h2 className="text-4xl md:text-5xl font-bold font-cinzel text-white mb-4">Upcoming Adventures</h2>
                    <p className="text-gray-400">Join a verified meetup happening in the next 30 days.</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-6 md:mt-0">
                    {categories.map(cat => (
                        <FilterButton 
                            key={cat} 
                            label={cat} 
                            active={activeCategory === cat} 
                            onClick={() => setActiveCategory(cat)} 
                        />
                    ))}
                </div>
            </div>
          </AnimateOnScroll>

          {filteredMeetups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredMeetups.map((meetup, index) => (
                  <AnimateOnScroll key={meetup.id} delay={`${index * 100}ms`}>
                    <MeetupCard meetup={meetup} />
                  </AnimateOnScroll>
                ))}
              </div>
          ) : (
              <div className="text-center py-20 border border-dashed border-gray-700 rounded-2xl">
                  <p className="text-gray-500 text-xl">No meetups found in this category yet.</p>
                  <button onClick={() => setActiveCategory('All')} className="mt-4 text-purple-400 hover:text-purple-300 underline">View all meetups</button>
              </div>
          )}
        </div>
      </section>

      {/* Host Spotlight */}
      <section className="py-24 bg-[#0A0A10] relative overflow-hidden">
          <div className="absolute inset-0 bg-purple-900/5 clip-path-slant"></div>
          <div className="max-w-6xl mx-auto px-4 relative z-10">
              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-12 shadow-2xl">
                  <div className="w-full md:w-1/3">
                      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                          <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop" alt="Yuki Host" className="w-full h-full object-cover" />
                          <div className="absolute bottom-4 left-4 bg-white text-black px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Superhost</div>
                      </div>
                  </div>
                  <div className="w-full md:w-2/3">
                      <div className="flex items-center gap-2 text-purple-400 font-bold mb-4">
                          <StarIcon /> <span className="uppercase tracking-widest text-xs">Host of the Month</span>
                      </div>
                      <h2 className="text-4xl font-cinzel font-bold text-white mb-6">Meet Yuki from Tokyo</h2>
                      <p className="text-gray-300 text-lg leading-relaxed mb-8">
                          "I started hosting food crawls to show travelers the Tokyo that guidebooks miss. The tiny 5-seat ramen bars, the jazz kissatens, and the standing sushi spots. My favorite part is seeing strangers bond over a bowl of hot broth. It's magic."
                      </p>
                      <div className="grid grid-cols-3 gap-6 mb-10">
                          <div>
                              <p className="text-3xl font-black text-white">142</p>
                              <p className="text-xs text-gray-500 uppercase">Meetups Hosted</p>
                          </div>
                          <div>
                              <p className="text-3xl font-black text-white">4.98</p>
                              <p className="text-xs text-gray-500 uppercase">Rating</p>
                          </div>
                          <div>
                              <p className="text-3xl font-black text-white">1200+</p>
                              <p className="text-xs text-gray-500 uppercase">Guests</p>
                          </div>
                      </div>
                      <button className="px-8 py-3 border border-white/30 text-white font-bold rounded-lg hover:bg-white hover:text-black transition-colors">
                          View Yuki's Upcoming Meetups
                      </button>
                  </div>
              </div>
          </div>
      </section>

      {/* Gallery Section */}
      <section className="py-24 bg-[#0F0F16]">
        <div className="max-w-7xl mx-auto px-4">
            <AnimateOnScroll>
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold font-cinzel text-white">Captured Moments</h2>
                    <p className="mt-4 text-gray-400">Real stories from the Vanhsya community.</p>
                </div>
                <div className="relative h-[600px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 flex w-full max-w-6xl justify-center gap-6 h-max">
                        {galleryColumns.map((column, colIndex) => (
                            <div 
                                key={colIndex} 
                                className="flex flex-col gap-6 w-1/3"
                                style={{
                                    animation: `scroll-up ${colIndex === 1 ? '45s' : colIndex === 2 ? '35s' : '40s'} linear infinite`,
                                } as React.CSSProperties}
                            >
                                {[...column, ...column].map((src, imgIndex) => (
                                     <div key={imgIndex} className="relative group overflow-hidden rounded-xl">
                                        <img className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-110" src={src} alt={`Gallery ${imgIndex}`} loading="lazy" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-white font-cinzel text-lg">Vanhsya Vibes</span>
                                        </div>
                                     </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </AnimateOnScroll>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
        <AnimateOnScroll>
            <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
              <h2 className="text-5xl font-black text-white font-cinzel mb-8">Lead The Adventure</h2>
              <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
                  Love your city? Passionate about connecting people? Become a host and earn crypto rewards while sharing your world.
              </p>
              <button className="px-10 py-5 bg-white text-black font-black uppercase tracking-widest text-sm rounded-full shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:bg-purple-50 transition-colors transform hover:-translate-y-1">
                Apply to Host
              </button>
            </div>
        </AnimateOnScroll>
      </section>

    </div>
  );
};

export default MeetupsPage;
