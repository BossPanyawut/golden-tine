"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { formatMoney } from "@/lib/format";
import {
  advanceSubscription,
  cancelSubscription,
  createSubscription,
} from "@/server/actions/finance";
import type { getSubscriptions } from "@/server/data/finance";

type Subscription = Awaited<ReturnType<typeof getSubscriptions>>[number];

function Row({ sub }: { sub: Subscription }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1">
        <p className="text-sm font-medium">{sub.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatMoney(sub.amount)} · {sub.cycle}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {sub.nextBillingDate}
        </span>
        {sub.overdue ? (
          <Badge variant="destructive">Overdue</Badge>
        ) : sub.dueSoon ? (
          <Badge variant="secondary">Due soon</Badge>
        ) : null}
      </div>
      <Button
        variant="outline"
        size="xs"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            try {
              await advanceSubscription(sub.id);
            } catch {
              toast.error("Couldn't update.");
            }
          });
        }}
      >
        Mark paid
      </Button>
      <Button
        variant="ghost"
        size="xs"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            try {
              await cancelSubscription(sub.id);
            } catch {
              toast.error("Couldn't cancel.");
            }
          });
        }}
      >
        Cancel
      </Button>
    </div>
  );
}

function NewSubscriptionDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [nextBillingDate, setNextBillingDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline">+ New subscription</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New subscription</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !amount.trim()) return;
            startTransition(async () => {
              try {
                await createSubscription({
                  name,
                  amount,
                  cycle,
                  nextBillingDate,
                  reminderDaysBefore: 3,
                });
                setName("");
                setAmount("");
                setOpen(false);
              } catch {
                toast.error("Couldn't create subscription.");
              }
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="sub-name">Name</Label>
            <Input
              id="sub-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Netflix"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="sub-amount">Amount</Label>
              <Input
                id="sub-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="349.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cycle</Label>
              <Select value={cycle} onValueChange={(v) => setCycle(v as typeof cycle)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sub-date">Next billing date</Label>
            <Input
              id="sub-date"
              type="date"
              value={nextBillingDate}
              onChange={(e) => setNextBillingDate(e.target.value)}
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

export function SubscriptionsSection({
  subscriptions,
}: {
  subscriptions: Subscription[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Subscriptions</h2>
        <NewSubscriptionDialog />
      </div>
      {subscriptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No active subscriptions.
        </p>
      ) : (
        <div className="divide-y rounded-lg border px-3">
          {subscriptions.map((sub) => (
            <Row key={sub.id} sub={sub} />
          ))}
        </div>
      )}
    </div>
  );
}
