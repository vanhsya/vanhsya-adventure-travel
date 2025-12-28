
import React from 'react';
import AnimateOnScroll from '../components/AnimateOnScroll';

const SectionHeading: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
    <div className="mb-12 border-l-4 border-[var(--accent-secondary)] pl-6">
        <h2 className="text-3xl md:text-4xl font-bold font-cinzel text-white">{title}</h2>
        {subtitle && <p className="mt-2 text-gray-400">{subtitle}</p>}
    </div>
);

const TokenMetric: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
    <div className="bg-white/5 border border-white/10 p-6 rounded-lg backdrop-blur-sm">
        <p className={`text-sm font-bold uppercase tracking-widest mb-2`} style={{ color }}>{label}</p>
        <p className="text-2xl font-mono text-white">{value}</p>
    </div>
);

const RoadmapItem: React.FC<{ phase: string; title: string; items: string[]; completed?: boolean }> = ({ phase, title, items, completed }) => (
    <div className={`relative pl-8 border-l-2 ${completed ? 'border-green-500' : 'border-gray-700'} pb-12 last:pb-0`}>
        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ${completed ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-gray-800 border-2 border-gray-600'}`}></div>
        <div className="mb-2">
            <span className={`text-xs font-bold px-2 py-1 rounded ${completed ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-400'}`}>{phase}</span>
        </div>
        <h3 className={`text-xl font-bold mb-4 ${completed ? 'text-white' : 'text-gray-300'}`}>{title}</h3>
        <ul className="space-y-2">
            {items.map((item, i) => (
                <li key={i} className="flex items-start text-sm text-gray-400">
                    <span className="mr-2 text-gray-600">•</span>
                    {item}
                </li>
            ))}
        </ul>
    </div>
);

const WhitepaperPage: React.FC = () => {
    const handleDownload = () => {
        // In a real app, this would link to a PDF file.
        // For this demo, we'll trigger the browser's print function which allows saving as PDF.
        window.print();
    };

    return (
        <div className="pt-24 min-h-screen bg-[#0A0A10] text-gray-200">
            {/* Hero Header */}
            <section className="relative py-20 px-4 border-b border-white/10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="inline-block px-4 py-1 rounded-full border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-mono text-xs uppercase tracking-widest mb-6">
                        Technical Document v1.0
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black font-cinzel text-white mb-6">
                        The VYNO Protocol
                    </h1>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
                        Decentralizing the global travel economy through blockchain-verified experiences, community ownership, and the YNO utility token.
                    </p>
                    <button 
                        onClick={handleDownload}
                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Whitepaper (PDF)
                    </button>
                </div>
            </section>

            <div className="max-w-5xl mx-auto px-4 py-20 grid grid-cols-1 lg:grid-cols-4 gap-12">
                
                {/* Sidebar Navigation (Sticky on desktop) */}
                <aside className="hidden lg:block lg:col-span-1 sticky top-32 h-fit">
                    <nav className="space-y-4 text-sm font-mono text-gray-500 border-l border-white/10 pl-4">
                        <a href="#executive-summary" className="block hover:text-[var(--accent-secondary)] transition-colors">01. Executive Summary</a>
                        <a href="#problem-solution" className="block hover:text-[var(--accent-secondary)] transition-colors">02. Problem & Solution</a>
                        <a href="#tokenomics" className="block hover:text-[var(--accent-secondary)] transition-colors">03. Tokenomics</a>
                        <a href="#roadmap" className="block hover:text-[var(--accent-secondary)] transition-colors">04. Roadmap</a>
                        <a href="#governance" className="block hover:text-[var(--accent-secondary)] transition-colors">05. Governance</a>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="lg:col-span-3 space-y-20">
                    
                    {/* Executive Summary */}
                    <section id="executive-summary">
                        <SectionHeading title="Executive Summary" subtitle="The Vision for a Decentralized Travel Ecosystem" />
                        <div className="prose prose-invert prose-lg max-w-none text-gray-300">
                            <p>
                                Vanhsya is building the world's first AI-driven, blockchain-powered travel ecosystem. By leveraging the VYNO token, we aim to remove intermediaries, reduce booking fees by up to 15%, and reward travelers for their data and contributions to the network.
                            </p>
                            <p className="mt-4">
                                The current travel industry is fragmented and monopolized. Vanhsya proposes a unified protocol where value flows directly between hosts, guides, and explorers.
                            </p>
                        </div>
                    </section>

                    {/* Problem & Solution */}
                    <section id="problem-solution">
                        <SectionHeading title="Problem & Solution" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-red-900/10 p-6 rounded-lg border border-red-900/30">
                                <h3 className="text-xl font-bold text-red-400 mb-4">The Problem</h3>
                                <ul className="space-y-3 text-sm text-gray-400">
                                    <li>❌ High Intermediary Fees (15-30%)</li>
                                    <li>❌ Centralized Data Ownership</li>
                                    <li>❌ Lack of Trust in Reviews</li>
                                    <li>❌ Currency Exchange Friction</li>
                                </ul>
                            </div>
                            <div className="bg-green-900/10 p-6 rounded-lg border border-green-900/30">
                                <h3 className="text-xl font-bold text-green-400 mb-4">The VYNO Solution</h3>
                                <ul className="space-y-3 text-sm text-gray-400">
                                    <li>✅ Peer-to-Peer Transactions (&lt;1% Fee)</li>
                                    <li>✅ User-Owned Data & Identity</li>
                                    <li>✅ Proof-of-Travel (NFT Verification)</li>
                                    <li>✅ Universal Travel Currency (VYNO)</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Tokenomics */}
                    <section id="tokenomics">
                        <SectionHeading title="Tokenomics" subtitle="Distribution and Utility of VYNO Coin" />
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                            <TokenMetric label="Ticker" value="$VYNO" color="#a855f7" />
                            <TokenMetric label="Total Supply" value="1,000,000,000" color="#3b82f6" />
                            <TokenMetric label="Network" value="Ethereum / L2" color="#eab308" />
                            <TokenMetric label="Type" value="Utility / Gov" color="#ef4444" />
                        </div>

                        <div className="bg-white/5 rounded-xl p-8 mb-8">
                            <h3 className="text-lg font-bold text-white mb-6">Token Distribution</h3>
                            <div className="space-y-4">
                                {/* Simple bar charts */}
                                <div>
                                    <div className="flex justify-between text-xs uppercase text-gray-400 mb-1"><span>Community Rewards</span><span>40%</span></div>
                                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-[var(--accent-secondary)] w-[40%]"></div></div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs uppercase text-gray-400 mb-1"><span>Development & Operations</span><span>20%</span></div>
                                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[20%]"></div></div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs uppercase text-gray-400 mb-1"><span>Investors & Partners</span><span>15%</span></div>
                                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-yellow-500 w-[15%]"></div></div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs uppercase text-gray-400 mb-1"><span>Team (Vested 4 Years)</span><span>15%</span></div>
                                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-red-500 w-[15%]"></div></div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs uppercase text-gray-400 mb-1"><span>Liquidity Pool</span><span>10%</span></div>
                                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[10%]"></div></div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Roadmap */}
                    <section id="roadmap">
                        <SectionHeading title="Roadmap" subtitle="The Path to Decentralization" />
                        <div className="ml-4">
                            <RoadmapItem 
                                phase="Phase 1: Q1-Q2 2024"
                                title="Foundation & Genesis"
                                completed={true}
                                items={[
                                    "Platform Launch (Web2 Hybrid)",
                                    "Community Building",
                                    "Partnership Program Pilot",
                                    "Whitepaper Release"
                                ]}
                            />
                             <RoadmapItem 
                                phase="Phase 2: Q3-Q4 2024"
                                title="The Blueprint & Gamification"
                                completed={true}
                                items={[
                                    "Launch of Treasure Hunt (The Blueprint)",
                                    "Implementation of Travel Credits",
                                    "Mobile App Beta",
                                    "Global Partner Expansion"
                                ]}
                            />
                             <RoadmapItem 
                                phase="Phase 3: Q1-Q2 2025"
                                title="Token Generation Event (TGE)"
                                completed={false}
                                items={[
                                    "VYNO Token Launch",
                                    "Staking Dashboard Live",
                                    "Integration of Crypto Payments",
                                    "First DAO Governance Vote"
                                ]}
                            />
                             <RoadmapItem 
                                phase="Phase 4: Q3 2025+"
                                title="Full Decentralization"
                                completed={false}
                                items={[
                                    "Transition to Community Governance",
                                    "Open Source Protocol",
                                    "Metaverse Travel Hub",
                                    "Interplanetary Travel Planning (Vision)"
                                ]}
                            />
                        </div>
                    </section>
                </main>
            </div>
            
            <section className="bg-[var(--accent-secondary)] text-white py-16 text-center">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-3xl font-bold font-cinzel mb-6">Join the Revolution</h2>
                    <p className="text-purple-100 mb-8">Be an early adopter of the Vanhsya ecosystem. Start earning rewards today through our referral and creator programs.</p>
                    <div className="flex justify-center gap-4">
                        <a href="#/partners/apply" className="px-8 py-3 bg-white text-[var(--accent-secondary)] font-bold rounded-full hover:bg-gray-100 transition-colors">Become a Partner</a>
                        <a href="#/treasure-hunt" className="px-8 py-3 bg-purple-900 text-white font-bold rounded-full hover:bg-purple-800 transition-colors">Join The Hunt</a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default WhitepaperPage;
