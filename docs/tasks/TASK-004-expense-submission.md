# Task: Expense Submission & Auto-Processing

## Meta Information

- **Task ID**: `TASK-004`
- **Title**: Expense Submission & Auto-Processing
- **Status**: `Not Started`
- **Priority**: `P0`
- **Created**: 2025-10-05
- **Updated**: 2025-10-05
- **Estimated Effort**: 5-7 hours

## Related Documents

- **PRD**: docs/product/prd-main.md (FR6: Expense Submission)
- **Dependencies**: TASK-003 (Policy Management)

## Description

Allow users to submit expense reimbursement requests. System automatically applies policy rules: auto-rejects expenses over limit, auto-approves compliant expenses if policy allows, or routes to manual review.

## Acceptance Criteria

- [ ] Database: Expense model (userId, categoryId, amount, date, description, status, organizationId)
- [ ] Migration created and applied
- [ ] tRPC: Submit expense procedure
- [ ] Business logic: Apply policy resolution on submission
- [ ] Business logic: Auto-reject if over limit
- [ ] Business logic: Auto-approve or route to review based on policy
- [ ] tRPC: List my expenses query
- [ ] UI: Expense submission form
- [ ] UI: My expenses list with status
- [ ] Tests: Expense submission and auto-processing logic
- [ ] Data isolation: Users only see their own expenses

## TODOs

- [ ] Add Expense model to schema with status enum
- [ ] Create migration
- [ ] Create expense tRPC router
- [ ] Implement submit expense procedure with policy application
- [ ] Implement auto-approval/rejection logic
- [ ] Build expense submission form
- [ ] Build my expenses list page
- [ ] Add status badges and filtering
- [ ] Write tests for all submission scenarios
- [ ] Test policy integration

## Completion Checklist

- [ ] All acceptance criteria met
- [ ] Code follows project standards
- [ ] Tests written and passing
- [ ] Expenses correctly auto-processed based on policies
- [ ] Users can submit and view their expenses

## Notes

This is where the policy engine really comes to life. Status should be: PENDING, APPROVED, REJECTED.
