import React from "react";
import { Hero } from "../components/Hero";
import { ContactMemberModal } from "../components/ContactMemberModal";
import membersData from "../data/members.json";

type Person = {
  id: string;
  name: string;
  title?: string;
  image?: string;
  joinedYear?: string;
};

const MembersPage: React.FC = () => {
  const officers = membersData.officers as Person[];
  const members = membersData.members as Person[];
  const [contactMember, setContactMember] = React.useState<Person | null>(null);

  const renderCard = (person: Person) => (
    <button
      key={person.id}
      type="button"
      onClick={() => setContactMember(person)}
      className="flex flex-col items-center text-center gap-2 p-4 rounded-lg border border-slate-700/60 bg-slate-800/30 hover:bg-slate-800/60 hover:border-satyrs-blue/50 transition-all cursor-pointer"
    >
      <div className="rounded-full overflow-hidden border-2 border-satyrs-gold w-40 h-40">
        {person.image ? (
          <img src={person.image} alt={person.name} className="w-full h-full object-cover" />
        ) : null}
      </div>
      <h3 className="m-0 font-semibold text-lg">{person.name}</h3>
      {person.title && <p className="m-0 opacity-90 text-sm text-satyrs-gold">{person.title}</p>}
      {person.joinedYear && <span className="badge text-xs">Joined {person.joinedYear}</span>}
    </button>
  );

  return (
    <div className="flex flex-col gap-8 md:gap-10 max-w-5xl mx-auto">
      <Hero title="Club Members" subtitle="Officers and members of the Satyrs M/C" />

      {/* Officers */}
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">Officers</h2>
        <div className="grid-auto-cards">{officers.map(renderCard)}</div>
      </section>

      {/* Members */}
      {members.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold">Members</h2>
          <div className="grid-auto-cards">{members.map(renderCard)}</div>
        </section>
      )}

      {contactMember && (
        <ContactMemberModal
          memberId={contactMember.id}
          memberName={contactMember.name}
          onClose={() => setContactMember(null)}
        />
      )}
    </div>
  );
};

export default MembersPage;
