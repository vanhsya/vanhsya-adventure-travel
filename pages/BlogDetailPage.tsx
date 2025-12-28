import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BLOGS_DATA } from '../constants';
import NotFoundPage from './NotFoundPage';
import { useAppContext } from '../contexts/AppContext';

declare global {
  interface Window {
    marked: any;
  }
}

const BlogDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { theme } = useAppContext();
  const [htmlContent, setHtmlContent] = useState('');
  
  const blog = BLOGS_DATA.find(b => b.slug === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (blog && window.marked) {
      setHtmlContent(window.marked.parse(blog.content));
    }
  }, [blog]);

  if (!blog) {
    return <NotFoundPage />;
  }

  return (
    <div className="pt-24" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)'}}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Blog Header */}
        <header className="text-center mb-12">
          <div className="flex justify-center items-center gap-2 mb-4">
            {blog.tags.map(tag => (
              <span key={tag} className="px-3 py-1 text-xs font-semibold rounded-full text-white" style={{ backgroundColor: 'var(--accent-secondary)'}}>
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-cinzel">{blog.title}</h1>
          <div className="mt-6 flex items-center justify-center">
            <img src={blog.authorAvatar} alt={blog.author} className="w-12 h-12 rounded-full object-cover" />
            <div className="ml-4 text-left">
              <p className="font-semibold">{blog.author}</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)'}}>{blog.date}</p>
            </div>
          </div>
        </header>

        {/* Hero Image */}
        <div className="mb-12">
          <img src={blog.imageUrl} alt={blog.title} className="w-full h-auto max-h-[600px] object-cover rounded-xl shadow-lg" />
        </div>

        {/* Blog Content */}
        <article 
          className={`prose prose-lg max-w-none prose-img:rounded-lg prose-headings:font-cinzel ${theme === 'dark' ? 'prose-invert' : ''}`}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        >
        </article>
      </div>
    </div>
  );
};

export default BlogDetailPage;