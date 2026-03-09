import React from "react";
import { photos } from "../content/gallery";
import { GalleryGrid } from "./GalleryGrid";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

export const HomeGallery: React.FC = () => {
  const [index, setIndex] = React.useState(-1);

  return (
    <section className="py-8">
      <h2
        className="text-center text-satyrs-gold mb-8"
        style={{
          fontFamily: "Brush Script MT, Brush Script, cursive",
          fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
          fontWeight: 400,
        }}
      >
        Gallery
      </h2>
      <GalleryGrid photos={photos} onClick={(i) => setIndex(i)} />
      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={index}
        slides={photos.map((p) => ({ src: p.src }))}
      />
    </section>
  );
};
