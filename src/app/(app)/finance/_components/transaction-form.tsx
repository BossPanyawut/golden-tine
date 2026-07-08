"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTransaction } from "@/server/actions/finance";

export function TransactionForm() {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount.trim()) return;
    startTransition(async () => {
      try {
        await createTransaction({
          type,
          amount,
          category: category || undefined,
          note: note || undefined,
          date,
        });
        setAmount("");
        setCategory("");
        setNote("");
      } catch {
        toast.error("Couldn't save. Check the amount and try again.");
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-end gap-2 rounded-lg border p-3"
    >
      <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="expense">Expense</SelectItem>
          <SelectItem value="income">Income</SelectItem>
        </SelectContent>
      </Select>
      <Input
        placeholder="0.00"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-28"
      />
      <Input
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-36"
      />
      <Input
        placeholder="Note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="min-w-40 flex-1"
      />
      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-40"
      />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Add"}
      </Button>
    </form>
  );
}
