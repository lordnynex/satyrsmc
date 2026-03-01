import React, { useEffect } from 'react';

// Deprecated: This standalone page has moved under About. Redirect to the new section.
const TimelinePage: React.FC = () => {
  useEffect(() => {
    window.location.replace("/about#timeline");
  }, []);

  return (
    <div className="p-6 text-center">
      <p>Timeline & Archives page moved. Redirecting to About → Timeline…</p>
      <p>If not redirected, <a className="text-satyrs-gold underline" href="/about#timeline">click here</a>.</p>
    </div>
  );
};

export default TimelinePage;
