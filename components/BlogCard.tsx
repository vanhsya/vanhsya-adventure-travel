
import React from 'react';
import { Link } from 'react-router-dom';
import { Blog } from '../types';

interface BlogCardProps {
  blog: Blog;
}

const BlogCard: React.FC<BlogCardProps> = ({ blog }) => {
  return (
    <div 
      className="rounded-xl overflow-hidden shadow-lg flex flex-col transform border transition-all duration-300 hover:-translate-y-1"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        '--shadow-color-var': 'var(--shadow-color-secondary)'
      } as React.CSSProperties}
      onMouseOver={e => {
          e.currentTarget.style.boxShadow = `0 6px 20px -3px var(--shadow-color-var)`;
          e.currentTarget.style.borderColor = 'var(--accent-secondary)';
      }}
      onMouseOut={e => {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'var(--border-color)';
      }}
    >
      <Link to={`/blogs/${blog.slug}`} className="block">
        <div 
          className="h-56 relative overflow-hidden" 
          aria-label={blog.title}
        >
          <img src={blog.imageUrl} alt={blog.title} className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      </Link>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-xl">
            <Link to={`/blogs/${blog.slug}`} style={{ color: 'var(--text-primary)'}} className="hover:text-[var(--accent-secondary)] transition-colors">{blog.title}</Link>
        </h3>
        <p className="text-sm mt-2 line-clamp-3 flex-grow" style={{ color: 'var(--text-secondary)'}}>{blog.excerpt}</p>
        <div className="mt-5 pt-4 border-t flex items-center" style={{ borderColor: 'var(--border-color)'}}>
          <img src={blog.authorAvatar} alt={blog.author} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
          <div className="ml-3 text-sm">
            <p className="font-semibold" style={{ color: 'var(--text-primary)'}}>{blog.author}</p>
            <p style={{ color: 'var(--text-secondary)'}}>{blog.date}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
