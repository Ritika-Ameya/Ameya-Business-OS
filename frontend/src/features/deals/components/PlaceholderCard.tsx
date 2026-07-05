import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

interface PlaceholderCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  message: string;
  accent?: string;
  iconColor?: string;
}

export function PlaceholderCard({
  icon: Icon,
  title,
  description,
  message,
  accent = "bg-muted",
  iconColor = "text-muted-foreground",
}: PlaceholderCardProps) {
  return (
    <Card className="rounded-2xl border-border/70 shadow-none">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className={`flex size-8 items-center justify-center rounded-lg ${accent}`}>
            <Icon className={`size-4 ${iconColor}`} />
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/10 px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
