import React from 'react';
import timelineData from '../../data/timeline.json';

type Milestone = { year: string; title: string; text: string; link?: string };

export const TimelineSection: React.FC = () => {
  const milestones = timelineData.milestones as Milestone[];

  return (
    <ol className="flex flex-col gap-4 list-none p-0">
      {milestones.map((m, i) => (
        <li key={i} className="rounded-md border border-slate-700/60 bg-slate-800/50 p-4">
          <div className="text-satyrs-gold font-bold">{m.year}</div>
          <h3 className="m-0">{m.title}</h3>
          <p className="mt-1">
            {m.text} {m.link ? <a className="hover:underline" href={m.link} target="_blank" rel="noopener noreferrer">Learn more →</a> : null}
          </p>
        </li>
      ))}
    </ol>
  );
};
