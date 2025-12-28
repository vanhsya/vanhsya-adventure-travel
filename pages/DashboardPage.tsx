
import React from 'react';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', boxShadow: '0 4px 6px -1px var(--shadow-color-primary)' }}>
        <div className="flex items-center justify-center h-14 w-14 rounded-2xl mb-6" style={{ backgroundColor: 'rgba(192, 132, 252, 0.1)', color: 'var(--accent-secondary)'}}>
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3 font-cinzel" style={{ color: 'var(--text-primary)'}}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)'}}>{description}</p>
    </div>
);

const TripsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const WalletIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const StatsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;

const DashboardPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-20 pt-32 min-h-screen">
      <div className="text-center mb-20">
        <span className="inline-block py-1 px-3 rounded-full border mb-6 text-xs font-mono uppercase tracking-widest" style={{ borderColor: 'var(--accent-secondary)', color: 'var(--accent-secondary)', backgroundColor: 'rgba(138, 43, 226, 0.1)' }}>
            Coming Q1 2025
        </span>
        <h1 className="text-4xl md:text-6xl font-bold font-cinzel tracking-wider mb-6" style={{ color: 'var(--text-primary)'}}>
            Your Vanhsya Passport™
        </h1>
        <p className="text-xl max-w-2xl mx-auto font-light leading-relaxed" style={{ color: 'var(--text-secondary)'}}>
          The central hub for your adventures. Track bookings, manage rewards, and view your traveler status—all in one place.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <FeatureCard
            icon={<TripsIcon />}
            title="My Trips"
            description="Access all your upcoming and past trip itineraries, booking details, and travel documents in one organized space."
        />
        <FeatureCard
            icon={<WalletIcon />}
            title="Rewards Wallet"
            description="View your balance of travel credits, earned NFTs, and exclusive member perks. Redeem them for your next journey."
        />
            <FeatureCard
            icon={<StatsIcon />}
            title="Traveler Stats"
            description="See your travel history come to life with stats on countries visited, miles traveled, and unique experiences collected."
        />
      </div>
      
      <div className="p-10 border-2 border-dashed rounded-2xl text-center relative overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--accent-secondary)' }}>
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,var(--accent-secondary)_0%,transparent_70%)]"></div>
        <div className="relative z-10">
            <h2 className="text-3xl font-bold font-cinzel mb-4" style={{ color: 'var(--accent-secondary)' }}>Dashboard Coming Soon</h2>
            <p className="max-w-2xl mx-auto text-lg" style={{ color: 'var(--text-secondary)' }}>
            Your personal dashboard is under construction. We're putting the final touches on your Vanhsya Passport to make managing your travels seamless and rewarding.
            </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
