import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ScenarioMetrics } from "@satyrsmc/shared/client";

interface ScenarioDetailCardProps {
  metric: ScenarioMetrics;
}

export function ScenarioDetailCard({ metric }: ScenarioDetailCardProps) {
  const meetsTarget = metric.profitVsBreakEven >= 0;
  const profitable = metric.profit >= 0;

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold">{metric.scenarioKey}</h3>
        <p className="text-muted-foreground text-sm">
          {metric.attendees} attendees + staff at ${metric.ticketPrice}/ticket, staff @ $
          {metric.staffPrice}
        </p>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-muted-foreground text-xs">Gross Revenue</p>
          <p className="text-lg font-semibold">${metric.revenue.toLocaleString()}</p>
          <p className="text-muted-foreground text-xs">Ticket income</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Net Revenue</p>
          <p className={`text-lg font-semibold ${profitable ? "text-green-500" : "text-red-500"}`}>
            ${metric.profit.toLocaleString()}
          </p>
          <p className="text-muted-foreground text-xs">
            {profitable ? "Gross − costs" : "Does not cover costs"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Profit vs target</p>
          <p
            className={`text-lg font-semibold ${meetsTarget ? "text-green-500" : "text-amber-500"}`}
          >
            ${metric.profitVsBreakEven.toLocaleString()}
          </p>
          <p className="text-muted-foreground text-xs">
            {meetsTarget ? "Meets profit target" : "Below profit target"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Cost per attendee</p>
          <p className="text-lg font-semibold">${metric.costPerAttendee.toFixed(0)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
