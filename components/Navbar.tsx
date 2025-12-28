
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { LANGS, CURRENCIES, NAV_LINKS, TOURS_DATA } from '../constants';

const VanhsyaLogo: React.FC = () => (
    <svg className="h-10 w-10 text-purple-400" width="24" height="24" viewBox="0 0 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2.5L3.5 7.5V17.5L12 22.5L20.5 17.5V7.5L12 2.5Z" stroke="var(--accent-secondary)" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M12 13L16.25 15.5L20.5 13M3.5 13L7.75 15.5L12 13" stroke="var(--accent-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7.75 9.5L12 12L16.25 9.5" stroke="var(--accent-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const MoonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

const Navbar: React.FC = () => {
  const { lang, setLang, currency, setCurrency, theme, setTheme } = useAppContext();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLang(e.target.value);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrency(e.target.value);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const filteredTours = useMemo(() => {
    if (!searchQuery) return [];
    const lowerQuery = searchQuery.toLowerCase();
    return TOURS_DATA.filter(tour => 
      tour.title.toLowerCase().includes(lowerQuery) || 
      tour.city.toLowerCase().includes(lowerQuery) || 
      tour.country.toLowerCase().includes(lowerQuery)
    ).slice(0, 5); // Limit to top 5 results
  }, [searchQuery]);

  const handleSearchSelect = (slug: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(`/tours/${slug}`);
  };

  // Close search on escape key and add Ctrl+K shortcut
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);
  
  const activeLinkStyle = {
    color: 'var(--accent-secondary)',
    textShadow: `0 0 5px var(--shadow-color-secondary)`
  };

  const navItems = (
    <>
      {NAV_LINKS.map(link => (
        <NavLink 
            key={link.href}
            to={link.href} 
            style={({ isActive }) => isActive ? activeLinkStyle : { color: 'var(--text-secondary)'}} 
            className="transition-colors px-3 py-2 rounded-md text-sm font-medium hover:text-[var(--accent-secondary)]"
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
        <div className="container mx-auto px-4 sm:px-6 py-3">
              <div className="flex items-center justify-between p-2 bg-[var(--bg-secondary)]/80 header-blur rounded-xl border" style={{ borderColor: 'var(--border-color)'}}>
                  <Link to="/" className="flex items-center space-x-2 shrink-0">
                      <VanhsyaLogo />
                      <span className="text-2xl font-bold font-cinzel tracking-wider" style={{ color: 'var(--text-primary)'}}>VANHSYA</span>
                  </Link>
                  
                  <nav className="hidden md:flex items-center space-x-1">
                    {navItems}
                  </nav>

                  <div className="hidden md:flex items-center space-x-3">
                    <button 
                      onClick={() => setIsSearchOpen(true)} 
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white/5 hover:bg-white/10 transition-colors text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] w-48 lg:w-56"
                      style={{ borderColor: 'var(--border-color)'}} 
                      aria-label="Search"
                    >
                      <SearchIcon />
                      <span>Search...</span>
                      <span className="ml-auto text-xs opacity-50 border border-gray-500 rounded px-1.5 py-0.5 font-mono">⌘K</span>
                    </button>

                    <div className="h-6 w-px bg-[var(--border-color)] mx-1"></div>

                    {/* FIX: Cast style object to React.CSSProperties to allow for custom CSS properties. */}
                    <select className="border rounded-md px-2 py-1 bg-transparent focus:ring-2 focus:outline-none text-sm" value={lang} onChange={handleLangChange} style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', '--ring-color': 'var(--accent-primary)' } as React.CSSProperties}>
                      {LANGS.map(l => <option key={l} value={l} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{l.toUpperCase()}</option>)}
                    </select>
                    {/* FIX: Cast style object to React.CSSProperties to allow for custom CSS properties. */}
                    <select className="border rounded-md px-2 py-1 bg-transparent focus:ring-2 focus:outline-none text-sm" value={currency} onChange={handleCurrencyChange} style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', '--ring-color': 'var(--accent-primary)' } as React.CSSProperties}>
                      {CURRENCIES.map(c => <option key={c} value={c} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{c}</option>)}
                    </select>
                    <button onClick={toggleTheme} className="p-2 rounded-md border hover:bg-white/5 transition-colors" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)'}} aria-label="Toggle theme">
                      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                    </button>
                  </div>
                  
                  <div className="flex md:hidden items-center space-x-2">
                     <button onClick={() => setIsSearchOpen(true)} className="p-2 text-[var(--text-primary)]">
                        <SearchIcon />
                     </button>
                    <button className="" style={{ color: 'var(--text-primary)'}} onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                    </button>
                  </div>
              </div>
              {isMobileMenuOpen && (
                  <div className="md:hidden mt-2 p-4 bg-[var(--bg-secondary)]/90 header-blur rounded-xl border" style={{ borderColor: 'var(--border-color)'}}>
                      <nav className="flex flex-col space-y-4 items-center">
                          {navItems}
                          <div className="flex items-center space-x-4 pt-4 border-t w-full justify-center" style={{ borderColor: 'var(--border-color)'}}>
                            <select className="border rounded-md px-2 py-1 bg-transparent focus:ring-2 focus:outline-none" value={lang} onChange={handleLangChange} style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)'}}>
                              {LANGS.map(l => <option key={l} value={l} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{l.toUpperCase()}</option>)}
                            </select>
                            <select className="border rounded-md px-2 py-1 bg-transparent focus:ring-2 focus:outline-none" value={currency} onChange={handleCurrencyChange} style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)'}}>
                              {CURRENCIES.map(c => <option key={c} value={c} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{c}</option>)}
                            </select>
                            <button onClick={toggleTheme} className="p-2 rounded-md border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)'}} aria-label="Toggle theme">
                              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                            </button>
                          </div>
                      </nav>
                  </div>
              )}
          </div>
      </header>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setIsSearchOpen(false)}>
           <div className="w-full max-w-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
               <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-3">
                   <div className="text-[var(--text-secondary)]"><SearchIcon /></div>
                   <input 
                       ref={searchInputRef}
                       type="text" 
                       placeholder="Search destinations, tours, adventures..." 
                       className="flex-1 bg-transparent border-none focus:ring-0 text-lg placeholder-gray-500 outline-none"
                       style={{ color: 'var(--text-primary)' }}
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                   />
                   <button onClick={() => setIsSearchOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-bold px-2 py-1 rounded hover:bg-white/5 transition-colors">
                       ESC
                   </button>
               </div>
               
               {searchQuery && (
                   <div className="max-h-[60vh] overflow-y-auto">
                       {filteredTours.length > 0 ? (
                           <ul>
                               {filteredTours.map(tour => (
                                   <li key={tour.id} className="border-b border-[var(--border-color)] last:border-0">
                                       <button 
                                           onClick={() => handleSearchSelect(tour.slug)}
                                           className="w-full text-left p-4 hover:bg-[var(--bg-primary)] transition-colors flex items-center gap-4"
                                       >
                                           <img src={tour.images[0]} alt={tour.title} className="w-12 h-12 rounded-md object-cover" />
                                           <div>
                                               <h4 className="font-bold text-[var(--text-primary)]">{tour.title}</h4>
                                               <p className="text-sm text-[var(--text-secondary)]">{tour.city}, {tour.country}</p>
                                           </div>
                                       </button>
                                   </li>
                               ))}
                           </ul>
                       ) : (
                           <div className="p-8 text-center text-[var(--text-secondary)]">
                               No adventures found matching "{searchQuery}"
                           </div>
                       )}
                   </div>
               )}
               
               {!searchQuery && (
                  <div className="p-4 text-sm text-[var(--text-secondary)] bg-[var(--bg-primary)]/50">
                      <p className="mb-2 font-semibold">Popular Destinations:</p>
                      <div className="flex gap-2 flex-wrap">
                          {['Dubai', 'Japan', 'Iceland', 'Paris'].map(dest => (
                              <button 
                                key={dest}
                                onClick={() => setSearchQuery(dest)}
                                className="px-3 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-[var(--accent-secondary)] transition-colors text-xs"
                              >
                                  {dest}
                              </button>
                          ))}
                      </div>
                  </div>
               )}
           </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
