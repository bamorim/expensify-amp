# Task: Expense Review Workflow

## Meta Information

- **Task ID**: `TASK-005`
- **Title**: Expense Review Workflow
- **Status**: `Completed`
- **Priority**: `P0`
- **Created**: 2025-10-05
- **Updated**: 2025-10-05
- **Estimated Effort**: 4-5 hours

## Related Documents

- **PRD**: docs/product/prd-main.md (FR7: Review Workflow)
- **Dependencies**: TASK-004 (Expense Submission)

## Description

Build review workflow for admins/reviewers to approve or reject pending expenses. Includes listing pending expenses, viewing details, and taking action with optional comments.

## Acceptance Criteria

- [ ] tRPC: List pending expenses for review (admin only)
- [ ] tRPC: Approve expense procedure
- [ ] tRPC: Reject expense procedure with optional comment
- [ ] Database: Add reviewedBy and reviewComment fields to Expense
- [ ] UI: Pending expenses review queue for admins
- [ ] UI: Expense detail view with approve/reject actions
- [ ] UI: Comment field for rejection reason
- [ ] Authorization: Only admins can review
- [ ] Tests: Review workflow procedures tested
- [ ] Audit trail: Track who reviewed and when

## TODOs

- [ ] Update Expense model with review fields
- [ ] Create migration
- [ ] Add review procedures to expense router
- [ ] Build review queue page for admins
- [ ] Build expense detail modal/page
- [ ] Add approve/reject action buttons
- [ ] Add comment field for rejections
- [ ] Write tests for review procedures
- [ ] Test authorization (admin only)
- [ ] Verify status transitions

## Completion Checklist

- [ ] All acceptance criteria met
- [ ] Code follows project standards
- [ ] Tests written and passing
- [ ] Admins can review and take action on expenses
- [ ] Audit trail captured

## Notes

Consider adding filtering/sorting to review queue for large volumes.
