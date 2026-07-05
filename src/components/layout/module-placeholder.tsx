import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ModulePlaceholder({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Badge variant="secondary">{phase}</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This module is not built yet — routing and navigation are wired up
          so the app shell is complete end to end.
        </p>
      </CardContent>
    </Card>
  );
}
