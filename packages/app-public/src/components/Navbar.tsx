import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTheme } from '../theme/ThemeProvider';

export const Navbar: React.FC = () => {
  const { theme } = useTheme();
  const [open, setOpen] = React.useState(false);

  return (
    <nav className="container">
      <div className="flex items-center justify-between gap-3">
        <Link to="/" className="select-none flex-shrink-0">
          <span className="text-satyrs-gold" style={{
            fontFamily: 'Brush Script MT, Brush Script, cursive',
            fontSize: 'clamp(1.3rem, 3vw, 1.75rem)'
          }}>Satyrs M/C</span>
        </Link>
        
        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink to="/" className={({isActive}) => `px-2.5 py-1.5 rounded text-sm ${isActive ? 'bg-satyrs-blue text-white' : 'hover:bg-white/10'}`}>Home</NavLink>
          <NavLink to="/about" className={({isActive}) => `px-2.5 py-1.5 rounded text-sm ${isActive ? 'bg-satyrs-blue text-white' : 'hover:bg-white/10'}`}>About</NavLink>
          <NavLink to="/members" className={({isActive}) => `px-2.5 py-1.5 rounded text-sm ${isActive ? 'bg-satyrs-blue text-white' : 'hover:bg-white/10'}`}>Members</NavLink>
          <NavLink to="/events" className={({isActive}) => `px-2.5 py-1.5 rounded text-sm ${isActive ? 'bg-satyrs-blue text-white' : 'hover:bg-white/10'}`}>Events</NavLink>
          <NavLink to="/badger" className={({isActive}) => `px-2.5 py-1.5 rounded text-sm ${isActive ? 'bg-satyrs-blue text-white' : 'hover:bg-white/10'}`}>Badger</NavLink>
          <NavLink to="/gallery" className={({isActive}) => `px-2.5 py-1.5 rounded text-sm ${isActive ? 'bg-satyrs-blue text-white' : 'hover:bg-white/10'}`}>Photos</NavLink>
          
          {/* Social icons */}
          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-600/40">
            <a 
              href="https://www.facebook.com/groups/169741820510/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white"
              aria-label="Facebook"
              title="Facebook"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
              </svg>
            </a>
            <a 
              href="https://twitter.com/satyrsmc" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white"
              aria-label="Twitter"
              title="Twitter"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a 
              href="https://www.youtube.com/user/SatyrsMC" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white"
              aria-label="YouTube"
              title="YouTube"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <a 
              href="https://satyrsmc.wordpress.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white"
              aria-label="WordPress Blog"
              title="WordPress Blog"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.158 12.786L9.46 20.625c.806.237 1.657.366 2.54.366 1.047 0 2.051-.18 2.986-.51-.024-.037-.046-.078-.065-.123l-2.762-7.572zm-5.897 8.13C2.456 18.944.095 15.086 2.067 10.28c.458-1.115 1.173-2.08 2.067-2.848L7.46 16.43c.53 1.45.97 2.662 1.31 3.623-.748.293-1.55.45-2.387.45-.545 0-1.078-.063-1.596-.183l-.526-.404zm13.607-1.988c.11-.326.17-.676.17-1.04 0-.968-.348-1.638-.647-2.157-.398-.647-.772-1.194-.772-1.84 0-.723.548-1.395 1.318-1.395.035 0 .067.004.102.006-.7-.64-1.638-1.03-2.668-1.03-1.738 0-3.27 1.124-3.807 2.833l2.888 8.61c1.06-.614 1.918-1.597 2.416-2.987zm3.672-7.728c.034.263.053.545.053.85 0 .837-.157 1.78-.628 2.96l-2.52 7.28c3.167-1.848 5.305-5.29 5.305-9.228 0-2.036-.573-3.937-1.568-5.557.343 1.073.532 2.23.532 3.43l-.174.265zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 1.8c4.525 0 8.2 3.675 8.2 8.2 0 4.525-3.675 8.2-8.2 8.2-4.525 0-8.2-3.675-8.2-8.2 0-4.525 3.675-8.2 8.2-8.2z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="md:hidden inline-flex items-center gap-2 px-2.5 py-1.5 rounded border border-slate-600/60 hover:bg-slate-700/50 text-sm"
        >
          Menu
        </button>
      </div>

      {/* Mobile navigation */}
      {open && (
        <div id="mobile-nav" className="md:hidden flex flex-col gap-1 mt-2 pb-2">
          <NavLink to="/" onClick={() => setOpen(false)} className={({isActive}) => `px-2.5 py-1.5 rounded text-sm ${isActive ? 'bg-satyrs-blue text-white' : 'hover:bg-white/10'}`}>Home</NavLink>
          <NavLink to="/about" onClick={() => setOpen(false)} className={({isActive}) => `px-2.5 py-1.5 rounded text-sm ${isActive ? 'bg-satyrs-blue text-white' : 'hover:bg-white/10'}`}>About</NavLink>
          <NavLink to="/members" onClick={() => setOpen(false)} className={({isActive}) => `px-2.5 py-1.5 rounded text-sm ${isActive ? 'bg-satyrs-blue text-white' : 'hover:bg-white/10'}`}>Members</NavLink>
          <NavLink to="/events" onClick={() => setOpen(false)} className={({isActive}) => `px-2.5 py-1.5 rounded text-sm ${isActive ? 'bg-satyrs-blue text-white' : 'hover:bg-white/10'}`}>Events</NavLink>
          <NavLink to="/badger" onClick={() => setOpen(false)} className={({isActive}) => `px-2.5 py-1.5 rounded text-sm ${isActive ? 'bg-satyrs-blue text-white' : 'hover:bg-white/10'}`}>Badger</NavLink>
          <NavLink to="/gallery" onClick={() => setOpen(false)} className={({isActive}) => `px-2.5 py-1.5 rounded text-sm ${isActive ? 'bg-satyrs-blue text-white' : 'hover:bg-white/10'}`}>Photos</NavLink>
          
          {/* Mobile social links */}
          <div className="flex gap-3 mt-2 pt-2 border-t border-slate-600/40 px-2.5">
            <a href="https://www.facebook.com/groups/169741820510/" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white" aria-label="Facebook">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
              </svg>
            </a>
            <a href="https://twitter.com/satyrsmc" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white" aria-label="Twitter">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://www.youtube.com/user/SatyrsMC" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white" aria-label="YouTube">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <a href="https://satyrsmc.wordpress.com/" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white" aria-label="WordPress">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.158 12.786L9.46 20.625c.806.237 1.657.366 2.54.366 1.047 0 2.051-.18 2.986-.51-.024-.037-.046-.078-.065-.123l-2.762-7.572zm-5.897 8.13C2.456 18.944.095 15.086 2.067 10.28c.458-1.115 1.173-2.08 2.067-2.848L7.46 16.43c.53 1.45.97 2.662 1.31 3.623-.748.293-1.55.45-2.387.45-.545 0-1.078-.063-1.596-.183l-.526-.404zm13.607-1.988c.11-.326.17-.676.17-1.04 0-.968-.348-1.638-.647-2.157-.398-.647-.772-1.194-.772-1.84 0-.723.548-1.395 1.318-1.395.035 0 .067.004.102.006-.7-.64-1.638-1.03-2.668-1.03-1.738 0-3.27 1.124-3.807 2.833l2.888 8.61c1.06-.614 1.918-1.597 2.416-2.987zm3.672-7.728c.034.263.053.545.053.85 0 .837-.157 1.78-.628 2.96l-2.52 7.28c3.167-1.848 5.305-5.29 5.305-9.228 0-2.036-.573-3.937-1.568-5.557.343 1.073.532 2.23.532 3.43l-.174.265zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 1.8c4.525 0 8.2 3.675 8.2 8.2 0 4.525-3.675 8.2-8.2 8.2-4.525 0-8.2-3.675-8.2-8.2 0-4.525 3.675-8.2 8.2-8.2z"/>
              </svg>
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};
