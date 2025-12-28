
import React, { useState } from 'react';
import AnimateOnScroll from '../components/AnimateOnScroll';

const StepCard: React.FC<{ icon: React.ReactNode; title: string; description: string; step: number }> = ({ icon, title, description, step }) => (
    <div className="p-6 rounded-xl text-center relative transition-all duration-300 transform hover:-translate-y-2 bg-gray-900/40 border border-gray-700">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center h-12 w-12 rounded-full font-bold text-lg border-4 border-gray-800 bg-purple-600 text-white shadow-lg shadow-purple-500/30">
          {step}
        </div>
        <div className="pt-8">
            <div className="flex items-center justify-center h-16 w-16 rounded-full mb-4 mx-auto bg-purple-500/10 text-purple-400">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
            <p className="text-sm text-gray-400">{description}</p>
        </div>
    </div>
);

const TierCard: React.FC<{ title: string; requirements: string; reward: string; color: string; icon: React.ReactNode }> = ({ title, requirements, reward, color, icon }) => (
    <div className={`p-6 rounded-xl border relative overflow-hidden group hover:border-${color}-500 transition-colors duration-300 bg-gray-900/60 border-gray-700`}>
        <div className={`absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity text-${color}-500 transform scale-150`}>
            {icon}
        </div>
        <h3 className={`text-xl font-bold mb-1 text-${color}-400 uppercase tracking-widest`}>{title}</h3>
        <p className="text-xs text-gray-500 mb-4 font-mono">{requirements}</p>
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded bg-${color}-500/20 text-${color}-400`}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-400">Unlock Perk:</p>
                <p className="text-white font-bold">{reward}</p>
            </div>
        </div>
    </div>
);

const EarningsCalculator: React.FC = () => {
    const [friends, setFriends] = useState(5);
    const creditPerReferral = 50; // $50 credits per friend
    
    return (
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl p-8 max-w-2xl mx-auto shadow-2xl">
            <h3 className="text-2xl font-bold text-center mb-8 font-cinzel">Calculate Your Earnings</h3>
            
            <div className="mb-8">
                <div className="flex justify-between text-sm mb-4">
                    <span className="text-gray-400">I invite...</span>
                    <span className="text-purple-400 font-bold">{friends} Friends</span>
                </div>
                <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    value={friends} 
                    onChange={(e) => setFriends(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
            </div>

            <div className="flex justify-between items-center p-6 bg-purple-900/20 border border-purple-500/30 rounded-xl">
                <div>
                    <p className="text-gray-400 text-sm">You Earn</p>
                    <p className="text-3xl font-black text-white">${(friends * creditPerReferral).toLocaleString()}</p>
                </div>
                 <div className="text-right">
                    <p className="text-gray-400 text-sm">Friends Save</p>
                    <p className="text-xl font-bold text-green-400">${(friends * 25).toLocaleString()}</p>
                </div>
            </div>
            <p className="text-xs text-center text-gray-500 mt-4">*Credits can be used for any booking over $200.</p>
        </div>
    );
};

const ShareLinkSection: React.FC = () => {
    const [copied, setCopied] = useState(false);
    const link = "vanhsya.com/r/ADVENTURE2024";

    const handleCopy = () => {
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto mt-8">
            <div className="flex-grow bg-gray-800 rounded-lg px-4 py-3 text-gray-300 font-mono border border-gray-600 flex items-center justify-between">
                <span>{link}</span>
            </div>
            <button 
                onClick={handleCopy}
                className={`px-8 py-3 rounded-lg font-bold transition-all ${copied ? 'bg-green-600 text-white' : 'bg-white text-black hover:bg-gray-200'}`}
            >
                {copied ? 'Copied!' : 'Copy Link'}
            </button>
        </div>
    );
};

const ShareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>;
const BookIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const RewardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>;
const TrophyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
const CrownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const GemIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;

const ReferAndEarnPage: React.FC = () => {
  return (
    <div className="pt-24 bg-[#0A0A10] min-h-screen text-white">
       
       {/* Hero Section */}
       <section className="text-center py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent"></div>
        <div className="relative z-10">
            <h1 className="text-5xl md:text-7xl font-black font-cinzel tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-white to-purple-300">
                Turn Connections <br/> Into Journeys
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-400 font-light">
                Give your friends $25 off their first trip. Get $50 in credits when they travel. 
            </p>
            <ShareLinkSection />
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-20 px-4">
        <AnimateOnScroll>
            <EarningsCalculator />
        </AnimateOnScroll>
      </section>

       {/* How It Works */}
       <section className="py-20 bg-gray-900/30 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-16 font-cinzel">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8">
                <AnimateOnScroll delay="0ms">
                    <StepCard 
                        step={1}
                        icon={<ShareIcon />} 
                        title="Share Your Link" 
                        description="Copy your unique link above and share it on WhatsApp, Instagram, or Email."
                    />
                </AnimateOnScroll>
                <AnimateOnScroll delay="200ms">
                    <StepCard 
                        step={2}
                        icon={<BookIcon />} 
                        title="Friend Books" 
                        description="Your friend signs up and books any adventure over $200."
                    />
                </AnimateOnScroll>
                <AnimateOnScroll delay="400ms">
                     <StepCard 
                        step={3}
                        icon={<RewardIcon />} 
                        title="Get Paid" 
                        description="Credits hit your wallet instantly after their trip is confirmed."
                    />
                </AnimateOnScroll>
            </div>
        </div>
      </section>

      {/* Progression Tiers */}
      <section className="py-20 max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 font-cinzel">Unlock Elite Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimateOnScroll delay="0ms">
                <TierCard 
                    title="Nomad" 
                    requirements="1-4 Referrals" 
                    reward="Standard Credits" 
                    color="blue" 
                    icon={<ShareIcon />}
                />
            </AnimateOnScroll>
            <AnimateOnScroll delay="200ms">
                <TierCard 
                    title="Ambassador" 
                    requirements="5-9 Referrals" 
                    reward="+10% Bonus Credit" 
                    color="purple" 
                    icon={<CrownIcon />}
                />
            </AnimateOnScroll>
            <AnimateOnScroll delay="400ms">
                <TierCard 
                    title="Legend" 
                    requirements="10+ Referrals" 
                    reward="Free Weekend Trip" 
                    color="yellow" 
                    icon={<TrophyIcon />}
                />
            </AnimateOnScroll>
          </div>
      </section>

      <section className="py-20 text-center">
        <div className="max-w-3xl mx-auto px-4">
            <div className="p-10 border border-purple-500/30 rounded-2xl bg-gradient-to-b from-purple-900/10 to-transparent">
                <h2 className="text-2xl font-bold text-white mb-4">Start Earning Today</h2>
                <p className="text-gray-400 mb-8">Join thousands of travelers funding their next adventure through referrals.</p>
                <button className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest hover:bg-gray-200 transition-colors rounded-full">
                    Copy My Referral Link
                </button>
            </div>
        </div>
      </section>
    </div>
  );
};

export default ReferAndEarnPage;
