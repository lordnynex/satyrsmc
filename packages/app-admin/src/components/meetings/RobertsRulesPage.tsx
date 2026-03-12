export function RobertsRulesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Robert&apos;s Rules of Order</h1>

      <div className="space-y-4">
        <p className="text-muted-foreground">
          <em>Robert&apos;s Rules of Order</em> is a manual of parliamentary procedure by U.S. Army
          officer Henry Martyn Robert (1837–1923). It is the most widely used manual of
          parliamentary procedure in the United States and governs the meetings of a diverse range
          of organizations—including church groups, county commissions, homeowners&apos;
          associations, nonprofit associations, professional societies, school boards, trade unions,
          and college fraternities and sororities.
        </p>

        <div className="aspect-video w-full max-w-2xl rounded-lg overflow-hidden bg-muted">
          <iframe
            src="https://www.youtube.com/embed/J7J9ckZSZ9E"
            title="Robert's Rules of Order - YouTube"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full"
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-medium">Key Concepts</h2>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
            <li>Motions and the order of precedence</li>
            <li>Debate and voting procedures</li>
            <li>Quorum requirements</li>
            <li>Minutes and official records</li>
            <li>Subsidiary, privileged, and incidental motions</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-medium">Learn More</h2>
          <p className="text-muted-foreground text-sm">
            For a comprehensive overview, history, and detailed explanations of Robert&apos;s Rules
            of Order, see:
          </p>
          <a
            href="https://en.wikipedia.org/wiki/Robert%27s_Rules_of_Order"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
          >
            Robert&apos;s Rules of Order on Wikipedia
            <span aria-hidden>↗</span>
          </a>
        </div>
      </div>
    </div>
  );
}
