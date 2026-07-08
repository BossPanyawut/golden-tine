import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getBalance,
  getGoalFundings,
  getSubscriptions,
  getTransactions,
} from "@/server/data/finance";
import { formatMoney } from "@/lib/format";
import { TransactionForm } from "./_components/transaction-form";
import { TransactionList } from "./_components/transaction-list";
import { GoalFundingSection } from "./_components/goal-funding";
import { SubscriptionsSection } from "./_components/subscriptions";

export default async function FinancePage() {
  const [balance, transactions, goals, subscriptions] = await Promise.all([
    getBalance(),
    getTransactions(),
    getGoalFundings(),
    getSubscriptions(),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Balance</CardDescription>
            <CardTitle
              className={
                balance.balance >= 0
                  ? "text-2xl"
                  : "text-2xl text-destructive"
              }
            >
              {formatMoney(balance.balance)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Income</CardDescription>
            <CardTitle className="text-2xl text-emerald-600 dark:text-emerald-400">
              {formatMoney(balance.income)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Expenses</CardDescription>
            <CardTitle className="text-2xl">
              {formatMoney(balance.expense)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="space-y-3">
        <TransactionForm />
        <div className="rounded-lg border px-3">
          <TransactionList transactions={transactions} />
        </div>
      </div>

      <GoalFundingSection goals={goals} />
      <SubscriptionsSection subscriptions={subscriptions} />
    </div>
  );
}
