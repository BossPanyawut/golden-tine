"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatMoney } from "@/lib/format";
import {
  contributeToGoal,
  createGoalFunding,
  deleteGoalFunding,
} from "@/server/actions/finance";
import type { getGoalFundings } from "@/server/data/finance";

type Goal = Awaited<ReturnType<typeof getGoalFundings>>[number];

function GoalCard({ goal }: { goal: Goal }) {
  const [amount, setAmount] = useState("");
  const [isPending, startTransition] = useTransition();
  const saved = Number(goal.savedAmount);
  const target = Number(goal.targetAmount);
  const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2">
        <CardTitle className="text-base">{goal.name}</CardTitle>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => {
            startTransition(async () => {
              try {
                await deleteGoalFunding(goal.id);
              } catch {
                toast.error("Couldn't delete goal.");
              }
            });
          }}
        >
          <Trash2 />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>
              {formatMoney(saved)} / {formatMoney(target)}
            </span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!amount.trim()) return;
            startTransition(async () => {
              try {
                await contributeToGoal({ goalId: goal.id, amount });
                setAmount("");
              } catch {
                toast.error("Couldn't add contribution.");
              }
            });
          }}
        >
          <Input
            placeholder="Add savings…"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-8"
          />
          <Button type="submit" size="sm" disabled={isPending}>
            <Plus /> Fund
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function NewGoalDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline">+ New goal</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New savings goal</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !target.trim()) return;
            startTransition(async () => {
              try {
                await createGoalFunding({ name, targetAmount: target });
                setName("");
                setTarget("");
                setOpen(false);
              } catch {
                toast.error("Couldn't create goal.");
              }
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="goal-name">Name</Label>
            <Input
              id="goal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tattoo fund"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal-target">Target amount</Label>
            <Input
              id="goal-target"
              inputMode="decimal"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="30000.00"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function GoalFundingSection({ goals }: { goals: Goal[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Savings Goals</h2>
        <NewGoalDialog />
      </div>
      {goals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No savings goals yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
