import React, { useEffect } from 'react';

// Deprecated: This standalone page has moved under About. Redirect to the new section.
const OfficersPage: React.FC = () => {
  useEffect(() => {
    window.location.replace("/about#officers");
  }, []);

  return (
    <div className="p-6 text-center">
      <p>Club Officers page moved. Redirecting to About → Officers…</p>
      <p>
        If you are not redirected, <a className="text-satyrs-gold underline" href="/about#officers">click here</a>.
      </p>
    </div>
  );
};

export default OfficersPage;
