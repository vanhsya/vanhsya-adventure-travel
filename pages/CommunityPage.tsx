
import React from 'react';
import { Link } from 'react-router-dom';
import AnimateOnScroll from '../components/AnimateOnScroll';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; link: string; linkText: string }> = ({ icon, title, description, link, linkText }) => (
    <div className="p-8 rounded-2xl border flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-900/20 group" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)'}}>
        <div className="flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-xl mb-6 transition-colors group-hover:bg-purple-600 group-hover:text-white" style={{ backgroundColor: 'rgba(192, 132, 252, 0.1)', color: 'var(--accent-secondary)'}}>
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3 font-cinzel" style={{ color: 'var(--text-primary)'}}>{title}</h3>
        <p className="text-sm flex-grow leading-relaxed" style={{ color: 'var(--text-secondary)'}}>{description}</p>
        <Link to={link} className="mt-8 font-bold text-sm uppercase tracking-wider flex items-center gap-2 group-hover:gap-4 transition-all" style={{ color: 'var(--accent-secondary)'}}>
            {linkText} <span>&rarr;</span>
        </Link>
    </div>
);

const TribeCard: React.FC<{ image: string; title: string; members: string }> = ({ image, title, members }) => (
    <div className="relative group overflow-hidden rounded-2xl aspect-[4/5] cursor-pointer">
        <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
        <div className="absolute bottom-0 left-0 p-6 w-full transform transition-transform duration-300 group-hover:-translate-y-2">
            <h3 className="text-2xl font-bold text-white font-cinzel mb-1">{title}</h3>
            <p className="text-sm text-purple-300 font-mono">{members} Members</p>
            <div className="h-0 overflow-hidden group-hover:h-auto group-hover:mt-4 transition-all">
                <button className="text-xs font-bold uppercase tracking-widest text-white border border-white/50 px-4 py-2 rounded-full hover:bg-white hover:text-black transition-colors">Join Tribe</button>
            </div>
        </div>
    </div>
);

const DiscussionRow: React.FC<{ category: string; title: string; author: string; replies: number; time: string }> = ({ category, title, author, replies, time }) => (
    <div className="flex items-center justify-between p-4 border-b border-gray-800 hover:bg-white/5 transition-colors cursor-pointer group">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-lg">💬</div>
            <div>
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1 block">{category}</span>
                <h4 className="text-white font-semibold group-hover:text-purple-300 transition-colors">{title}</h4>
            </div>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-500">
            <span>by <span className="text-gray-300">{author}</span></span>
            <span>{replies} replies</span>
            <span>{time}</span>
        </div>
    </div>
);

const AmbassadorCard: React.FC<{ name: string; role: string; image: string; badges: string[] }> = ({ name, role, image, badges }) => (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-purple-500/50 transition-colors">
        <img src={image} alt={name} className="w-16 h-16 rounded-full object-cover border-2 border-purple-500/30" />
        <div>
            <h4 className="text-white font-bold">{name}</h4>
            <p className="text-xs text-purple-400 uppercase tracking-widest mb-2">{role}</p>
            <div className="flex gap-1">
                {badges.map((b, i) => (
                    <span key={i} className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded">{b}</span>
                ))}
            </div>
        </div>
    </div>
);

const MeetupsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.274-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.274.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const PartnersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const ReferIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>;

