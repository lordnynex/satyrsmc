import React from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import membersData from '../data/members.json';

type Person = { 
  id: string;
  name: string; 
  title?: string; 
  image?: string;
};

const MembersPage: React.FC = () => {
  const officers = membersData.officers as Person[];
  const members = membersData.members as Person[];

  return (
    <div className="flex flex-col gap-8 md:gap-10 max-w-5xl mx-auto">
      <Hero title="Club Members" subtitle="Officers and members of the Satyrs M/C" />

      {/* Officers */}
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">Officers</h2>
        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {officers.map((o) => (
            <Link 
              key={o.id} 
              to={`/members/${o.id}`}
              className="flex flex-col items-center text-center gap-2 p-4 rounded-lg border border-slate-700/60 bg-slate-800/30 hover:bg-slate-800/60 hover:border-satyrs-blue/50 transition-all"
            >
              <div className="rounded-full overflow-hidden border-2 border-satyrs-gold" style={{ width: 160, height: 160 }}>
                {o.image ? <img src={o.image} alt={o.name} className="w-full h-full object-cover" /> : null}
              </div>
              <h3 className="m-0 font-semibold text-lg">{o.name}</h3>
              {o.title && <p className="m-0 opacity-90 text-sm text-satyrs-gold">{o.title}</p>}
            </Link>
          ))}
        </div>
      </section>

      {/* Members */}
      {members.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold">Members</h2>
          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {members.map((m) => (
              <Link 
                key={m.id} 
                to={`/members/${m.id}`}
                className="flex flex-col items-center text-center gap-2 p-4 rounded-lg border border-slate-700/60 bg-slate-800/30 hover:bg-slate-800/60 hover:border-satyrs-blue/50 transition-all"
              >
                <div className="rounded-full overflow-hidden border-2 border-satyrs-gold" style={{ width: 160, height: 160 }}>
                  {m.image ? <img src={m.image} alt={m.name} className="w-full h-full object-cover" /> : null}
                </div>
                <h3 className="m-0 font-semibold text-lg">{m.name}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default MembersPage;
