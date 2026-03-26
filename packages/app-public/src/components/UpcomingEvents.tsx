import React from "react";
import { trpc } from "@satyrsmc/shared/client";
import { formatDateShort } from "@satyrsmc/shared/lib/date-utils";

export const UpcomingEvents: React.FC = () => {
  const { data: events, isLoading, error } = trpc.website.getEventsFeed.useQuery();

  if (isLoading) {
    return (
      <section className="py-8">
        <h2 className="font-script text-section-heading text-center text-satyrs-gold mb-8">
          Upcoming Events
        </h2>
        <div className="max-w-3xl mx-auto">
          {["a", "b", "c", "d"].map((skeletonKey, i) => (
            <div
              key={skeletonKey}
              className={[
                "flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-4 px-2",
                i < 3 ? "border-b border-[var(--color-border)]" : "",
              ]
                .join(" ")
                .trim()}
            >
              <span className="text-sm font-medium shrink-0 rounded min-w-[160px] h-[1em] bg-[var(--color-border)] opacity-40">
                &nbsp;
              </span>
              <div className="flex-1 min-w-0">
                <span className="inline-block rounded w-[60%] h-[1em] bg-[var(--color-border)] opacity-40">
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
        <h2 className="font-script text-section-heading text-center text-satyrs-gold mb-8">
          Upcoming Events
        </h2>
        <p className="text-center text-sm text-[var(--color-muted)]">
          Unable to load events. Please try again later.
        </p>
      </section>
    );
  }

  if (!events || events.length === 0) {
    return (
      <section className="py-8">
        <h2 className="font-script text-section-heading text-center text-satyrs-gold mb-8">
          Upcoming Events
        </h2>
        <p className="text-center text-sm text-[var(--color-muted)]">
          No upcoming events at this time. Check back soon!
        </p>
      </section>
    );
  }

  return (
    <section className="py-8">
      <h2 className="font-script text-section-heading text-center text-satyrs-gold mb-8">
        Upcoming Events
      </h2>
      <div className="max-w-3xl mx-auto">
        {events.map((event, i) => (
          <div
            key={event.id}
            className={[
              "flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-4 px-2",
              i < events.length - 1 ? "border-b border-[var(--color-border)]" : "",
            ]
              .join(" ")
              .trim()}
          >
            <span className="text-sm font-medium shrink-0 text-satyrs-gold min-w-[160px]">
              {event.start_date ? formatDateShort(event.start_date) : ""}
            </span>
            <div className="flex-1 min-w-0">
              <span className="font-semibold">{event.name}</span>
              {event.event_location && (
                <span className="ml-2 text-sm text-[var(--color-muted)]">
                  &mdash; {event.event_location}
                </span>
              )}
            </div>
            {event.event_url && (
              <a
                href={event.event_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm shrink-0 text-satyrs-blue"
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
