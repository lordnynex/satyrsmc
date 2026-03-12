import React from "react";
import type { Photo } from "react-photo-album";
import PhotoAlbum from "react-photo-album";

type Props = {
  photos: Photo[];
  onClick?: (index: number) => void;
};

export const GalleryGrid: React.FC<Props> = ({ photos, onClick }) => {
  return (
    <PhotoAlbum
      layout="rows"
      photos={photos}
      targetRowHeight={300}
      onClick={({ index }) => onClick?.(index)}
    />
  );
};
