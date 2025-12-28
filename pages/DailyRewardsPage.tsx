
import React, { useState, useEffect } from 'react';
import AnimateOnScroll from '../components/AnimateOnScroll';

// --- Icons ---
const CoinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 10-2 0 1 1 0 002 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 2.5 2.5 0 00-3.536 0 1 1 0 01-1.414 0 1 1 0 00-1.414 1.414 2.5 2.5 0 00-.708 0z" clipRule="evenodd" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-900" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const ChestIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;

const StreakDay: React.FC<{ day: number; state: 'claimed' | 'current' | 'locked'; isBig?: boolean }> = ({ day, state, isBig }) => {
    let bgClass = "bg-gray-800 border-gray-700";
    let content = <span className="text-gray-500 text-sm">Day {day}</span>;

    if (state === 'claimed') {
        bgClass = "bg-green-400 border-green-500 shadow-[0_0_15px_rgba(74,222,128,0.4)]";
        content = <CheckIcon />;
    } else if (state === 'current') {
        bgClass = "bg-gradient-to-br from-purple-600 to-blue-600 border-white ring-2 ring-purple-400 ring-offset-2 ring-offset-black animate-pulse";
        content = isBig ? <ChestIcon /> : <CoinIcon />;
    } else {
        // Locked
        content = isBig ? <ChestIcon /> : <span className="opacity-30"><CoinIcon /></span>;
    }

    return (
        <div className={`flex flex-col items-center gap-2 ${isBig ? 'col-span-1 md:col-span-1' : ''}`}>
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl border-2 flex items-center justify-center transition-all ${bgClass}`}>
                {content}
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${state === 'current' ? 'text-white' : 'text-gray-600'}`}>
                {isBig ? 'MEGA' : `Day ${day}`}
            </span>
        </div>
    );
};

const StreakTracker: React.FC = () => {
    const days = [1, 2, 3, 4, 5, 6, 7];
    const currentDay = 3; 

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="flex justify-between items-end mb-4 px-2">
                <h3 className="text-gray-400 font-mono text-sm uppercase">Current Streak</h3>
                <span className="text-2xl font-black text-white">{currentDay} <span className="text-purple-500">DAYS</span></span>
            </div>
            <div className="grid grid-cols-7 gap-2 md:gap-4 p-6 bg-black/40 border border-gray-800 rounded-2xl backdrop-blur-sm">
                {days.map(day => (
                    <StreakDay 
                        key={day} 
                        day={day} 
                        state={day < currentDay ? 'claimed' : day === currentDay ? 'current' : 'locked'}
                        isBig={day === 7}
                    />
                ))}
            </div>
        </div>
    );
};

const InteractiveLootBox: React.FC = () => {
    const [claimed, setClaimed] = useState(false);
    
    const handleClaim = () => {
        if (!claimed) {
            setClaimed(true);
            // In a real app, verify server-side
        }
    };

    return (
        <div className="relative group max-w-sm mx-auto mt-16">
            <div className={`absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-xl transition-opacity duration-500 ${claimed ? 'opacity-0' : 'opacity-75 group-hover:opacity-100'}`}></div>
            <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-8 text-center overflow-hidden">
                {claimed ? (
                    <div className="animate-fadeIn">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckIcon />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Claimed!</h3>
                        <p className="text-gray-400 mb-4">+50 VYNO Credits</p>
                        <p className="text-xs text-gray-600">Come back tomorrow for more.</p>
                    </div>
                ) : (
                    <>
                         <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                            🎁
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Daily Mystery Box</h3>
                        <p className="text-gray-400 text-sm mb-6">Contains Credits, XP, or Travel Discounts.</p>
                        <button 
                            onClick={handleClaim}
                            className="w-full py-3 bg-white text-black font-black uppercase tracking-widest hover:bg-gray-200 transition-colors rounded-lg"
                        >
                            Open Now
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const WinnersTicker: React.FC = () => {
    return (
        <div className="w-full bg-gray-900/50 border-y border-white/5 py-3 overflow-hidden mt-12">
            <div className="animate-[slide-in-from-right_30s_linear_infinite] inline-block whitespace-nowrap text-xs font-mono text-gray-400">
                <span className="mx-8"><span className="text-purple-400 font-bold">Alex M.</span> just won 500 Credits</span>
                <span className="mx-8"><span className="text-green-400 font-bold">Sarah J.</span> reached 30 Day Streak</span>
                <span className="mx-8"><span className="text-blue-400 font-bold">Mike T.</span> unlocked 'Globetrotter' Badge</span>
                <span className="mx-8"><span className="text-yellow-400 font-bold">Elena R.</span> won a Free City Tour</span>
                <span className="mx-8"><span className="text-purple-400 font-bold">David K.</span> just won 100 Credits</span>
            </div>
        </div>
    );
};

const DailyRewardsPage: React.FC = () => {
  return (
    <div className="pt-24 min-h-screen bg-[#0A0A10] text-white">
      
      {/* Header */}
      <section className="text-center py-16 px-4">
        <h1 className="text-4xl md:text-5xl font-black font-cinzel tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-white to-yellow-500">
            Daily Rewards
        </h1>
        <p className="mt-4 text-gray-400 max-w-xl mx-auto">
          Log in daily to build your streak and unlock massive travel perks. Missing a day resets your progress!
        </p>
      </section>

      {/* Main Content */}
      <section className="px-4 pb-20">
        <StreakTracker />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
            <InteractiveLootBox />
            
            <div className="mt-16 md:mt-0 p-8 rounded-2xl border border-dashed border-gray-700 bg-gray-900/30">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="text-2xl">🎡</span> Spin The Wheel
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                    Every 7 days, unlock a spin on the Mega Wheel for a chance to win a free flight or hotel stay.
                </p>
                <div className="relative h-48 bg-black/50 rounded-xl flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[conic-gradient(at_center,_var(--tw-gradient-stops))] from-red-500 via-blue-500 to-green-500 animate-spin-slow"></div>
                    <div className="flex flex-col items-center">
                         <LockIcon />
                         <span className="text-xs font-bold uppercase tracking-widest mt-2 text-gray-500">Unlocks Day 7</span>
                    </div>
                </div>
            </div>
        </div>
      </section>

      <WinnersTicker />

    </div>
  );
};

export default DailyRewardsPage;
