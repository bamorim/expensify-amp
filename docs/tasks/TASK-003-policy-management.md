# Task: Policy Management & Resolution Engine

## Meta Information

- **Task ID**: `TASK-003`
- **Title**: Policy Management & Resolution Engine
- **Status**: `Completed`
- **Priority**: `P0`
- **Created**: 2025-10-05
- **Updated**: 2025-10-05
- **Completed**: 2025-10-05
- **Estimated Effort**: 6-8 hours

## Related Documents

- **PRD**: docs/product/prd-main.md (FR4: Policy Management, FR5: Policy Resolution Engine)
- **Dependencies**: TASK-002 (Expense Categories)

## Description

Build policy management system allowing admins to define reimbursement policies per category. Includes both organization-wide and user-specific policies with clear precedence rules, plus a policy resolution engine to determine which policy applies.

## Acceptance Criteria

- [ ] Database: Policy model (categoryId, userId optional, maxAmount, requiresReview, organizationId)
- [ ] Migration created and applied
- [ ] tRPC: Create/edit/delete policy procedures (admin only)
- [ ] tRPC: Policy resolution procedure (given user + category, return applicable policy)
- [ ] Business logic: User-specific policies override org-wide policies
- [ ] UI: Policy management page for admins
- [ ] UI: Create/edit policy form (org-wide or user-specific)
- [ ] UI: Policy debugging/preview tool
- [ ] Tests: Policy CRUD and resolution logic tested
- [ ] Authorization: Only admins can manage policies

## TODOs

- [ ] Add Policy model to schema
- [ ] Create migration
- [ ] Create policy tRPC router with CRUD procedures
- [ ] Implement policy resolution engine procedure
- [ ] Build policy list page grouped by category
- [ ] Build create/edit policy form
- [ ] Add user selector for user-specific policies
- [ ] Build policy debugging/preview tool
- [ ] Write tests for policy resolution precedence
- [ ] Test edge cases (multiple policies, missing policies)

## Completion Checklist

- [ ] All acceptance criteria met
- [ ] Code follows project standards
- [ ] Tests written and passing
- [ ] Policy resolution correctly handles precedence
- [ ] UI clearly shows which policies apply to whom

## Notes

Key challenge: Policy resolution logic must be clear and testable. Consider edge cases like missing policies or multiple user-specific policies.
