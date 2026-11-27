import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import GuideBot from './GuideBot';
import { BRAND_CONTACTS } from '../utils/utm';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />
      <main className="flex-grow">{children}</main>
      <GuideBot />
      <a
        href={`${BRAND_CONTACTS.whatsappDirectUrl}?text=${encodeURIComponent('Hi Vanhsya Global Travels! I would like to enquire about bookings & UAE MeetUps.')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 left-4 z-[90] flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#0B1612]/95 hover:bg-[#10241D] border border-emerald-400/40 text-emerald-200 shadow-2xl backdrop-blur-md transition-all hover:scale-105"
        aria-label="WhatsApp Direct Connect +971 50 623 0702"
      >
        <svg className="w-5 h-5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.03 2a9.97 9.97 0 00-8.58 15.09L2 22l5.06-1.33A9.98 9.98 0 1012.03 2zm5.79 14.12c-.24.68-1.41 1.3-1.95 1.38-.5.07-1.14.1-1.84-.12-.43-.14-.98-.32-1.69-.63-2.97-1.28-4.91-4.27-5.06-4.47-.15-.2-1.21-1.61-1.21-3.07 0-1.46.77-2.18 1.04-2.48.27-.3.59-.38.79-.38h.57c.18 0 .43-.07.67.51.25.6.85 2.07.92 2.22.07.15.12.32.02.52-.1.2-.15.32-.3.49-.15.17-.31.38-.45.51-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.02 1.12.99 2.07 1.3 2.37 1.45.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.72.81 2.02.96.3.15.5.22.57.34.07.12.07.7-.17 1.38z" />
        </svg>
        <div className="leading-tight hidden sm:block">
          <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block">
            WhatsApp Bookings
          </span>
          <span className="text-xs font-mono font-semibold text-white">
            {BRAND_CONTACTS.whatsappDisplay}
          </span>
        </div>
      </a>
      <footer className="w-full bg-[#07060C] border-t border-purple-500/20 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Identity & Campaign */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-300">
                {BRAND_CONTACTS.clubName}
              </p>
              <h3 className="text-2xl font-bold font-cinzel text-white mt-1">
                {BRAND_CONTACTS.companyName}
              </h3>
            </div>
            <p className="text-sm text-purple-200 italic font-medium">
              "{BRAND_CONTACTS.campaignTitle}" · {BRAND_CONTACTS.tagline}
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              UAE's verified 18+ community for curated Stranger MeetUps, The Blueprint expeditions, AI travel planning, 3D VR previews, and Web3 wallet verification.
            </p>
            <p className="text-xs text-gray-400">{BRAND_CONTACTS.emiratesFocus}</p>
          </div>

          {/* Official Contacts & Channels */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300">
              Official Contacts &amp; Bookings
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <span className="text-xs uppercase tracking-wider text-gray-500 block">WhatsApp Direct Connect</span>
                <a
                  href={`${BRAND_CONTACTS.whatsappDirectUrl}?text=${encodeURIComponent('Hello Vanhsya! I have an enquiry / booking request.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-300 hover:text-emerald-200 font-mono font-semibold transition-colors"
                >
                  {BRAND_CONTACTS.whatsappDisplay}
                </a>
              </li>
              <li>
                <span className="text-xs uppercase tracking-wider text-gray-500 block">Website</span>
                <a
                  href={BRAND_CONTACTS.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-purple-300 font-medium transition-colors"
                >
                  {BRAND_CONTACTS.websiteDisplay}
                </a>
              </li>
              <li>
                <span className="text-xs uppercase tracking-wider text-gray-500 block">Instagram</span>
                <a
                  href={BRAND_CONTACTS.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-300 hover:text-white font-medium transition-colors"
                >
                  {BRAND_CONTACTS.instagramHandle}
                </a>
              </li>
              <li>
                <span className="text-xs uppercase tracking-wider text-gray-500 block">Bookings &amp; Ventures Desk</span>
                <a
                  href={`mailto:${BRAND_CONTACTS.email}`}
                  className="text-gray-200 hover:text-purple-300 transition-colors block"
                >
                  {BRAND_CONTACTS.email}
                </a>
                <span className="text-xs uppercase tracking-wider text-gray-500 block mt-2">Support &amp; Member Care</span>
                <a
                  href={`mailto:${BRAND_CONTACTS.supportEmail}`}
                  className="text-gray-200 hover:text-cyan-300 transition-colors block"
                >
                  {BRAND_CONTACTS.supportEmail}
                </a>
              </li>
            </ul>
          </div>

          {/* Explore & Compliance Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300">
              Platforms &amp; Experiences
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-300">
              <Link to="/book" className="hover:text-amber-300 transition-colors font-semibold text-amber-200">
                Travel Hub &amp; Booking
              </Link>
              <Link to="/ventures" className="hover:text-purple-300 transition-colors font-semibold text-purple-200">
                Invest, Hubs &amp; Charity
              </Link>
              <Link to="/treasure-hunt" className="hover:text-cyan-300 transition-colors">
                The Blueprint
              </Link>
              <Link to="/meetups" className="hover:text-purple-300 transition-colors">
                Stranger MeetUps
              </Link>
              <Link to="/social-club" className="hover:text-purple-300 transition-colors">
                Social Club (18+)
              </Link>
              <Link to="/ai-planner" className="hover:text-purple-300 transition-colors">
                AI Planner
              </Link>
              <Link to="/vr-experience" className="hover:text-purple-300 transition-colors">
                VR Experience
              </Link>
              <Link to="/vyno" className="hover:text-cyan-300 transition-colors">
                VYNO &amp; Web3
              </Link>
              <Link to="/daily-rewards" className="hover:text-amber-300 transition-colors">
                Daily Rewards
              </Link>
              <Link to="/community" className="hover:text-purple-300 transition-colors">
                Community &amp; Connects
              </Link>
              <Link to="/blogs" className="hover:text-purple-300 transition-colors">
                Travel Blogs
              </Link>
              <Link to="/partners/apply" className="hover:text-purple-300 transition-colors">
                Partners &amp; Hosts
              </Link>
              <Link to="/dashboard" className="hover:text-purple-300 transition-colors">
                Passport &amp; Reviews
              </Link>
              <Link to="/legal" className="hover:text-purple-300 transition-colors">
                Privacy &amp; Terms
              </Link>
              <Link to="/admin" className="hover:text-purple-300 transition-colors">
                Admin Console
              </Link>
            </div>
          </div>

          {/* Official Instagram QR Card */}
          <div className="flex flex-col items-start lg:items-end">
            <div className="p-3.5 rounded-2xl bg-[#110D1B] border border-purple-500/25 flex items-center gap-4 max-w-xs">
              <a
                href={BRAND_CONTACTS.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-20 h-20 rounded-xl overflow-hidden bg-white shrink-0 border border-white/20"
                title="Scan or tap to follow @vanhsyatravels on Instagram"
              >
                <img
                  src={BRAND_CONTACTS.instagramQrPath}
                  alt="Official @vanhsyatravels Instagram QR Code"
                  className="w-full h-full object-cover"
                />
              </a>
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  Follow on Instagram
                </p>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {BRAND_CONTACTS.instagramHandle}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Scan QR or visit{' '}
                  <a
                    href={BRAND_CONTACTS.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-300 underline"
                  >
                    {BRAND_CONTACTS.websiteDisplay}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
            <p>
              &copy; {new Date().getFullYear()} {BRAND_CONTACTS.companyName} · {BRAND_CONTACTS.clubName} ({BRAND_CONTACTS.audienceNote}). All Rights Reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/legal#privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/legal#guidelines" className="hover:text-white transition-colors">
                Community Guidelines
              </Link>
              <Link to="/legal#cancellation" className="hover:text-white transition-colors">
                Cancellation Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
