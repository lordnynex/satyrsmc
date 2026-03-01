import React from 'react';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-gradient-to-tr from-slate-900 to-slate-800/80 border-b border-slate-700/60 backdrop-blur py-2">
        <Navbar />
      </header>
      <main className="container flex-1 py-6 md:py-8">{children}</main>
      <Footer />
    </div>
  );
};
