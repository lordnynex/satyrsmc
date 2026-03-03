import React from 'react';
import { Hero } from '../components/Hero';
import { events, type EventItem } from '../content/events';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const categories: Array<EventItem['category'] | 'all'> = ['all','ride','run','fundraiser','meeting','social'];

const EventsPage: React.FC = () => {
  const [cat, setCat] = React.useState<EventItem['category'] | 'all'>('all');
  const filtered = cat === 'all' ? events : events.filter(e => e.category === cat);

  return (
    <div className="stack max-w-5xl mx-auto" style={{ gap: 'var(--space-5)' }}>
      <Hero title="Events" subtitle="Rides, runs, and gatherings with the Satyrs M/C." />

      <div className="flex flex-wrap gap-2">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCat(c === 'all' ? 'all' : c)}
            className={`btn btn-outline text-sm ${cat === c ? 'bg-satyrs-blue text-white border-satyrs-blue' : ''}`}
          >{c[0].toUpperCase() + c.slice(1)}</button>
        ))}
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {filtered.map((e, idx) => (
          <article key={idx} className="card flex flex-col">
            {e.image && <img src={e.image} alt={e.title} className="h-40 w-full object-cover" />}
            <div className="card-body flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <h3 className="m-0 font-semibold text-lg">{e.title}</h3>
                <span className="badge">{e.category.toUpperCase()}</span>
              </div>
              <p className="m-0 text-sm opacity-90">{e.date}{e.location ? ` · ${e.location}` : ''}</p>
              {e.descriptionMd && (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{e.descriptionMd}</ReactMarkdown>
                </div>
              )}
              {e.link && <a className="btn btn-primary w-fit mt-1" href={e.link} target="_blank" rel="noopener noreferrer">Details →</a>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default EventsPage;
