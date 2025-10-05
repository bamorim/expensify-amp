# Task: Policy Spend Periods with Budget Enforcement

## Meta Information

- **Task ID**: `TASK-007`
- **Title**: Policy Spend Periods with Budget Enforcement
- **Status**: `Not Started`
- **Priority**: `P1`
- **Created**: 2025-10-06
- **Updated**: 2025-10-06
- **Estimated Effort**: 8-10 hours

## Related Documents

- **PRD**: docs/product/prd-main.md (FR4: Policy Management, FR6: Expense Submission, FR7: Review Workflow)
- **Dependencies**: TASK-003 (Policy Management)

## Description

Extend the policy management system to support spend period enforcement. Policies can now specify a spend period (Per Expense, Daily, Weekly, Monthly, or Yearly) that determines how budget limits are calculated. The system will track approved expenses within the spend period and automatically reject expenses that would exceed the policy limit. This also adds a guard in the approval flow to prevent approving expenses that would cause the policy to be exceeded.

## Acceptance Criteria

- [ ] Database: Add `spendPeriod` field to Policy model with enum values (PER_EXPENSE, DAILY, WEEKLY, MONTHLY, YEARLY)
- [ ] Migration created and applied
- [ ] Business logic: Calculate total approved expenses for a user/category within the spend period (Use ISO WEEK start for week start period)
- [ ] Business logic: Reject expense submission if it would exceed policy limit considering existing approved expenses
- [ ] Business logic: Add approval guard to prevent approving expenses that would exceed policy limit
- [ ] tRPC: Update policy CRUD procedures to include spend period
- [ ] tRPC: Update expense submission to check spend period limits
- [ ] tRPC: Update approval flow to validate spend period limits
- [ ] UI: Add spend period selector to policy create/edit form
- [ ] UI: Show relevant period usage when submitting/reviewing expenses
- [ ] Tests: Spend period calculation logic tested for all period types
- [ ] Tests: Budget enforcement tested during submission and approval
- [ ] Tests: Edge cases (period boundaries, timezone handling) tested

## TODOs

- [ ] Add `spendPeriod` enum to Prisma schema
- [ ] Create migration for Policy model update
- [ ] Implement spend period date range calculation logic (daily, weekly, monthly, yearly)
- [ ] Implement approved expense aggregation query by period
- [ ] Add budget validation to expense submission procedure
- [ ] Add budget validation to expense approval procedure
- [ ] Update policy create/edit procedures to include spend period
- [ ] Update UI policy form with spend period selector
- [ ] Add period usage display to expense submission form
- [ ] Add period usage display to expense review page
- [ ] Write tests for date range calculation (edge cases: month boundaries, leap years, week start day)
- [ ] Write tests for budget enforcement in submission flow
- [ ] Write tests for budget enforcement in approval flow
- [ ] Write tests for concurrent submission/approval scenarios

## Progress Updates

### 2025-10-06 - Initial Planning

**Status**: Not Started
**Progress**: Task created based on requirements
**Blockers**: None
**Next Steps**: Review and start implementation

## Completion Checklist

- [ ] All acceptance criteria met
- [ ] Code follows project standards
- [ ] Tests written and passing
- [ ] Spend period calculation handles timezone correctly
- [ ] Budget enforcement works for all period types
- [ ] Approval guard prevents budget overruns
- [ ] Documentation updated (if needed)
- [ ] Code review completed

## Notes

### Implementation Considerations

1. **Period Calculation**: Need to define how periods are calculated:
   - Daily: Same calendar day
   - Weekly: Rolling 7 days or calendar week (Monday-Sunday)?
   - Monthly: Calendar month
   - Yearly: Calendar year or rolling 12 months?

2. **Timezone Handling**: Expense dates should be evaluated in the organization's timezone to ensure consistent period boundaries.

3. **Race Conditions**: Need to handle concurrent submissions/approvals that could exceed budget. Consider using database transactions or optimistic locking.

4. **Per Expense**: This is the existing behavior (single expense limit), should remain the default.

5. **Performance**: Aggregating approved expenses might require indexing on expense date and status fields.

6. **User Feedback**: When an expense is rejected or cannot be approved due to budget limits, provide clear feedback about current period usage.

---

**Template Version**: 1.0
**Last Updated**: 2025-10-06
