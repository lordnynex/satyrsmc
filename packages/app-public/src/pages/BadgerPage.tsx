import React from 'react';
import { Hero } from '../components/Hero';

const BadgerPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      <Hero title="Badger" subtitle="Connect with the Satyrs community." />
      <section className="flex flex-col gap-4">
        <p>
          The Satyrs’ Badger program is a path to connect with the club, participate in events, and learn our traditions. If you’re interested in riding with us or volunteering at events, we’d love to hear from you.
        </p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Join us for rides and charity runs</li>
          <li>Help support community events and club traditions</li>
          <li>Meet members and fellow riders</li>
        </ul>
        <div className="flex flex-wrap gap-3 mt-2">
          <a href="mailto:SatyrsPR@SatyrsMC.org" className="btn btn-outline">Email SatyrsPR@SatyrsMC.org</a>
          <a href="https://satyrsmc.org/BadgerApplication.html" target="_blank" rel="noopener noreferrer" className="btn btn-primary">Badger Application →</a>
        </div>
      </section>
    </div>
  );
};

export default BadgerPage;
