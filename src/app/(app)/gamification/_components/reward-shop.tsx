"use client";

import { useState, useTransition } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
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
import {
  archiveReward,
  createReward,
  redeemReward,
} from "@/server/actions/gamification";
import type { getRewards } from "@/server/data/gamification";

type Reward = Awaited<ReturnType<typeof getRewards>>[number];

function RewardCard({
  reward,
  spendableExp,
}: {
  reward: Reward;
  spendableExp: number;
}) {
  const [isPending, startTransition] = useTransition();
  const affordable = spendableExp >= reward.cost;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2">
        <CardTitle className="text-base">{reward.name}</CardTitle>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => {
            startTransition(async () => {
              try {
                await archiveReward(reward.id);
              } catch {
                toast.error("Couldn't remove reward.");
              }
            });
          }}
        >
          <Trash2 />
        </Button>
      </CardHeader>
      <CardContent>
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" />
          {reward.cost} EXP
        </span>
      </CardContent>
      <CardFooter>
        <Button
          size="sm"
          className="w-full"
          disabled={isPending || !affordable}
          onClick={() => {
            startTransition(async () => {
              const result = await redeemReward(reward.id);
              if ("error" in result) {
                toast.error(result.error);
              } else {
                toast.success(`Redeemed: ${reward.name}`);
              }
            });
          }}
        >
          {affordable ? "Redeem" : "Not enough EXP"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function NewRewardDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">+ New reward</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New reward</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const costNum = Number(cost);
            if (!name.trim() || !Number.isFinite(costNum) || costNum < 1) return;
            startTransition(async () => {
              try {
                await createReward({ name, cost: Math.floor(costNum) });
                setName("");
                setCost("");
                setOpen(false);
              } catch {
                toast.error("Couldn't create reward.");
              }
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="reward-name">Name</Label>
            <Input
              id="reward-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="2 hours free gaming time"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reward-cost">Cost (EXP)</Label>
            <Input
              id="reward-cost"
              type="number"
              min={1}
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="500"
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

export function RewardShop({
  rewards,
  spendableExp,
}: {
  rewards: Reward[];
  spendableExp: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Reward Shop</h2>
        <NewRewardDialog />
      </div>
      {rewards.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No rewards yet — add something to work toward.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              spendableExp={spendableExp}
            />
          ))}
        </div>
      )}
    </div>
  );
}
