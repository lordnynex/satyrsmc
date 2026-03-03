import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-700/60 bg-slate-900/60">
      <div className="container py-6 flex flex-col gap-2">
        <div className="font-semibold">Connect With Us</div>
        <div className="flex gap-3 flex-wrap">
          <a className="hover:underline" href="https://www.facebook.com/groups/169741820510/" target="_blank" rel="noopener noreferrer">Facebook</a>
          <a className="hover:underline" href="https://twitter.com/satyrsmc" target="_blank" rel="noopener noreferrer">Twitter</a>
          <a className="hover:underline" href="https://satyrsmc.wordpress.com/" target="_blank" rel="noopener noreferrer">WordPress</a>
          <a className="hover:underline" href="https://www.youtube.com/user/SatyrsMC" target="_blank" rel="noopener noreferrer">YouTube</a>
        </div>
        <div>SatyrsPR@SatyrsMC.org</div>
        <div>P.O. Box 1137 Los Angeles, CA 90078-1137</div>
        <small className="opacity-70">©2025 Satyrs Motorcycle Club of Los Angeles. All Rights Reserved.</small>
      </div>
    </footer>
  );
};
