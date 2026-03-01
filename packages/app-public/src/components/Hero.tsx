import React from 'react';

type Props = {
  title: string;
  subtitle?: string;
};

export const Hero: React.FC<Props> = ({ title, subtitle }) => {
  return (
    <section className="text-center py-10 md:py-16">
      <h1 className="font-bold leading-tight" style={{ fontSize: 'clamp(2rem,6vw,2.6rem)' }}>{title}</h1>
      {subtitle && <p className="opacity-90 max-w-2xl mx-auto mt-3" style={{ fontSize: 'clamp(1rem,2.4vw,1.2rem)' }}>{subtitle}</p>}
    </section>
  );
};
