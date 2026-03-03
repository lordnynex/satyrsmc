export type EventItem = {
  title: string;
  date: string; // human readable date or range
  category: "ride" | "fundraiser" | "run" | "meeting" | "social";
  location?: string;
  descriptionMd?: string; // markdown content for richer formatting
  image?: string;
  link?: string;
};

export const events: EventItem[] = [
  {
    title: "Turkey Poker Run 2025",
    date: "Nov 22, 2025",
    category: "run",
    location: "Los Angeles, CA",
    image:
      "https://satyrsmc.org/Images/Events/2025_Turkey_Poker_Run/TurkeyPokerRun2025.png",
    link: "https://satyrsmc.org/Events.html",
    descriptionMd: `Join the Satyrs M/C for our annual **Turkey Poker Run**.

Highlights:
- Scenic route
- Community gathering
- Charity component supporting local outreach

Registration opens at 8:00 AM; first bike out 9:00 AM.`,
  },
  {
    title: "Monthly Club Meeting",
    date: "1st Thursday Monthly",
    category: "meeting",
    location: "Los Angeles, CA",
    descriptionMd: `Regular club meeting.

Agenda:
1. Upcoming ride logistics
2. Community outreach planning
3. Archive updates`,
  },
  {
    title: "Spring Canyon Ride",
    date: "Apr 12, 2026",
    category: "ride",
    location: "Southern California",
    descriptionMd: `A relaxed pace canyon ride welcoming prospective **Badgers**.

_Helmet required. Pack water. Sunscreen recommended._`,
  },
];
