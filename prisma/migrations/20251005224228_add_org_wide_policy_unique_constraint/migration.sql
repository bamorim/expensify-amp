-- CreateIndex
-- Partial unique index to prevent multiple org-wide policies for the same category
CREATE UNIQUE INDEX "Policy_categoryId_organizationId_key" 
ON "public"."Policy"("categoryId", "organizationId") 
WHERE "userId" IS NULL;
