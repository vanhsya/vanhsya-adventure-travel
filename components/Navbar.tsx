import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { LANGS, CURRENCIES, NAV_LINKS, TOURS_DATA } from '../constants';
import { BRAND_CONTACTS, captureUtmParams } from '../utils/utm';

const VanhsyaLogo: React.FC = () => (
  <svg className="h-9 w-9 text-purple-400 shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.5L3.5 7.5V17.5L12 22.5L20.5 17.5V7.5L12 2.5Z" stroke="var(--accent-secondary)" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M12 13L16.25 15.5L20.5 13M3.5 13L7.75 15.5L12 13" stroke="var(--accent-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.75 9.5L12 12L16.25 9.5" stroke="var(--accent-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const Navbar: React.FC = () => {
  const { lang, setLang, currency, setCurrency, theme, setTheme } = useAppContext();
  const { user, favorites } = useAuth();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Capture UTM campaign parameters on initial mount and route transitions
  useEffect(() => {
    captureUtmParams();
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const filteredTours = useMemo(() => {
    if (!searchQuery) return [];
    const lowerQuery = searchQuery.toLowerCase();
    return TOURS_DATA.filter(
      (tour) =>
        tour.title.toLowerCase().includes(lowerQuery) ||
        tour.city.toLowerCase().includes(lowerQuery) ||
        tour.country.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);
  }, [searchQuery]);

  const handleSearchSelect = (slug: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(`/tours/${slug}`);
  };

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  const navItems = (
    <>
      {NAV_LINKS.map((link) => (
        <NavLink
          key={link.href}
          to={link.href}
          className={({ isActive }) =>
            `whitespace-nowrap transition-colors px-2 py-1.5 rounded-lg text-[11px] xl:text-xs font-medium ${
              isActive
                ? 'text-purple-300 bg-purple-500/15 border border-purple-400/30'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`
          }
          onClick={() => setMobileMenuOpen(false)}
        >
          {link.label}
        </NavLink>
      ))}
    </>
  );

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
          <div
            className="flex items-center justify-between gap-3 px-3 py-2 bg-[var(--bg-secondary)]/85 header-blur rounded-xl border shadow-lg"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <Link to="/" className="flex items-center space-x-2 shrink-0">
              <VanhsyaLogo />
              <div className="leading-none">
                <span className="text-lg sm:text-xl font-bold font-cinzel tracking-wider block" style={{ color: 'var(--text-primary)' }}>
                  VANHSYA
                </span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-purple-300/80 block">
                  Social Club · UAE
                </span>
              </div>
            </Link>

            <nav className="hidden xl:flex items-center gap-0.5 overflow-x-auto">{navItems}</nav>

            <div className="hidden md:flex items-center gap-2 shrink-0">
              <Link
                to="/dashboard"
                title={user ? `Signed in as ${user.fullName}` : 'Sign in or open Explorer Dashboard'}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-purple-400/35 bg-purple-950/35 hover:bg-purple-900/50 text-purple-200 text-xs font-semibold transition-colors"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-cyan-400' : 'bg-purple-400'}`} />
                <span className="max-w-[90px] truncate">
                  {user ? user.fullName.split(' ')[0] : 'Account'}
                </span>
                {favorites.length > 0 && (
                  <span className="px-1 rounded bg-purple-500/30 text-[10px] font-mono text-white">
                    {favorites.length}
                  </span>
                )}
              </Link>
              <a
                href={BRAND_CONTACTS.whatsappDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`WhatsApp Direct Connect: ${BRAND_CONTACTS.whatsappDisplay}`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-500/35 bg-emerald-950/35 hover:bg-emerald-900/50 text-emerald-300 text-xs font-semibold transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="hidden 2xl:inline">WhatsApp</span>
              </a>

              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white/5 hover:bg-white/10 transition-colors text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                style={{ borderColor: 'var(--border-color)' }}
                aria-label="Search destinations"
              >
                <SearchIcon />
                <span className="hidden xl:inline">Search</span>
                <span className="text-[10px] opacity-60 border border-gray-500/50 rounded px-1 font-mono">⌘K</span>
              </button>

              <select
                className="border rounded-lg px-2 py-1.5 bg-transparent focus:outline-none text-xs"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                aria-label="Language selector"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                {LANGS.map((l) => (
                  <option key={l} value={l} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    {l.toUpperCase()}
                  </option>
                ))}
              </select>

              <select
                className="border rounded-lg px-2 py-1.5 bg-transparent focus:outline-none text-xs"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                aria-label="Currency selector"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    {c}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg border hover:bg-white/5 transition-colors"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </button>
            </div>

            <div className="flex xl:hidden items-center space-x-2">
              <a
                href={BRAND_CONTACTS.whatsappDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-lg border border-emerald-500/35 bg-emerald-950/35 text-emerald-300 text-[11px] font-semibold"
                aria-label="WhatsApp Enquiry"
              >
                WhatsApp
              </a>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-[var(--text-primary)] md:hidden"
                aria-label="Search"
              >
                <SearchIcon />
              </button>
              <button
                style={{ color: 'var(--text-primary)' }}
                onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle navigation menu"
                className="p-2 rounded-lg border border-white/10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div
              className="xl:hidden mt-2 p-4 bg-[var(--bg-secondary)]/95 header-blur rounded-xl border shadow-2xl"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <nav className="flex flex-col space-y-1.5">
                {navItems}
                <div className="pt-2 mt-2 border-t border-white/10 grid grid-cols-2 gap-1.5 text-xs">
                  <Link to="/partners/apply" onClick={() => setMobileMenuOpen(false)} className="px-2.5 py-1.5 text-gray-300 hover:text-white">
                    Partners &amp; Hosts
                  </Link>
                  <Link to="/blogs" onClick={() => setMobileMenuOpen(false)} className="px-2.5 py-1.5 text-gray-300 hover:text-white">
                    Journals &amp; Blogs
                  </Link>
                  <Link to="/legal" onClick={() => setMobileMenuOpen(false)} className="px-2.5 py-1.5 text-gray-300 hover:text-white">
                    Guidelines &amp; Legal
                  </Link>
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="px-2.5 py-1.5 text-gray-300 hover:text-white">
                    Admin Console
                  </Link>
                </div>
              </nav>
              <div className="mt-4 pt-4 border-t flex flex-wrap items-center justify-between gap-3" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                  <a href={BRAND_CONTACTS.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:underline">
                    {BRAND_CONTACTS.instagramHandle}
                  </a>
                  <span>·</span>
                  <a href={BRAND_CONTACTS.whatsappDirectUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-300 hover:underline">
                    {BRAND_CONTACTS.whatsappDisplay}
                  </a>
                  <span>·</span>
                  <a href={BRAND_CONTACTS.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:underline">
                    {BRAND_CONTACTS.websiteDisplay}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="border rounded-md px-2 py-1 bg-transparent text-xs"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-1.5 rounded-md border"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    aria-label="Toggle theme"
                  >
                    {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Search Modal */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-3">
              <div className="text-[var(--text-secondary)]">
                <SearchIcon />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search UAE tours, Dubai, Abu Dhabi, Ras Al Khaimah..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-base placeholder-gray-500 outline-none"
                style={{ color: 'var(--text-primary)' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold px-2 py-1 rounded hover:bg-white/5 transition-colors"
              >
                ESC
              </button>
            </div>

            {searchQuery && (
              <div className="max-h-[60vh] overflow-y-auto">
                {filteredTours.length > 0 ? (
                  <ul>
                    {filteredTours.map((tour) => (
                      <li key={tour.id} className="border-b border-[var(--border-color)] last:border-0">
                        <button
                          onClick={() => handleSearchSelect(tour.slug)}
                          className="w-full text-left p-4 hover:bg-[var(--bg-primary)] transition-colors flex items-center gap-4"
                        >
                          <img src={tour.images[0]} alt={tour.title} className="w-12 h-12 rounded-md object-cover" referrerPolicy="no-referrer" />
                          <div>
                            <h4 className="font-bold text-[var(--text-primary)]">{tour.title}</h4>
                            <p className="text-sm text-[var(--text-secondary)]">
                              {tour.city}, {tour.country}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-[var(--text-secondary)]">No adventures found matching "{searchQuery}"</div>
                )}
              </div>
            )}

            {!searchQuery && (
              <div className="p-4 text-sm text-[var(--text-secondary)] bg-[var(--bg-primary)]/50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2 flex-wrap">
                  {['Dubai', 'Abu Dhabi', 'Ras Al Khaimah', 'Iceland'].map((dest) => (
                    <button
                      key={dest}
                      onClick={() => setSearchQuery(dest)}
                      className="px-3 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-[var(--accent-secondary)] transition-colors text-xs"
                    >
                      {dest}
                    </button>
                  ))}
                </div>
                <Link to="/meetups" onClick={() => setIsSearchOpen(false)} className="text-xs font-semibold text-purple-300 hover:underline">
                  Browse Verified MeetUps &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
