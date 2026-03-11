import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description: string;
  calculationNote: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  description,
  calculationNote,
  children,
  className,
}: ChartCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
        <p className="text-muted-foreground text-xs italic">How we calculate: {calculationNote}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
