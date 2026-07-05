"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createHabitSchema,
  type CreateHabitInput,
} from "@/lib/validation/habits";
import { createHabit } from "@/server/actions/habits";

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export function NewHabitDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateHabitInput>({
    resolver: zodResolver(createHabitSchema),
    defaultValues: { name: "", recurrence: "daily", daysOfWeek: [] },
  });

  const recurrence = watch("recurrence");

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      try {
        await createHabit(data);
        reset({ name: "", recurrence: "daily", daysOfWeek: [] });
        setOpen(false);
      } catch {
        toast.error("Couldn't create habit.");
      }
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">+ New habit</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New habit</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="habit-name">Name</Label>
            <Input id="habit-name" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="habit-category">Category (optional)</Label>
            <Input id="habit-category" placeholder="Health, entertainment…" {...register("category")} />
          </div>
          <div className="space-y-1.5">
            <Label>Recurrence</Label>
            <Controller
              control={control}
              name="recurrence"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {recurrence === "weekly" && (
            <div className="space-y-1.5">
              <Label>Days of week</Label>
              <Controller
                control={control}
                name="daysOfWeek"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-3">
                    {WEEKDAYS.map((day) => {
                      const checked = field.value?.includes(day.value) ?? false;
                      return (
                        <label
                          key={day.value}
                          className="flex items-center gap-1.5 text-sm"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(next) => {
                              const current = field.value ?? [];
                              field.onChange(
                                next
                                  ? [...current, day.value]
                                  : current.filter((d) => d !== day.value)
                              );
                            }}
                          />
                          {day.label}
                        </label>
                      );
                    })}
                  </div>
                )}
              />
              {errors.daysOfWeek && (
                <p className="text-xs text-destructive">
                  {errors.daysOfWeek.message}
                </p>
              )}
            </div>
          )}

          {recurrence === "monthly" && (
            <div className="space-y-1.5">
              <Label htmlFor="habit-day-of-month">Day of month</Label>
              <Input
                id="habit-day-of-month"
                type="number"
                min={1}
                max={31}
                {...register("dayOfMonth", { valueAsNumber: true })}
              />
              {errors.dayOfMonth && (
                <p className="text-xs text-destructive">
                  {errors.dayOfMonth.message}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create habit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
