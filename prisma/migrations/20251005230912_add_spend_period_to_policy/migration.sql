-- CreateEnum
CREATE TYPE "public"."SpendPeriod" AS ENUM ('PER_EXPENSE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "public"."Policy" ADD COLUMN     "spendPeriod" "public"."SpendPeriod" NOT NULL DEFAULT 'PER_EXPENSE';
