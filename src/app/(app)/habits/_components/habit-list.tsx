"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { Flame, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { archiveHabit, checkInHabit, undoCheckIn } from "@/server/actions/habits";
import type { getHabits } from "@/server/data/habits";
import type { HabitRecurrence } from "@/server/services/streak-engine";

type Habit = Awaited<ReturnType<typeof getHabits>>[number];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function recurrenceLabel(recurrence: HabitRecurrence): string {
  if (recurrence.kind === "daily") return "Daily";
  if (recurrence.kind === "weekly") {
    return `Weekly · ${recurrence.daysOfWeek
      .slice()
      .sort()
      .map((d) => WEEKDAY_NAMES[d])
      .join(", ")}`;
  }
  return `Monthly · day ${recurrence.dayOfMonth}`;
}

function HabitCard({ habit }: { habit: Habit }) {
  const [isPending, startTransition] = useTransition();
  const today = format(new Date(), "yyyy-MM-dd");

  function toggleToday() {
    startTransition(async () => {
      try {
        if (habit.completedToday) {
          await undoCheckIn({ habitId: habit.id, date: today });
        } else {
          await checkInHabit({ habitId: habit.id, date: today });
        }
      } catch {
        toast.error("Couldn't update check-in.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={habit.completedToday}
            disabled={isPending || !habit.scheduledToday}
            aria-label={`Check in: ${habit.name}`}
            onCheckedChange={toggleToday}
            className="mt-1"
          />
          <div>
            <CardTitle className="text-base">{habit.name}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {recurrenceLabel(habit.recurrence)}
              {habit.category ? ` · ${habit.category}` : ""}
              {!habit.scheduledToday && " · not scheduled today"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => {
            startTransition(async () => {
              try {
                await archiveHabit(habit.id);
              } catch {
                toast.error("Couldn't archive habit.");
              }
            });
          }}
        >
          <Trash2 />
        </Button>
      </CardHeader>
      <CardContent>
        <Badge variant={habit.streak.current > 0 ? "default" : "secondary"}>
          <Flame /> {habit.streak.current} day streak
        </Badge>
        {habit.streak.longest > habit.streak.current && (
          <span className="ml-2 text-xs text-muted-foreground">
            best: {habit.streak.longest}
          </span>
        )}
      </CardContent>
    </Card>
  );
}

export function HabitList({ habits }: { habits: Habit[] }) {
  if (habits.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No habits yet — add one to start a streak.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {habits.map((habit) => (
        <HabitCard key={habit.id} habit={habit} />
      ))}
    </div>
  );
}
