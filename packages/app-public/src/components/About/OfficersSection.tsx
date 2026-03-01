import React from 'react';
import membersData from '../../data/members.json';

type Person = { name: string; title?: string; image?: string };

export const OfficersSection: React.FC = () => {
  const officers = membersData.officers as Person[];
  const members = membersData.members as Person[];

  return (
    <div className="flex flex-col gap-8">
      {/* Officers */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Officers</h3>
        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {officers.map((o, i) => (
            <article key={i} className="flex flex-col items-center text-center gap-2">
              <div className="rounded-full overflow-hidden border-2" style={{ borderColor: 'var(--color-accent)', width: 160, height: 160 }}>
                {o.image ? <img src={o.image} alt={o.name} className="w-full h-full object-cover" /> : null}
              </div>
              <h4 className="m-0 font-semibold">{o.name}</h4>
              {o.title && <p className="m-0 opacity-90 text-sm">{o.title}</p>}
            </article>
          ))}
        </div>
      </div>

      {/* Members */}
      {members.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Members</h3>
          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {members.map((m, i) => (
              <article key={i} className="flex flex-col items-center text-center gap-2">
                <div className="rounded-full overflow-hidden border-2" style={{ borderColor: 'var(--color-accent)', width: 160, height: 160 }}>
                  {m.image ? <img src={m.image} alt={m.name} className="w-full h-full object-cover" /> : null}
                </div>
                <h4 className="m-0 font-semibold">{m.name}</h4>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
