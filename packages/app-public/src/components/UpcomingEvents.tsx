import React from "react";
import { trpc } from "@satyrsmc/shared/client";
import { formatDateShort } from "@satyrsmc/shared/lib/date-utils";

export const UpcomingEvents: React.FC = () => {
  const { data: events, isLoading, error } = trpc.website.getEventsFeed.useQuery();

  if (isLoading) {
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
          Upcoming Events
        </h2>
        <div className="max-w-3xl mx-auto">
          {["a", "b", "c", "d"].map((skeletonKey, i) => (
            <div
              key={skeletonKey}
              className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-4 px-2"
              style={{
                borderBottom: i < 3 ? "1px solid var(--color-border)" : "none",
              }}
            >
              <span
                className="text-sm font-medium shrink-0 rounded"
                style={{
                  minWidth: "160px",
                  height: "1em",
                  background: "var(--color-border)",
                  opacity: 0.4,
                }}
              >
                &nbsp;
              </span>
              <div className="flex-1 min-w-0">
                <span
                  className="inline-block rounded"
                  style={{
                    width: "60%",
                    height: "1em",
                    background: "var(--color-border)",
                    opacity: 0.4,
                  }}
                >
                  &nbsp;
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
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
          Upcoming Events
        </h2>
        <p className="text-center text-sm" style={{ color: "var(--color-muted)" }}>
          Unable to load events. Please try again later.
        </p>
      </section>
    );
  }

  if (!events || events.length === 0) {
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
          Upcoming Events
        </h2>
        <p className="text-center text-sm" style={{ color: "var(--color-muted)" }}>
          No upcoming events at this time. Check back soon!
        </p>
      </section>
    );
  }

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
        Upcoming Events
      </h2>
      <div className="max-w-3xl mx-auto">
        {events.map((event, i) => (
          <div
            key={event.id}
            className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-4 px-2"
            style={{
              borderBottom: i < events.length - 1 ? "1px solid var(--color-border)" : "none",
            }}
          >
            <span
              className="text-sm font-medium shrink-0"
              style={{ color: "var(--color-accent)", minWidth: "160px" }}
            >
              {event.start_date ? formatDateShort(event.start_date) : ""}
            </span>
            <div className="flex-1 min-w-0">
              <span className="font-semibold" style={{ color: "var(--color-text)" }}>
                {event.name}
              </span>
              {event.event_location && (
                <span className="ml-2 text-sm" style={{ color: "var(--color-muted)" }}>
                  &mdash; {event.event_location}
                </span>
              )}
            </div>
            {event.event_url && (
              <a
                href={event.event_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm shrink-0"
                style={{ color: "var(--color-primary)" }}
              >
                Details &rarr;
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