const CommunityPage: React.FC = () => {
  return (
    <div className="pt-24 min-h-screen bg-[#0A0A10] text-gray-200">
      
      {/* Hero Section */}
      <section className="relative text-center py-24 lg:py-40 px-4 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
             <img 
                src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2070&auto=format&fit=crop" 
                alt="Community Gathering" 
                className="w-full h-full object-cover opacity-30 animate-kenburns"
             />
             <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A10]/80 via-[#0A0A10]/50 to-[#0A0A10]"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
            <span className="inline-block py-1 px-3 rounded-full bg-purple-900/30 border border-purple-500/30 text-purple-300 text-xs font-mono mb-6 backdrop-blur-md">
                ● 54,203 Explorers Online
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white font-cinzel tracking-wider drop-shadow-2xl">
                Welcome Home, <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Explorer</span>
            </h1>
            <p className="mt-6 text-xl text-gray-300 max-w-2xl mx-auto font-light leading-relaxed">
                Join the decentralized network of travelers, creators, and visionaries building the future of global exploration.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 2.08 2.08 0 0 0-.01.026 2.09 2.09 0 0 0-.01.026c-.463.535-.873 1.13-1.22 1.77a18.263 18.263 0 0 0-8.106 0 17.064 17.064 0 0 0-1.22-1.77.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/></svg>
                    Join Discord
                </button>
                <button className="px-8 py-4 bg-white/10 text-white font-bold rounded-lg border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                    View Governance
                </button>
            </div>
        </div>
      </section>

      {/* Global Tribes */}
      <section className="py-20 bg-black relative">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
          <div className="max-w-7xl mx-auto px-4">
            <AnimateOnScroll>
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold font-cinzel text-white">Find Your Tribe</h2>
                        <p className="text-gray-400 mt-2">Connect with travelers who share your DNA.</p>
                    </div>
                    <button className="hidden md:block text-purple-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">View All Tribes &rarr;</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <TribeCard 
                        title="Digital Nomads" 
                        members="12.4k" 
                        image="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop"
                    />
                     <TribeCard 
                        title="Adrenaline Junkies" 
                        members="8.2k" 
                        image="https://images.unsplash.com/photo-1533106418989-88406e76825a?q=80&w=800&auto=format&fit=crop"
                    />
                     <TribeCard 
                        title="Luxury Seekers" 
                        members="5.1k" 
                        image="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800&auto=format&fit=crop"
                    />
                     <TribeCard 
                        title="Culinary Explorers" 
                        members="15.8k" 
                        image="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop"
                    />
                </div>
            </AnimateOnScroll>
          </div>
      </section>

      {/* Pillars Section */}
      <section className="py-24" style={{ backgroundColor: 'var(--bg-secondary)'}}>
        <div className="max-w-6xl mx-auto px-4">
            <AnimateOnScroll>
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold font-cinzel" style={{ color: 'var(--text-primary)'}}>The Ecosystem</h2>
                    <p className="mt-4 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)'}}>
                        Built on three pillars that empower you to travel more, earn more, and connect deeper.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<MeetupsIcon />}
                        title="Stranger MeetUps™"
                        description="The cure for loneliness on the road. Join verified, safe, and curated events hosted by locals in 50+ cities."
                        link="/meetups"
                        linkText="Find Events"
                    />
                    <FeatureCard
                        icon={<PartnersIcon />}
                        title="B2B Partner Network"
                        description="Scale your travel business with our blockchain infrastructure. Access global inventory and instant settlements."
                        link="/partners/apply"
                        linkText="Partner With Us"
                    />
                    <FeatureCard
                        icon={<ReferIcon />}
                        title="Refer & Earn Protocol"
                        description="Turn your social network into net worth. Earn crypto rewards for every traveler you onboard to Vanhsya."
                        link="/refer-and-earn"
                        linkText="Start Earning"
                    />
                </div>
            </AnimateOnScroll>
        </div>
      </section>
      
      {/* Town Hall / Forum */}
      <section className="py-20 bg-[#050505]">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                    <h3 className="text-2xl font-bold font-cinzel text-white mb-8 flex items-center gap-3">
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                        Town Hall: Trending
                    </h3>
                    <div className="bg-gray-900/30 border border-gray-800 rounded-2xl overflow-hidden">
                        <DiscussionRow 
                            category="General"
                            title="Best hidden gems in Kyoto for photographers?"
                            author="LensWalker"
                            replies={42}
                            time="2h ago"
                        />
                         <DiscussionRow 
                            category="Visas"
                            title="Bali Digital Nomad Visa: My Experience applying in 2024"
                            author="SarahTravels"
                            replies={156}
                            time="4h ago"
                        />
                         <DiscussionRow 
                            category="Meetups"
                            title="Anyone in Mexico City next week for Dia de los Muertos?"
                            author="Carlos_X"
                            replies={23}
                            time="5h ago"
                        />
                         <DiscussionRow 
                            category="Crypto"
                            title="Proposal: Staking Vyno coins for Flight upgrades"
                            author="CryptoNomad"
                            replies={89}
                            time="1d ago"
                        />
                    </div>
                    <button className="mt-6 w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-bold text-gray-300 transition-colors">
                        View All Discussions
                    </button>
                </div>
                
                <div>
                    <h3 className="text-xl font-bold font-cinzel text-white mb-8">Top Ambassadors</h3>
                    <div className="space-y-4">
                        <AmbassadorCard 
                            name="Elena R." 
                            role="Global Scout" 
                            image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop"
                            badges={['Guide', 'Photographer']}
                        />
                         <AmbassadorCard 
                            name="Kenji T." 
                            role="Community Lead" 
                            image="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop"
                            badges={['Event Host', 'VIP']}
                        />
                         <AmbassadorCard 
                            name="Sofia M." 
                            role="Content Creator" 
                            image="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"
                            badges={['Blogger', 'Nomad']}
                        />
                    </div>
                </div>
            </div>
          </div>
      </section>

      {/* YNO Coin Section */}
      <section className="py-24 bg-gradient-to-br from-purple-900/20 to-black border-t border-purple-500/20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="inline-block p-4 rounded-full bg-purple-500/10 mb-6">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-cinzel text-white mb-6">The Future is Decentralized</h2>
            <p className="text-xl text-gray-300 mb-10 leading-relaxed">
              We are transitioning to a DAO. The Vanhsya platform will soon be governed by its most active contributors.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-2xl mx-auto mb-12">
                <div className="p-6 rounded-xl bg-gray-900 border border-gray-800">
                    <h4 className="font-bold text-lg text-white mb-2">💰 Earn YNO</h4>
                    <p className="text-sm text-gray-400">Receive tokens for hosting events, writing guides, and verifying locations.</p>
                </div>
                 <div className="p-6 rounded-xl bg-gray-900 border border-gray-800">
                    <h4 className="font-bold text-lg text-white mb-2">🗳️ Vote & Govern</h4>
                    <p className="text-sm text-gray-400">Use your tokens to vote on platform fees, new features, and partnership deals.</p>
                </div>
            </div>
            
            <Link to="/whitepaper" className="inline-block px-10 py-4 bg-white text-black font-black uppercase tracking-widest hover:bg-purple-400 hover:text-white transition-colors rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                Read the Whitepaper
            </Link>
          </div>
      </section>

    </div>
  );
};

export default CommunityPage;
