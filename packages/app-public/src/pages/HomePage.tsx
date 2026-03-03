import React from 'react';
import { Hero } from '../components/Hero';
import { HeroCarousel } from '../components/HeroCarousel';
import { events } from '../content/events';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  const next = events[0];
  return (
    <div className="stack max-w-5xl mx-auto" style={{ gap: 'var(--space-6)' }}>
      <Hero
        title="The Satyrs Motorcycle Club of Los Angeles"
        subtitle="Founded in 1954 — the oldest running gay men's motorcycle club in the world."
      />
      <HeroCarousel
        slides={[
          { src: 'https://satyrsmc.org/Images/Members/70th_Anniversary_Group.png', alt: '70th Anniversary' },
          { src: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1200', alt: 'Open road' },
          { src: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600', alt: 'Ride out' }
        ]}
      />

      {next && (
        <section className="stack" style={{ gap: 'var(--space-3)' }}>
          <h2 style={{ margin: 0 }}>Upcoming Event</h2>
          <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 'var(--space-4)' }}>
            <div className="stack" style={{ gap: 'var(--space-3)' }}>
              {/* Removed large event image for a cleaner homepage */}
              <div>
                <h3 style={{ marginTop: 0 }}>{next.title}</h3>
                <p style={{ margin: 0 }}>{next.date}{next.location ? ` · ${next.location}` : ''}</p>
                {next.descriptionMd && <p>{next.descriptionMd}</p>}
                {next.link && <a href={next.link} target="_blank" rel="noopener noreferrer">More details →</a>}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="card">
          <div className="card-body flex flex-col gap-2">
            <h3 className="m-0 font-semibold">About</h3>
            <p className="m-0">Our history, values, and legacy across seven decades of riding and community.</p>
            <Link to="/about" className="btn btn-primary w-fit">Learn more →</Link>
          </div>
        </div>
        <div className="card">
          <div className="card-body flex flex-col gap-2">
            <h3 className="m-0 font-semibold">Members</h3>
            <p className="m-0">Meet our officers and members who keep the Satyrs spirit alive.</p>
            <Link to="/members" className="btn btn-primary w-fit">View members →</Link>
          </div>
        </div>
        <div className="card">
          <div className="card-body flex flex-col gap-2">
            <h3 className="m-0 font-semibold">Events</h3>
            <p className="m-0">Rides, runs, and gatherings hosted by the Satyrs M/C and friends.</p>
            <Link to="/events" className="btn btn-primary w-fit">See events →</Link>
          </div>
        </div>
        <div className="card">
          <div className="card-body flex flex-col gap-2">
            <h3 className="m-0 font-semibold">Badger</h3>
            <p className="m-0">Learn about our Badger program and how to connect with the club.</p>
            <Link to="/badger" className="btn btn-primary w-fit">Explore Badger →</Link>
          </div>
        </div>
        <div className="card">
          <div className="card-body flex flex-col gap-2">
            <h3 className="m-0 font-semibold">Photos</h3>
            <p className="m-0">Highlights from our rides and events over the years.</p>
            <Link to="/gallery" className="btn btn-primary w-fit">View gallery →</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
