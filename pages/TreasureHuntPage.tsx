
import React, { useState, useEffect } from 'react';
import AnimateOnScroll from '../components/AnimateOnScroll';
import { Link } from 'react-router-dom';

// --- Components ---

const DecryptingText: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
    const [display, setDisplay] = useState(text.split('').map(() => '#').join(''));
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

    useEffect(() => {
        let iteration = 0;
        const interval = setInterval(() => {
            setDisplay(text.split('').map((letter, index) => {
                if (index < iteration) return text[index];
                return chars[Math.floor(Math.random() * chars.length)];
            }).join(''));

            if (iteration >= text.length) clearInterval(interval);
            iteration += 1 / 3;
        }, 30);
        return () => clearInterval(interval);
    }, [text]);

    return <span className={`font-mono ${className}`}>{display}</span>;
};

const VaultCounter: React.FC<{ target: number; prefix?: string }> = ({ target, prefix = 'AED ' }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const duration = 2500;
        const steps = 50;
        const stepValue = target / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += stepValue;
            if (current >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, duration / steps);
        return () => clearInterval(timer);
    }, [target]);

    return <span>{prefix}{count.toLocaleString()}</span>;
};

const AccessLevelCard: React.FC<{ level: string; title: string; price: string; usdPrice: string; rewards: string[]; active?: boolean; tag?: string; color: string }> = ({ level, title, price, usdPrice, rewards, active, tag, color }) => (
    <div className={`relative p-8 rounded-xl border transition-all duration-500 group overflow-hidden flex flex-col h-full hover:-translate-y-2 ${active ? `border-${color}-500 bg-${color}-900/10 shadow-[0_0_40px_rgba(var(--color-rgb),0.15)]` : `border-zinc-800 bg-zinc-900/40 hover:border-${color}-500/50`}`}>
        
        {/* Holographic scanning effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-1000 ease-in-out z-0 pointer-events-none"></div>
        
        {tag && (
            <div className={`absolute top-0 right-0 bg-${color}-600 text-black text-xs font-black px-4 py-1 uppercase tracking-widest`}>
                {tag}
            </div>
        )}
        
        <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className={`text-${color}-500 font-mono text-xs uppercase tracking-[0.2em] mb-2`}>{level}</p>
                    <h3 className="text-3xl font-cinzel font-black text-white">{title}</h3>
                </div>
            </div>
            <div className="mb-8 p-4 bg-black/50 border border-white/5 rounded-lg">
                <div className="flex items-baseline gap-2">
                    <p className={`text-4xl font-black text-${color}-400`}>{price}</p>
                    <span className="text-sm text-gray-500 font-mono">/ {usdPrice}</span>
                </div>
                <p className="text-xs text-gray-400 mt-2 font-mono uppercase">/// Per Person Entry</p>
            </div>
            
            <ul className="space-y-4 mb-10 flex-grow">
                {rewards.map((reward, i) => (
                    <li key={i} className="flex items-start text-sm text-gray-300 group-hover:text-white transition-colors">
                        <span className={`mt-1.5 w-1.5 h-1.5 bg-${color}-500 shadow-[0_0_8px_currentColor] rounded-full mr-3 flex-shrink-0`}></span>
                        <span className="leading-tight font-light tracking-wide">{reward}</span>
                    </li>
                ))}
            </ul>

            <button className={`w-full py-4 text-sm font-bold uppercase tracking-[0.2em] border transition-all relative overflow-hidden group/btn ${active ? `bg-${color}-600 text-black border-${color}-600 hover:bg-${color}-500` : 'bg-transparent text-gray-400 border-zinc-700 hover:border-white hover:text-white'}`}>
                <span className="relative z-10 flex items-center justify-center gap-2">
                    {active ? 'Initialize Protocol' : 'Access Data'}
                </span>
            </button>
        </div>
    </div>
);

const MysteryCard: React.FC<{ icon: React.ReactNode; title: string; description: string; color: string }> = ({ icon, title, description, color }) => (
    <div className={`p-8 rounded-xl border border-${color}-900/30 bg-black/80 backdrop-blur-md relative overflow-hidden group hover:border-${color}-500/60 transition-all duration-500 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]`}>
        <div className={`absolute inset-0 bg-gradient-to-br from-${color}-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
        <div className="relative z-10 flex flex-col items-center text-center">
            <div className={`mb-6 p-5 rounded-full border border-${color}-500/30 bg-${color}-900/20 text-${color}-400 group-hover:scale-110 transition-transform duration-300 group-hover:text-${color}-300 group-hover:border-${color}-400 shadow-[0_0_15px_rgba(0,0,0,0.3)]`}>
                {icon}
            </div>
            <h3 className={`text-xl font-bold font-cinzel text-${color}-100 mb-3`}>{title}</h3>
            <p className="text-gray-400 leading-relaxed text-sm font-light">{description}</p>
        </div>
    </div>
);

const LiveTicker: React.FC = () => (
    <div className="bg-purple-900 text-white py-2 overflow-hidden whitespace-nowrap border-y border-purple-500/50 relative z-50">
        <div className="animate-[slide-in-from-right_40s_linear_infinite] inline-block font-mono text-xs font-bold uppercase tracking-[0.3em]">
            <span className="mx-12 text-purple-300">/// VYNO COIN MINING ACTIVE ///</span>
            <span className="mx-12">/// AGENT_X FOUND 'GENESIS BLOCK' (AED 33,000) ///</span>
            <span className="mx-12 text-yellow-400">/// PROTOCOL 333 ENGAGED IN DUBAI MARINA ///</span>
            <span className="mx-12">/// NEW DROP: THE PALM VAULT ///</span>
            <span className="mx-12 text-purple-300">/// GLOBAL LEDGER UPDATING... ///</span>
        </div>
    </div>
);

const TreasureHuntPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#050505] text-gray-200 pt-24 overflow-x-hidden selection:bg-purple-500 selection:text-white">
            
            <LiveTicker />

            {/* Cinematic Hero */}
            <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <img 
                        src="https://images.unsplash.com/photo-1518684079-3c830dcef090?q=80&w=2787&auto=format&fit=crop" 
                        alt="UAE Desert Night" 
                        className="w-full h-full object-cover opacity-20 scale-105 animate-kenburns grayscale contrast-150"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.08)_0%,transparent_70%)]"></div>
                </div>

                <div className="relative z-10 text-center px-4 max-w-6xl mx-auto mt-10">
                    <div className="mb-8 inline-flex items-center gap-3 px-6 py-2 rounded-full border border-purple-500/30 bg-purple-900/10 backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                        <span className="text-purple-300 text-xs font-mono uppercase tracking-[0.2em] font-bold">VYNO NETWORK: ONLINE</span>
                    </div>
                    
                    <h1 className="text-6xl md:text-9xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-b from-white via-purple-100 to-purple-900 drop-shadow-[0_0_35px_rgba(168,85,247,0.3)] mb-6 leading-tight">
                        THE BLUEPRINT
                    </h1>
                    <div className="flex justify-center mb-10">
                         <h2 className="text-lg md:text-2xl font-mono text-purple-400 bg-black/80 px-8 py-2 border-x border-purple-500/50 backdrop-blur-xl">
                            <span className="mr-4 text-gray-500">STATUS:</span>
                            <DecryptingText text="ENCRYPTED REWARDS DETECTED" className="text-white shadow-purple-500" />
                        </h2>
                    </div>

                    <p className="text-xl text-gray-400 font-light max-w-3xl mx-auto mb-16 leading-relaxed">
                        A real-world crypto scavenger hunt. Select your protocol, find the physical keys hidden across the UAE, and unlock <span className="text-purple-400 font-bold glow-text">VYNO Coin</span> & Luxury Assets.
                    </p>
                    
                    <div className="flex flex-col md:flex-row justify-center gap-6">
                        <button className="group relative px-12 py-5 bg-purple-600 text-white font-black uppercase tracking-[0.25em] overflow-hidden hover:bg-purple-500 transition-colors shadow-[0_0_40px_rgba(168,85,247,0.4)] clip-path-slant">
                            <span className="relative z-10 flex items-center gap-2">
                                Initialize <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </span>
                        </button>
                    </div>
                </div>
            </section>

            {/* UAE VAULT (Prize Pool) */}
            <section className="py-24 border-y border-zinc-800 bg-zinc-900/20 backdrop-blur-sm relative">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col lg:flex-row gap-16 items-center">
                        <div className="flex-1 text-center lg:text-left">
                            <h3 className="text-purple-400 font-mono text-sm uppercase tracking-[0.3em] mb-4 flex items-center justify-center lg:justify-start gap-2">
                                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                                Global Loot Pool
                            </h3>
                            <div className="text-5xl md:text-8xl font-black text-white font-mono tracking-tighter mb-6 tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                <VaultCounter target={2500000} prefix="$ " />
                            </div>
                            <p className="text-gray-400 max-w-md text-lg leading-relaxed">
                                Total value of VYNO Coins, NFTs, and Real-World Assets currently locked in smart contracts hidden across the 7 Emirates.
                            </p>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-6 w-full">
                            <div className="bg-black/40 border border-zinc-700/50 p-8 rounded-2xl text-center hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                                <p className="text-4xl font-black text-white mb-2">111</p>
                                <p className="text-xs text-purple-400 uppercase tracking-widest font-bold">Signal Keys</p>
                            </div>
                            <div className="bg-black/40 border border-zinc-700/50 p-8 rounded-2xl text-center hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                                <p className="text-4xl font-black text-white mb-2">222</p>
                                <p className="text-xs text-purple-400 uppercase tracking-widest font-bold">Cipher Boxes</p>
                            </div>
                            <div className="bg-black/40 border border-zinc-700/50 p-8 rounded-2xl text-center hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                                <p className="text-4xl font-black text-white mb-2">333</p>
                                <p className="text-xs text-purple-400 uppercase tracking-widest font-bold">Oracle Nodes</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-900/40 to-black border border-purple-500/30 p-8 rounded-2xl text-center relative overflow-hidden group cursor-pointer hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                                <div className="absolute inset-0 bg-purple-500/10 animate-pulse"></div>
                                <p className="text-4xl font-black text-purple-300 mb-2 group-hover:scale-110 transition-transform">VYNO</p>
                                <p className="text-xs text-white uppercase tracking-widest font-bold">Token Airdrop</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
            </section>

            {/* 111, 222, 333 Pricing Protocols */}
            <section className="py-32 relative bg-[#050505]">
                <div className="max-w-7xl mx-auto px-4">
                    <AnimateOnScroll>
                        <div className="text-center mb-20">
                            <h2 className="text-5xl font-cinzel font-black text-white mb-6">Select Your Protocol</h2>
                            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                                Access the Vanhsya Network. Higher protocols yield greater VYNO Coin multipliers and rarer physical rewards.
                            </p>
                        </div>
                    </AnimateOnScroll>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                        
                        {/* 111 - Entry */}
                        <AnimateOnScroll delay="0ms">
                            <AccessLevelCard 
                                level="Protocol 111"
                                title="The Signal"
                                price="AED 111"
                                usdPrice="$30 USD"
                                color="blue"
                                rewards={[
                                    "Entry Level Mystery Box",
                                    "100 VYNO Coins (Guaranteed)",
                                    "Standard GPS Clues",
                                    "Digital NFT Badge"
                                ]}
                            />
                        </AnimateOnScroll>

                        {/* 222 - Popular */}
                        <AnimateOnScroll delay="200ms">
                            <div className="transform md:-translate-y-4">
                                <AccessLevelCard 
                                    level="Protocol 222"
                                    title="The Cipher"
                                    price="AED 222"
                                    usdPrice="$60 USD"
                                    active={true}
                                    tag="Recommended"
                                    color="purple"
                                    rewards={[
                                        "Rare Mystery Box (2x Value)",
                                        "500 VYNO Coins + Multiplier",
                                        "AR-Enhanced Clues",
                                        "Chance for Hardware Wallets",
                                        "Priority Support Channel"
                                    ]}
                                />
                            </div>
                        </AnimateOnScroll>

                        {/* 333 - Elite */}
                        <AnimateOnScroll delay="400ms">
                            <AccessLevelCard 
                                level="Protocol 333"
                                title="The Oracle"
                                price="AED 333"
                                usdPrice="$90 USD"
                                tag="High Stakes"
                                color="yellow"
                                rewards={[
                                    "Legendary Mystery Box (10x Value)",
                                    "1,500 VYNO Coins + Staking",
                                    "Luxury Real-World Keys (Hotels/VIP)",
                                    "Personal 'Handler' Guide",
                                    "Exclusive DAO Voting Rights"
                                ]}
                            />
                        </AnimateOnScroll>
                    </div>
                </div>
            </section>

             {/* The VYNO Coin Rewards */}
             <section className="py-24 bg-gradient-to-b from-purple-900/10 to-black border-y border-purple-900/30">
                <div className="max-w-6xl mx-auto px-4">
                     <AnimateOnScroll>
                        <div className="text-center mb-16">
                            <span className="text-purple-400 font-mono text-xs uppercase tracking-[0.3em] font-bold">/// REWARD SYSTEM ///</span>
                            <h2 className="text-4xl font-cinzel font-bold text-white mt-4 mb-4">What's In The Box?</h2>
                            <p className="text-gray-400 max-w-2xl mx-auto">
                                Every protocol key guarantees a reward. The question is: how rare is your loot?
                            </p>
                        </div>
                    </AnimateOnScroll>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <MysteryCard 
                            icon={<span className="text-4xl">💎</span>}
                            title="VYNO Coin Bags"
                            color="purple"
                            description="The fuel of our ecosystem. Find bags ranging from 100 to 10,000 VYNO. Stake them for travel interest or trade on the marketplace (Coming Q4)."
                        />
                        <MysteryCard 
                            icon={<span className="text-4xl">🗝️</span>}
                            title="Physical Assets"
                            color="blue"
                            description="Unlock real-world treasures hidden in plain sight. Latest iPhones, DJI Drones, Luxury Watch Vouchers, and 5-Star Hotel Staycations."
                        />
                        <MysteryCard 
                            icon={<span className="text-4xl">👑</span>}
                            title="Status & Perks"
                            color="yellow"
                            description="Gain permanent status in the Vanhsya Network. Access VIP lounges, skip queues on tours, and get invited to private yacht parties."
                        />
                    </div>
                </div>
            </section>

             {/* Final CTA */}
             <section className="py-32 text-center px-4 relative overflow-hidden bg-black">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <div className="relative z-10 max-w-3xl mx-auto">
                    <h2 className="text-6xl font-cinzel font-black text-white mb-6">Join The Hunt</h2>
                    <p className="text-purple-200/70 text-lg mb-12 max-w-xl mx-auto font-light">
                        The blockchain meets the real world. Your adventure begins with a single key.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-6">
                        <button className="px-12 py-5 bg-white text-black font-black text-lg tracking-[0.2em] uppercase hover:bg-purple-400 transition-colors shadow-[0_0_50px_rgba(255,255,255,0.3)]">
                            <span className="inline-block">Acquire Protocol 111</span>
                        </button>
                        <Link to="/whitepaper" className="px-12 py-5 bg-transparent text-purple-400 border border-purple-500/50 font-black text-lg tracking-[0.2em] uppercase hover:bg-purple-900/20 hover:border-purple-400 transition-colors inline-block">
                             <span className="inline-block">Read Whitepaper</span>
                        </Link>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default TreasureHuntPage;
