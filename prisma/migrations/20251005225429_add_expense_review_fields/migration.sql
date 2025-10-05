-- AlterTable
ALTER TABLE "public"."Expense" ADD COLUMN     "reviewComment" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT;

-- CreateIndex
CREATE INDEX "Expense_reviewedBy_idx" ON "public"."Expense"("reviewedBy");

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
