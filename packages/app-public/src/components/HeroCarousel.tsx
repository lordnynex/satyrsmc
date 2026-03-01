import React from 'react';

type Slide = { src: string; alt?: string };
type Props = {
  slides: Slide[];
  intervalMs?: number;
};

export const HeroCarousel: React.FC<Props> = ({ slides, intervalMs = 5000 }) => {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % slides.length), intervalMs);
    return () => clearInterval(id);
  }, [slides.length, intervalMs]);

  if (!slides.length) return null;

  return (
    <div className="relative" style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
      {slides.map((s, i) => (
        <img
          key={i}
          src={s.src}
          alt={s.alt || ''}
          style={{
            width: '100%',
            height: 'min(48vh, 520px)',
            objectFit: 'cover',
            position: 'absolute',
            inset: 0,
            opacity: i === idx ? 1 : 0,
            transition: 'opacity 800ms ease-in-out'
          }}
        />
      ))}
      <div style={{ position: 'relative', paddingTop: 'min(48vh, 520px)' }} />
      <div style={{ position: 'absolute', bottom: 8, right: 12, display: 'flex', gap: 6 }}>
        {slides.map((_, i) => (
          <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i === idx ? 'var(--color-accent)' : 'rgba(255,255,255,0.5)' }} />
        ))}
      </div>
    </div>
  );
};
