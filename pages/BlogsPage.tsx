
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BLOGS_DATA } from '../constants';
import BlogCard from '../components/BlogCard';
import AnimateOnScroll from '../components/AnimateOnScroll';

// --- Icons ---
const TravelIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const WriteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const EarnIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1h4v1m-7 6h7m-3 6v-1h-1v1h-1v-1h-1v1H9v-1h1v1h1z" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

const CreatorStepCard: React.FC<{ icon: React.ReactNode; title: string; description: string; step: number }> = ({ icon, title, description, step }) => (
    <div className="p-8 rounded-2xl border border-white/5 bg-gray-900/40 relative hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-2 group">
        <div className="absolute -top-5 left-8 flex items-center justify-center h-10 w-10 rounded-full font-bold font-mono text-lg border-2 border-gray-800 bg-gray-900 text-purple-400 shadow-lg group-hover:scale-110 transition-transform">
          {step}
        </div>
        <div className="mt-4">
            <div className="flex items-center justify-center h-14 w-14 rounded-xl mb-6 bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3 text-white font-cinzel">{title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
        </div>
    </div>
);

const FeaturedStory: React.FC<{ blog: typeof BLOGS_DATA[0] }> = ({ blog }) => (
    <div className="relative rounded-3xl overflow-hidden aspect-[16/9] md:aspect-[21/9] group cursor-pointer shadow-2xl">
        <Link to={`/blogs/${blog.slug}`}>
            <img src={blog.imageUrl} alt={blog.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90"></div>
            <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full md:w-2/3">
                <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold uppercase tracking-widest rounded-full">Featured Story</span>
                    <span className="text-gray-300 text-sm">{blog.date}</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black font-cinzel text-white mb-4 leading-tight group-hover:text-purple-200 transition-colors">
                    {blog.title}
                </h2>
                <p className="text-lg text-gray-300 line-clamp-2 mb-6 hidden md:block">
                    {blog.excerpt}
                </p>
                <div className="flex items-center gap-3">
                    <img src={blog.authorAvatar} alt={blog.author} className="w-10 h-10 rounded-full border-2 border-white/20" />
                    <div>
                        <p className="text-sm font-bold text-white">{blog.author}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Vanhsya Explorer</p>
                    </div>
                </div>
            </div>
        </Link>
    </div>
);

const FilterButton: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 border ${
            active 
            ? 'bg-white text-black border-white' 
            : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'
        }`}
    >
        {label}
    </button>
);

const BlogsPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'idle' | 'success'>('idle');
  
  const categories = ['All', 'Adventure', 'Culture', 'Food', 'Nature', 'History'];

  const filteredBlogs = useMemo(() => {
     let blogs = BLOGS_DATA;

     // Filter by Category
     if (activeCategory !== 'All') {
         blogs = blogs.filter(blog => blog.tags.some(tag => tag.includes(activeCategory)));
     }

     // Filter by Search Query
     if (searchQuery.trim()) {
         const lowerQuery = searchQuery.toLowerCase();
         blogs = blogs.filter(blog => 
             blog.title.toLowerCase().includes(lowerQuery) || 
             blog.excerpt.toLowerCase().includes(lowerQuery) ||
             blog.author.toLowerCase().includes(lowerQuery)
         );
     }

     return blogs;
  }, [activeCategory, searchQuery]);

  const featuredBlog = BLOGS_DATA[0]; 
  // If searching, we treat all results equally in the grid, so we don't hide the featured one unless we are in default view.
  const showFeaturedHeader = !searchQuery && (activeCategory === 'All' || featuredBlog.tags.some(tag => tag.includes(activeCategory)));
  
  const remainingBlogs = showFeaturedHeader 
    ? filteredBlogs.filter(b => b.id !== featuredBlog.id)
    : filteredBlogs;

  const handleSubscribe = () => {
      if (email && email.includes('@')) {
          setSubscriptionStatus('success');
          setEmail('');
          setTimeout(() => setSubscriptionStatus('idle'), 3000);
      }
  };

  return (
    <div className="pt-24 min-h-screen bg-[#0A0A10] text-gray-200 font-sans">
      
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl md:text-8xl font-black font-cinzel text-white mb-4 tracking-tighter">
                THE CHRONICLES
            </h1>
            <p className="text-xl text-purple-300/80 font-mono uppercase tracking-[0.3em]">
                Stories from the Vanhsya Network
            </p>
        </div>
      </section>

      {/* Featured Story */}
      {showFeaturedHeader && (
        <section className="px-4 max-w-7xl mx-auto mb-20">
            <AnimateOnScroll>
                <FeaturedStory blog={featuredBlog} />
            </AnimateOnScroll>
        </section>
      )}

      {/* Filter & Grid */}
      <section className="px-4 max-w-7xl mx-auto mb-24">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
              <div className="flex flex-wrap gap-2 justify-center">
                  {categories.map(cat => (
                      <FilterButton 
                        key={cat} 
                        label={cat} 
                        active={activeCategory === cat} 
                        onClick={() => setActiveCategory(cat)} 
                      />
                  ))}
              </div>
              <div className="relative w-full md:w-auto">
                  <input 
                    type="text" 
                    placeholder="Search stories..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-full text-sm focus:outline-none focus:border-purple-500 w-full md:w-64 transition-colors text-white"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      <SearchIcon />
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {remainingBlogs.map((blog, index) => (
                  <AnimateOnScroll key={blog.id} delay={`${index * 100}ms`}>
                      <BlogCard blog={blog} />
                  </AnimateOnScroll>
              ))}
              {remainingBlogs.length === 0 && (
                  <div className="col-span-full text-center py-20 text-gray-500">
                      No stories found matching your criteria.
                  </div>
              )}
          </div>
      </section>

      {/* Creator Program */}
      <section className="py-24 bg-gradient-to-b from-[#0F0F16] to-black border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4">
            <AnimateOnScroll>
                <div className="text-center mb-16">
                    <span className="text-purple-500 font-bold uppercase tracking-widest text-xs">Join the Collective</span>
                    <h2 className="text-4xl md:text-5xl font-black font-cinzel text-white mt-4 mb-6">Become a Creator</h2>
                    <p className="max-w-2xl mx-auto text-gray-400 text-lg">
                        Turn your travel experiences into memorable dispatches. Write for Vanhsya and earn verified travel perks and community creator credits (subject to active compliance guidelines).
                    </p>
                </div>
            </AnimateOnScroll>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <AnimateOnScroll delay="0ms">
                    <CreatorStepCard 
                        step={1}
                        icon={<TravelIcon />} 
                        title="Experience" 
                        description="Book a trip with Vanhsya. Document your journey through photos and notes."
                    />
                </AnimateOnScroll>
                <AnimateOnScroll delay="200ms">
                    <CreatorStepCard 
                        step={2}
                        icon={<WriteIcon />} 
                        title="Create" 
                        description="Craft a compelling story using our editor. Share highlights, tips, and hidden gems."
                    />
                </AnimateOnScroll>
                <AnimateOnScroll delay="400ms">
                     <CreatorStepCard 
                        step={3}
                        icon={<EarnIcon />} 
                        title="Earn" 
                        description="Get published. Earn credits for every read, plus bonuses for featured stories."
                    />
                </AnimateOnScroll>
            </div>
            <div className="text-center">
                 <Link to="/partners/apply" className="inline-block px-10 py-4 bg-white text-black font-black uppercase tracking-widest rounded-full hover:bg-purple-400 hover:text-white transition-colors shadow-xl transform hover:scale-105">
                    Apply Now
                 </Link>
            </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto bg-gray-900/50 border border-gray-800 rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
              <div className="relative z-10">
                  <h2 className="text-3xl font-bold font-cinzel text-white mb-4">The Travel Digest</h2>
                  <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                      Get the latest stories, exclusive flight deals, and creator spotlights delivered to your inbox weekly.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email" 
                        className="flex-grow px-6 py-4 bg-black border border-gray-700 rounded-full focus:outline-none focus:border-purple-500 text-white placeholder-gray-600"
                      />
                      <button 
                        onClick={handleSubscribe}
                        className={`px-8 py-4 font-bold rounded-full transition-all shadow-lg shadow-purple-900/20 ${subscriptionStatus === 'success' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-purple-600 text-white hover:bg-purple-500'}`}
                      >
                          {subscriptionStatus === 'success' ? 'Subscribed!' : 'Subscribe'}
                      </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-6">
                      No spam. Unsubscribe anytime. Join 45,000+ explorers.
                  </p>
              </div>
          </div>
      </section>

    </div>
  );
};

export default BlogsPage;
