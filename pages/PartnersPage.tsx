
import React from 'react';
import AnimateOnScroll from '../components/AnimateOnScroll';

const PricingCard: React.FC<{ 
    tier: string; 
    price: string; 
    color: string; 
    features: string[]; 
    recommended?: boolean 
}> = ({ tier, price, color, features, recommended }) => (
    <div className={`relative flex flex-col p-8 rounded-2xl border transition-all duration-300 ${recommended ? `bg-gradient-to-b from-${color}-900/20 to-black border-${color}-500 shadow-2xl shadow-${color}-900/20 transform md:-translate-y-4` : 'bg-gray-900/40 border-gray-700 hover:border-gray-500'}`}>
        {recommended && (
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-${color}-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider`}>
                Most Popular
            </div>
        )}
        <div className="mb-6">
            <h3 className={`text-sm font-bold uppercase tracking-widest text-${color}-400 mb-2`}>{tier}</h3>
            <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">$</span>
                <span className="text-5xl font-black text-white">{price}</span>
            </div>
            <p className="text-gray-500 text-sm mt-2">One-time initiation fee</p>
        </div>
        
        <ul className="space-y-4 mb-8 flex-grow">
            {features.map((feature, i) => (
                <li key={i} className="flex items-start text-sm text-gray-300">
                    <svg className={`w-5 h-5 mr-3 text-${color}-500 flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                </li>
            ))}
        </ul>

        <button className={`w-full py-4 rounded-xl font-bold transition-all ${recommended ? `bg-${color}-600 text-white hover:bg-${color}-500 shadow-lg shadow-${color}-600/30` : 'bg-white/5 text-white hover:bg-white/10'}`}>
            Select Plan
        </button>
    </div>
);

const PartnersPage: React.FC = () => {
  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#0A0A10] text-white">
      
      {/* Hero Section */}
      <section className="text-center py-20 px-4 max-w-5xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-black font-cinzel mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Scale With Vanhsya
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Join the world's fastest-growing decentralized travel network. Unlock global inventory, crypto-native payment tools, and a dedicated support team to grow your travel business.
        </p>
      </section>

      {/* Pricing Section */}
      <section className="px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            
            {/* Tier 1 */}
            <AnimateOnScroll delay="0ms">
                <PricingCard 
                    tier="Global Scout"
                    price="999"
                    color="blue"
                    features={[
                        "Basic Partner Dashboard",
                        "Access to Global Inventory (Standard Rates)",
                        "Vanhsya Verified Badge",
                        "Standard Email Support",
                        "Monthly Performance Report",
                        "Listing on Partner Directory"
                    ]}
                />
            </AnimateOnScroll>

            {/* Tier 2 */}
            <AnimateOnScroll delay="200ms">
                <PricingCard 
                    tier="Regional Architect"
                    price="1,111"
                    color="purple"
                    recommended={true}
                    features={[
                        "Advanced Analytics Dashboard",
                        "Preferred Rates (5% Commission Boost)",
                        "Priority Listing in Search Results",
                        "24/7 Dedicated Account Manager",
                        "Marketing Kit Access",
                        "Early Access to New Features",
                        "Cross-promotion on Social Media"
                    ]}
                />
            </AnimateOnScroll>

            {/* Tier 3 */}
            <AnimateOnScroll delay="400ms">
                <PricingCard 
                    tier="Enterprise Titan"
                    price="2,222"
                    color="yellow"
                    features={[
                        "White-label API Access",
                        "Highest Commission Tier (10% Boost)",
                        "Custom Booking Engine Integration",
                        "Dedicated Tech Support Squad",
                        "Quarterly Strategy Consultation",
                        "Co-branded Marketing Campaigns",
                        "Exclusive Invite to Annual Summit",
                        "Crypto Payment Gateway Integration"
                    ]}
                />
            </AnimateOnScroll>

        </div>
      </section>

      {/* Trust Section */}
      <section className="mt-32 text-center border-t border-white/10 pt-20">
          <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-8">Trusted by industry leaders worldwide</p>
          <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Mock Logos */}
              <div className="text-2xl font-black text-white">TRAVEL<span className="text-blue-500">CORP</span></div>
              <div className="text-2xl font-black text-white">SKY<span className="text-purple-500">BOUND</span></div>
              <div className="text-2xl font-black text-white">NOMA<span className="text-yellow-500">DIC</span></div>
              <div className="text-2xl font-black text-white">VISTA<span className="text-green-500">VIEW</span></div>
          </div>
      </section>

       <section className="mt-20 max-w-4xl mx-auto px-4 text-center">
            <div className="p-8 border-2 border-dashed border-purple-500/30 rounded-lg bg-gray-900/50">
                <h2 className="text-2xl font-semibold text-purple-400">Application Process</h2>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
                    <div className="p-4 bg-black/40 rounded-lg">
                        <span className="block text-2xl font-bold text-white mb-2">01</span>
                        <p className="text-sm text-gray-400">Select your partnership tier above.</p>
                    </div>
                    <div className="p-4 bg-black/40 rounded-lg">
                        <span className="block text-2xl font-bold text-white mb-2">02</span>
                        <p className="text-sm text-gray-400">Submit business verification documents.</p>
                    </div>
                    <div className="p-4 bg-black/40 rounded-lg">
                        <span className="block text-2xl font-bold text-white mb-2">03</span>
                        <p className="text-sm text-gray-400">Complete payment via Card or Crypto.</p>
                    </div>
                     <div className="p-4 bg-black/40 rounded-lg">
                        <span className="block text-2xl font-bold text-white mb-2">04</span>
                        <p className="text-sm text-gray-400">Get onboarded within 48 hours.</p>
                    </div>
                </div>
            </div>
        </section>

    </div>
  );
};

export default PartnersPage;
