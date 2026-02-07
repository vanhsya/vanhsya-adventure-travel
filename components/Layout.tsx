
import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import GuideBot from './GuideBot';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--bg-primary)'}}>
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <GuideBot />
      <footer className="w-full bg-black/30 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm" style={{ color: 'var(--text-secondary)'}}>
          &copy; {new Date().getFullYear()} Vanhsya Travel. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
