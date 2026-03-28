import React from "react";
import { HeroCarousel } from "../components/HeroCarousel";
import { MissionStatement } from "../components/MissionStatement";
import { UpcomingEvents } from "../components/UpcomingEvents";

const HomePage: React.FC = () => (
  <div className="stack gap-6 max-w-5xl mx-auto">
    <HeroCarousel
      slides={[
        {
          src: "https://satyrsmc.org/Images/Members/70th_Anniversary_Group.png",
          alt: "70th Anniversary",
        },
        {
          src: "https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1200",
          alt: "Open road",
        },
        {
          src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600",
          alt: "Ride out",
        },
      ]}
    />
    <MissionStatement />
    <UpcomingEvents />
  </div>
);

export default HomePage;
