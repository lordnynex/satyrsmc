import React from "react";

export const MissionStatement: React.FC = () => (
  <section className="text-center py-12 px-4">
    <div className="max-w-3xl mx-auto">
      <h2
        className="text-satyrs-gold mb-6"
        style={{
          fontFamily: "Brush Script MT, Brush Script, cursive",
          fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
          fontWeight: 400,
        }}
      >
        Our Mission
      </h2>
      <div
        className="mx-auto mb-6"
        style={{
          width: "80px",
          height: "2px",
          background:
            "linear-gradient(90deg, transparent, var(--color-accent), transparent)",
        }}
      />
      <p
        className="text-lg leading-relaxed"
        style={{ color: "var(--color-text)" }}
      >
        The Satyrs Motorcycle Club of Los Angeles, founded in 1954, is the
        oldest continuously running gay men&rsquo;s motorcycle club in the
        world. We ride together, build lasting community, preserve our rich
        history, and support charitable causes throughout Southern California.
      </p>
    </div>
  </section>
);
