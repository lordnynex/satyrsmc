import type { FC } from "react";
import { BrandLogo } from "./BrandLogo";

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/groups/169741820510/",
    icon: "M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z",
  },
  {
    label: "Twitter",
    href: "https://twitter.com/satyrsmc",
    icon: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/user/SatyrsMC",
    icon: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  },
];

export const BrandFooter: FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-700/60 bg-satyrs-dark/60">
      <div className="container mx-auto py-6 flex flex-col gap-2 items-center text-center">
        <BrandLogo />
        <div className="font-semibold text-white">Connect With Us</div>
        <div className="flex gap-3 flex-wrap justify-center">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white"
              aria-label={link.label}
              title={link.label}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d={link.icon} />
              </svg>
            </a>
          ))}
        </div>
        <small className="text-white/50">
          &copy; {new Date().getFullYear()} Satyrs Motorcycle Club of Los Angeles. All Rights
          Reserved.
        </small>
      </div>
    </footer>
  );
};
