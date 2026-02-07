
import React, { useState, useEffect, useMemo } from 'react';
import AnimateOnScroll from '../components/AnimateOnScroll';

// --- Icons ---
const CoinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 10-2 0 1 1 0 002 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 2.5 2.5 0 00-3.536 0 1 1 0 01-1.414 0 1 1 0 00-1.414 1.414 2.5 2.5 0 00-.708 0z" clipRule="evenodd" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-900" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const ChestIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const TrophyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;

const StreakDay: React.FC<{ day: number; state: 'claimed' | 'current' | 'locked'; isBig?: boolean }> = ({ day, state, isBig }) => {
    let bgClass = "bg-zinc-900 border-zinc-800";
    let content = <span className="text-gray-600 text-xs font-mono">+{day * 10}</span>;

    if (state === 'claimed') {
        bgClass = "bg-green-500 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]";
        content = <CheckIcon />;
    } else if (state === 'current') {
        bgClass = "bg-gradient-to-br from-cyan-500 to-blue-600 border-white ring-4 ring-cyan-400/20 animate-pulse";
        content = isBig ? <ChestIcon /> : <CoinIcon />;
    } else {
        content = isBig ? <div className="opacity-20"><ChestIcon /></div> : <span className="opacity-20 text-gray-500 text-xs font-mono">+{day * 10}</span>;
    }

    return (
        <div className="flex flex-col items-center gap-3">
            <div className={`w-12 h-12 sm:w-20 sm:h-20 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 transform ${state === 'current' ? 'scale-110' : 'hover:scale-105'} ${bgClass}`}>
                {content}
            </div>
            <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${state === 'current' ? 'text-cyan-400' : state === 'claimed' ? 'text-green-400' : 'text-zinc-600'}`}>
                {isBig ? 'LEGENDARY' : `Day ${day}`}
            </span>
        </div>
    );
};

const QuestItem: React.FC<{ title: string; reward: string; progress: number; target: number; completed?: boolean }> = ({ title, reward, progress, target, completed }) => {
    const percent = Math.min(100, (progress / target) * 100);
    return (
        <div className={`p-4 rounded-xl border transition-all ${completed ? 'bg-green-500/5 border-green-500/20 opacity-60' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h4 className={`font-bold text-sm ${completed ? 'line-through text-gray-500' : 'text-white'}`}>{title}</h4>
                    <p className="text-xs text-cyan-400 font-mono mt-1">Reward: {reward}</p>
                </div>
                {completed ? <div className="text-green-500"><CheckIcon /></div> : <div className="text-xs font-mono text-gray-500">{progress}/{target}</div>}
            </div>
            {!completed && (
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                </div>
            )}
        </div>
    );
};

const DailyRewardsPage: React.FC = () => {
    const [claimedBox, setClaimedBox] = useState(false);
    const [totalCredits, setTotalCredits] = useState(1250);
    const [streakCount, setStreakCount] = useState(3);

    const handleClaimBox = () => {
        if (!claimedBox) {
            setClaimedBox(true);
            setTotalCredits(prev => prev + 50);
        }
    };

    return (
        <div className="pt-24 min-h-screen bg-[#0A0A10] text-white selection:bg-cyan-500 selection:text-black">
            
            {/* Header / Stats Bar */}
            <section className="relative py-12 px-4 border-b border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(var(--accent-secondary-rgb),0.1)_0%,transparent_70%)]"></div>
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl md:text-6xl font-black font-cinzel tracking-tight text-white mb-2 uppercase">
                            Vault <span className="text-cyan-400">Access</span>
                        </h1>
                        <p className="text-gray-400 font-mono text-sm uppercase tracking-widest">Global Rewards Protocol v2.4</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-black/60 border border-white/10 px-6 py-4 rounded-2xl backdrop-blur-xl flex items-center gap-4">
                            <div className="p-3 bg-yellow-500/20 rounded-full"><CoinIcon /></div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-tighter">VYNO Balance</p>
                                <p className="text-2xl font-black text-white font-mono">{totalCredits.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="bg-black/60 border border-white/10 px-6 py-4 rounded-2xl backdrop-blur-xl flex items-center gap-4">
                            <div className="p-3 bg-cyan-500/20 rounded-full text-cyan-400"><TrophyIcon /></div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-tighter">Global Rank</p>
                                <p className="text-2xl font-black text-white font-mono">#421</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Rewards Grid */}
            <main className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
                
                {/* Left Column: Streak & Quests */}
                <div className="lg:col-span-2 space-y-12">
                    <section>
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <h2 className="text-2xl font-bold font-cinzel text-white uppercase tracking-wider">Active Streak</h2>
                                <p className="text-sm text-gray-500">Collect 7 consecutive days for a Mega Chest.</p>
                            </div>
                            <span className="text-4xl font-black text-cyan-400 font-mono tracking-tighter">{streakCount} <span className="text-xs text-gray-500 font-sans uppercase">Days</span></span>
                        </div>
                        
                        <div className="relative p-8 bg-zinc-900/40 border border-zinc-800 rounded-3xl backdrop-blur-sm overflow-hidden">
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-zinc-800 -translate-y-1/2 z-0"></div>
                            <div className="relative z-10 flex justify-between gap-4">
                                {[1, 2, 3, 4, 5, 6, 7].map(day => (
                                    <StreakDay 
                                        key={day} 
                                        day={day} 
                                        state={day < streakCount ? 'claimed' : day === streakCount ? 'current' : 'locked'}
                                        isBig={day === 7}
                                    />
                                ))}
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold font-cinzel text-white mb-8 uppercase tracking-wider">Daily Quests</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <QuestItem title="The Architect" reward="150 VYNO" progress={1} target={1} completed={true} />
                            <QuestItem title="World Explorer" reward="300 VYNO" progress={120} target={500} />
                            <QuestItem title="Community Pillar" reward="100 VYNO" progress={2} target={5} />
                            <QuestItem title="Night Owl" reward="50 VYNO" progress={0} target={1} />
                        </div>
                    </section>
                </div>

                {/* Right Column: Loot Box & Wheel */}
                <div className="space-y-12">
                    <section className="relative group">
                        <div className={`absolute inset-0 bg-gradient-to-br from-cyan-600 to-purple-600 rounded-3xl blur-2xl transition-opacity duration-700 ${claimedBox ? 'opacity-0' : 'opacity-40 group-hover:opacity-60'}`}></div>
                        <div className="relative bg-zinc-900 border border-white/10 rounded-3xl p-10 text-center shadow-2xl">
                            {claimedBox ? (
                                <div className="animate-fadeIn">
                                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-green-500/50">
                                        <CheckIcon />
                                    </div>
                                    <h3 className="text-3xl font-black mb-2 uppercase">Sync Complete</h3>
                                    <p className="text-green-400 font-mono text-sm">+50 VYNO CREDITS</p>
                                    <div className="mt-8 pt-8 border-t border-white/5">
                                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Next Box available in:</p>
                                        <p className="text-2xl font-mono mt-2">14:22:09</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="text-8xl mb-8 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 drop-shadow-[0_0_30px_rgba(0,242,254,0.5)]">
                                        📦
                                    </div>
                                    <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">Daily Signal Box</h3>
                                    <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                                        Decrypt your daily mystery parcel to unlock travel credits or rare status XP.
                                    </p>
                                    <button 
                                        onClick={handleClaimBox}
                                        className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] text-xs hover:bg-cyan-400 transition-colors rounded-xl shadow-lg shadow-white/5"
                                    >
                                        INITIALIZE DECRYPT
                                    </button>
                                </>
                            )}
                        </div>
                    </section>

                    <section className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-3xl p-8 overflow-hidden relative">
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]"></div>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-3 font-cinzel">
                             <span className="text-2xl">🎡</span> MEGA WHEEL
                        </h3>
                        <p className="text-gray-500 text-xs mb-8 uppercase tracking-widest font-bold">Available Day 7 Only</p>
                        
                        <div className="relative aspect-square max-w-[200px] mx-auto opacity-30 grayscale pointer-events-none">
                            <div className="absolute inset-0 rounded-full border-8 border-dashed border-zinc-700 animate-spin-slow"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <LockIcon />
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-8 p-4 bg-black/40 rounded-xl border border-white/5">
                            <p className="text-[10px] text-gray-500 font-mono uppercase">Loot Probability:</p>
                            <div className="mt-2 space-y-2">
                                <div className="flex justify-between text-[10px]"><span className="text-gray-400">1,000 VYNO</span> <span className="text-white">60%</span></div>
                                <div className="flex justify-between text-[10px]"><span className="text-cyan-400">Weekend Trip</span> <span className="text-white">5%</span></div>
                                <div className="flex justify-between text-[10px]"><span className="text-purple-400">Status Upgrade</span> <span className="text-white">15%</span></div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {/* Winners Ticker */}
            <div className="w-full bg-zinc-950 border-y border-white/5 py-4 overflow-hidden mt-12 relative">
                <div className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-zinc-950 to-transparent z-10"></div>
                <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-zinc-950 to-transparent z-10"></div>
                <div className="animate-[slide-in-from-right_40s_linear_infinite] inline-block whitespace-nowrap text-xs font-mono text-gray-500">
                    {[1,2,3,4,5].map(i => (
                        <React.Fragment key={i}>
                            <span className="mx-12 uppercase tracking-widest font-bold"><span className="text-cyan-400">AGENT_009</span> claimed 500 VYNO •</span>
                            <span className="mx-12 uppercase tracking-widest font-bold"><span className="text-purple-400">NOMAD_LUXE</span> reached 30 Day Streak •</span>
                            <span className="mx-12 uppercase tracking-widest font-bold"><span className="text-yellow-400">VIP_ELENA</span> unlocked MEGA BOX •</span>
                            <span className="mx-12 uppercase tracking-widest font-bold"><span className="text-white">USER_X72</span> won Free Desert Safari •</span>
                        </React.Fragment>
                    ))}
                </div>
            </div>
            
            <section className="py-24 text-center max-w-2xl mx-auto px-4">
                <AnimateOnScroll>
                    <h2 className="text-3xl font-bold font-cinzel mb-6 uppercase">VYNO Utility</h2>
                    <p className="text-gray-400 leading-relaxed mb-10">
                        VYNO is the native fuel of the Vanhsya ecosystem. Stake your rewards to lower booking fees, gain early access to partner inventory, or trade them on the decentralized marketplace coming in Q1 2025.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <span className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-widest text-gray-400">Staking Pool: 14% APY</span>
                        <span className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-widest text-gray-400">Fees: Burn Active</span>
                    </div>
                </AnimateOnScroll>
            </section>

        </div>
    );
};

export default DailyRewardsPage;
