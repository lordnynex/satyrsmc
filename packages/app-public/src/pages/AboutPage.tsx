import React from 'react';
import { Hero } from '../components/Hero';
import { TimelineSection } from '../components/About/TimelineSection';
import { useHashFocus } from '../hooks/useHashFocus';

const AboutPage: React.FC = () => {
  useHashFocus();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '-1');
      }
      element.focus({ preventScroll: true });
    }
  };

  return (
    <div className="flex flex-col gap-8 md:gap-10 max-w-5xl mx-auto">
      <Hero title="About the Satyrs M/C" subtitle="Preserving community and history since 1954." />
      
      {/* Sub-navigation */}
      <nav className="flex flex-wrap gap-2 p-4 bg-slate-800/50 rounded-lg border border-slate-700/60">
        <button 
          onClick={() => scrollToSection('history')}
          className="btn btn-outline text-sm"
        >
          History
        </button>
        <button 
          onClick={() => scrollToSection('timeline')}
          className="btn btn-outline text-sm"
        >
          Timeline & Archives
        </button>
      </nav>

      {/* History section */}
      <section id="history" className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold">Our History</h2>
        <div className="flex flex-col gap-3">
          <p>
            The Satyrs Motorcycle Club of Los Angeles is the oldest running gay men's motorcycle club and organization in the world. Formed in 1954 during a difficult era for LGBTQ+ visibility, a small group of riders forged a space for camaraderie and mutual support centered around the joy of the motorcycle.
          </p>
          <p>
            Today the Satyrs continue to ride, host charitable events and poker runs, and steward decades of club archives. These historical materials are being prepared for long-term preservation with the ONE Archives Foundation, ensuring future generations can study and celebrate our legacy.
          </p>
          <p>
            Beyond the road, we focus on mentorship, charitable outreach, and sustaining traditions that have bound members and supporters across seven decades.
          </p>
        </div>
      </section>

      {/* Timeline section */}
      <section id="timeline" className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">Timeline & Archives</h2>
        <TimelineSection />
      </section>
    </div>
  );
};

export default AboutPage;
