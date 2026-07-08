"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { deleteTransaction } from "@/server/actions/finance";
import type { getTransactions } from "@/server/data/finance";

type Transaction = Awaited<ReturnType<typeof getTransactions>>[number];

function Row({ tx }: { tx: Transaction }) {
  const [isPending, startTransition] = useTransition();
  const isIncome = tx.type === "income";

  return (
    <div className="group flex items-center gap-3 py-2">
      <div className="flex-1">
        <p className="text-sm font-medium">
          {tx.category || (isIncome ? "Income" : "Expense")}
        </p>
        {tx.note && (
          <p className="text-xs text-muted-foreground">{tx.note}</p>
        )}
      </div>
      <span className="text-xs text-muted-foreground">{tx.date}</span>
      <span
        className={
          isIncome
            ? "w-28 text-right text-sm font-medium text-emerald-600 dark:text-emerald-400"
            : "w-28 text-right text-sm font-medium"
        }
      >
        {isIncome ? "+" : "−"}
        {formatMoney(tx.amount)}
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        className="opacity-0 group-hover:opacity-100"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            try {
              await deleteTransaction(tx.id);
            } catch {
              toast.error("Couldn't delete.");
            }
          });
        }}
      >
        <Trash2 />
      </Button>
    </div>
  );
}

export function TransactionList({
  transactions,
}: {
  transactions: Transaction[];
}) {
  if (transactions.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No transactions yet.
      </p>
    );
  }

  return (
    <div className="divide-y">
      {transactions.map((tx) => (
        <Row key={tx.id} tx={tx} />
      ))}
    </div>
  );
}
