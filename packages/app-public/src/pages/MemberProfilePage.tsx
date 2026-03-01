import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Hero } from '../components/Hero';
import membersData from '../data/members.json';

type MemberProfile = {
  id: string;
  name: string;
  title?: string;
  image?: string;
  bio?: string;
  joinedYear?: string;
  gallery?: string[];
};

const MemberProfilePage: React.FC = () => {
  const { memberId } = useParams<{ memberId: string }>();

  // Find member in either officers or members array
  const allPeople = [
    ...(membersData.officers as MemberProfile[]),
    ...(membersData.members as MemberProfile[])
  ];
  
  const member = allPeople.find(p => p.id === memberId);

  // Redirect to members page if not found
  if (!member) {
    return <Navigate to="/members" replace />;
  }

  return (
    <div className="flex flex-col gap-8 md:gap-10 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/members" className="btn btn-outline text-sm">
          ← Back to Members
        </Link>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="rounded-full overflow-hidden border-4 border-satyrs-gold flex-shrink-0" style={{ width: 200, height: 200 }}>
          {member.image ? (
            <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
          ) : null}
        </div>
        <div className="flex flex-col gap-3 flex-1">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold m-0">{member.name}</h1>
            {member.title && (
              <p className="text-xl text-satyrs-gold font-semibold mt-2 mb-0">{member.title}</p>
            )}
          </div>
          {member.joinedYear && (
            <p className="text-slate-400 m-0">
              <span className="font-semibold">Member since:</span> {member.joinedYear}
            </p>
          )}
          {member.bio && (
            <p className="text-lg leading-relaxed m-0">{member.bio}</p>
          )}
        </div>
      </div>

      {/* Gallery */}
      {member.gallery && member.gallery.length > 1 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold">Gallery</h2>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            {member.gallery.map((imgSrc, idx) => (
              <div 
                key={idx} 
                className="rounded-lg overflow-hidden border border-slate-700/60 bg-slate-800/30"
                style={{ aspectRatio: '4/3' }}
              >
                <img 
                  src={imgSrc} 
                  alt={`${member.name} - ${idx + 1}`} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Additional Info Section - can be expanded */}
      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-3">About {member.name.split(' ')[0]}</h2>
        <p className="text-slate-300">
          {member.name} is {member.title ? `the ${member.title} of` : 'a valued member of'} the Satyrs Motorcycle Club. 
          {member.joinedYear && ` They joined the club in ${member.joinedYear}.`}
        </p>
        {!member.bio && (
          <p className="text-slate-400 text-sm mt-2 italic">
            Profile information coming soon...
          </p>
        )}
      </section>
    </div>
  );
};

export default MemberProfilePage;
