import React from "react";

type Slide = { src: string; alt?: string };
type Props = {
  slides: Slide[];
  intervalMs?: number;
};

export const HeroCarousel: React.FC<Props> = ({ slides, intervalMs = 5000 }) => {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % slides.length), intervalMs);
    return () => clearInterval(id);
  }, [slides.length, intervalMs]);

  if (!slides.length) return null;

  return (
    <div className="carousel-frame">
      {slides.map((s, i) => (
        <img
          // eslint-disable-next-line @eslint-react/no-array-index-key
          key={`${s.src}-${i}`}
          src={s.src}
          alt={s.alt || ""}
          className="carousel-img"
          style={{ opacity: i === idx ? 1 : 0 }}
        />
      ))}
      <div className="carousel-spacer" />
      <div className="absolute bottom-2 right-3 flex gap-1.5">
        {slides.map((s, i) => (
          <span
            // eslint-disable-next-line @eslint-react/no-array-index-key
            key={`${s.src}-${i}`}
            className="w-2 h-2 rounded-full"
            style={{ background: i === idx ? "var(--color-accent)" : "rgba(255,255,255,0.5)" }}
          />
        ))}
      </div>
    </div>
  );
};
