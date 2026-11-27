import React from 'react';
import { Link } from 'react-router-dom';
import SeoHead from '../components/SeoHead';

const WhitepaperPage: React.FC = () => {
  return (
    <div className="pt-28 pb-24 min-h-screen bg-[#0D0A14] text-gray-200 px-4">
      <SeoHead
        title="Technical Concept Archive | Vanhsya Global Travels"
        description="Informational technical architecture overview for Vanhsya Global Travels. Token financial promotions and staking claims remain suspended pending separate compliance review."
      />

      <div className="max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-4">
          <span className="inline-block px-4 py-1 rounded-full border border-purple-500/30 bg-purple-900/20 text-[#C4B5FD] font-mono text-xs uppercase tracking-widest">
            Informational Concept Document
          </span>
          <h1 className="text-4xl md:text-6xl font-black font-cinzel text-white">
            Vanhsya Ecosystem Architecture
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Overview of Vanhsya Global Travels’ digital concierge, VR route previews, and UAE real-world community platform.
          </p>
        </div>

        {/* Strict Compliance Gate */}
        <div className="p-6 rounded-2xl border border-amber-500/40 bg-amber-950/20 text-amber-100 text-sm leading-relaxed space-y-2">
          <p className="font-mono text-xs uppercase tracking-wider text-amber-300 font-bold">
            Regulatory & Compliance Notice
          </p>
          <p>
            No public token offering, token financial promotion, staking mechanism, or yield program is active on this platform. Any future Web3 utility concepts remain strictly suspended pending an independent legal and regulatory compliance review.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-7 rounded-2xl bg-[#151121] border border-white/10 space-y-3">
            <h2 className="text-xl font-cinzel font-bold text-white">1. Vanhsya Social Club (UAE 18+)</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Our active UAE community engine powers curated Stranger MeetUps, Founding Member ID passes, verified host applications, check-in codes, and consent-based communications.
            </p>
            <Link to="/social-club" className="inline-block text-xs font-mono text-[#C4B5FD] hover:text-white underline">
              Explore Vanhsya Social Club →
            </Link>
          </div>

          <div className="p-7 rounded-2xl bg-[#151121] border border-white/10 space-y-3">
            <h2 className="text-xl font-cinzel font-bold text-white">2. AI Concierge & 3D VR Experience</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Server-proxied Gemini planning models generate tailored multi-day travel itineraries, paired with an interactive 3D globe and destination previews.
            </p>
            <Link to="/ai-planner" className="inline-block text-xs font-mono text-[#C4B5FD] hover:text-white underline">
              Open AI Concierge →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhitepaperPage;
