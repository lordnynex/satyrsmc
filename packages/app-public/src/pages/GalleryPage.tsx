import React from 'react';
import { Hero } from '../components/Hero';
import { photos } from '../content/gallery';
import { GalleryGrid } from '../components/GalleryGrid';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

const GalleryPage: React.FC = () => {
  const [index, setIndex] = React.useState(-1);
  return (
    <div className="stack max-w-5xl mx-auto" style={{ gap: 'var(--space-5)' }}>
      <Hero title="Photos" subtitle="Scenes from our rides, runs, and gatherings." />
      <GalleryGrid photos={photos} onClick={(i) => setIndex(i)} />
      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={index}
        slides={photos.map(p => ({ src: p.src }))}
      />
    </div>
  );
};

export default GalleryPage;
