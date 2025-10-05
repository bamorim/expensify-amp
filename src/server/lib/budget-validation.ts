import type { PrismaClient, Policy } from "@prisma/client";
import { SpendPeriod } from "@prisma/client";
import { getSpendPeriodDateRange } from "./spend-period";

export async function getTotalApprovedExpenses(
  db: PrismaClient,
  userId: string,
  categoryId: string,
  organizationId: string,
  date: Date,
  period: SpendPeriod,
  excludeExpenseId?: string,
): Promise<number> {
  if (period === "PER_EXPENSE") {
    return 0;
  }

  const { start, end } = getSpendPeriodDateRange(date, period);

  const result = await db.expense.aggregate({
    where: {
      userId,
      categoryId,
      organizationId,
      status: "APPROVED",
      date: {
        gte: start,
        lte: end,
      },
      ...(excludeExpenseId ? { id: { not: excludeExpenseId } } : {}),
    },
    _sum: {
      amount: true,
    },
  });

  return result._sum.amount ?? 0;
}

export async function validateBudget(
  db: PrismaClient,
  userId: string,
  categoryId: string,
  organizationId: string,
  amount: number,
  date: Date,
  policy: Policy,
  excludeExpenseId?: string,
): Promise<{ isValid: boolean; currentSpent: number; limit: number }> {
  const currentSpent = await getTotalApprovedExpenses(
    db,
    userId,
    categoryId,
    organizationId,
    date,
    policy.spendPeriod,
    excludeExpenseId,
  );

  const totalWithNewExpense = currentSpent + amount;
  const isValid = totalWithNewExpense <= policy.maxAmount;

  return {
    isValid,
    currentSpent,
    limit: policy.maxAmount,
  };
}
