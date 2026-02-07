
import React from 'react';
import { Link } from 'react-router-dom';
import { Booking } from '../types';
import { useAppContext } from '../contexts/AppContext';
import AnimateOnScroll from '../components/AnimateOnScroll';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg h-full" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', boxShadow: '0 4px 6px -1px var(--shadow-color-primary)' }}>
        <div className="flex items-center justify-center h-14 w-14 rounded-2xl mb-6" style={{ backgroundColor: 'rgba(192, 132, 252, 0.1)', color: 'var(--accent-secondary)'}}>
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3 font-cinzel" style={{ color: 'var(--text-primary)'}}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)'}}>{description}</p>
    </div>
);

const BookingCard: React.FC<{ booking: Booking }> = ({ booking }) => {
  const statusColors = {
    upcoming: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    completed: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
    cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  };

  const currentStatus = statusColors[booking.status] || statusColors.upcoming;

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 p-5 rounded-xl border group hover:border-[var(--accent-primary)] transition-all duration-300" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      <div className="w-full md:w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
        <img src={booking.tourImage} alt={booking.tourTitle} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      </div>
      <div className="flex-grow text-center md:text-left">
        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
          <h4 className="text-lg font-bold font-cinzel" style={{ color: 'var(--text-primary)' }}>{booking.tourTitle}</h4>
          <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest border ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border} w-fit mx-auto md:mx-0`}>
            {booking.status}
          </span>
        </div>
        <div className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
          <p>Order ID: <span className="font-mono text-xs opacity-70">{booking.id}</span></p>
          <p>Date: {booking.date}</p>
        </div>
      </div>
      <div className="text-center md:text-right shrink-0">
        <p className="text-2xl font-black mb-4 font-mono" style={{ color: 'var(--accent-secondary)' }}>{booking.currency} {booking.price.toLocaleString()}</p>
        <Link 
          to={`/tours/${booking.tourSlug}`}
          className="px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border border-white/10 hover:bg-white hover:text-black transition-all"
          style={{ color: 'var(--text-primary)' }}
        >
          View Tour
        </Link>
      </div>
    </div>
  );
};

const TripsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const WalletIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const StatsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;

const DashboardPage: React.FC = () => {
  const { bookings } = useAppContext();

  return (
    <div className="max-w-6xl mx-auto px-4 py-20 pt-32 min-h-screen">
      
      {/* Header Profile Section */}
      <AnimateOnScroll>
        <div className="text-center mb-20 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--accent-secondary)]/5 rounded-full blur-[100px] pointer-events-none"></div>
          <span className="inline-block py-1 px-4 rounded-full border border-[var(--accent-secondary)]/30 mb-6 text-xs font-mono uppercase tracking-[0.3em]" style={{ color: 'var(--accent-secondary)', backgroundColor: 'rgba(138, 43, 226, 0.05)' }}>
              Passport V1.0 • Global Explorer
          </span>
          <h1 className="text-5xl md:text-7xl font-black font-cinzel tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500">
              Vanhsya Passport™
          </h1>
          <p className="text-lg max-w-2xl mx-auto font-light leading-relaxed text-gray-400">
            The decentralized hub for your global footprint. Access verified bookings, manage VYNO rewards, and track your explorer status across the physical and digital world.
          </p>
        </div>
      </AnimateOnScroll>
      
      {/* Stats / Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        <AnimateOnScroll delay="100ms">
            <FeatureCard
                icon={<TripsIcon />}
                title="My Adventures"
                description="Your history of discovery. From confirmed expeditions to curated wishlists, all your travel plans live here."
            />
        </AnimateOnScroll>
        <AnimateOnScroll delay="200ms">
            <FeatureCard
                icon={<WalletIcon />}
                title="VYNO Wallet"
                description="Securely store your VYNO coins and travel NFTs. Redeem credits for flight upgrades or exclusive meetups."
            />
        </AnimateOnScroll>
        <AnimateOnScroll delay="300ms">
            <FeatureCard
                icon={<StatsIcon />}
                title="Status Levels"
                description="Track your journey from Nomad to Legend. Each border crossing increases your multiplier and unlocks perks."
            />
        </AnimateOnScroll>
      </div>

      {/* Bookings Section */}
      <section className="mb-24">
        <AnimateOnScroll>
            <div className="flex items-end justify-between mb-10 border-b border-white/5 pb-6">
              <div>
                <h2 className="text-3xl md:text-4xl font-black font-cinzel text-white">Active Itineraries</h2>
                <p className="text-sm text-gray-500 mt-1 uppercase tracking-widest font-mono">/// Syncing with global network...</p>
              </div>
              <button className="text-xs font-black uppercase tracking-widest text-[var(--accent-secondary)] hover:text-white transition-colors border-b border-transparent hover:border-white">
                  View Full Archive &rarr;
              </button>
            </div>
            
            <div className="space-y-6">
              {bookings && bookings.length > 0 ? (
                bookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              ) : (
                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-2xl">
                    <p className="text-gray-500">Your passport is waiting for its first stamp.</p>
                    <Link to="/ai-planner" className="mt-4 inline-block text-[var(--accent-primary)] hover:underline">Plan an adventure &rarr;</Link>
                </div>
              )}
            </div>
        </AnimateOnScroll>
      </section>
      
      {/* Roadmap / Coming Soon Section */}
      <AnimateOnScroll>
          <div className="p-10 md:p-16 border border-white/5 rounded-[2rem] text-center relative overflow-hidden bg-black/40 backdrop-blur-md">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,var(--accent-secondary)_0%,transparent_70%)] animate-pulse"></div>
            <div className="relative z-10">
                <div className="inline-block p-4 rounded-full bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)] mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h2 className="text-4xl font-black font-cinzel mb-4 text-white">The DAO Era is Coming</h2>
                <p className="max-w-2xl mx-auto text-lg text-gray-400 font-light mb-10">
                  By Q1 2025, your Passport will evolve into a governance tool. Stake VYNO, vote on new destinations, and own a piece of the network.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <span className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-gray-500">Staking: ACTIVE Q1</span>
                    <span className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-gray-500">Rewards Engine: CALIBRATING</span>
                    <span className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-gray-500">Governance: ONLINE</span>
                </div>
            </div>
          </div>
      </AnimateOnScroll>

    </div>
  );
};

export default DashboardPage;
