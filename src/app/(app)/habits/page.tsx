import { getHabits } from "@/server/data/habits";
import { HabitList } from "./_components/habit-list";
import { NewHabitDialog } from "./_components/new-habit-dialog";

export default async function HabitsPage() {
  const habits = await getHabits();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Habits & Routines</h1>
        <NewHabitDialog />
      </div>
      <HabitList habits={habits} />
    </div>
  );
}
