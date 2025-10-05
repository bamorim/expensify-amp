# Task: Expense Categories Management

## Meta Information

- **Task ID**: `TASK-002`
- **Title**: Expense Categories Management
- **Status**: `Not Started`
- **Priority**: `P0`
- **Created**: 2025-10-05
- **Updated**: 2025-10-05
- **Estimated Effort**: 3-4 hours

## Related Documents

- **PRD**: docs/product/prd-main.md (FR3: Expense Categories)
- **Dependencies**: TASK-001 (Organization Setup)

## Description

Allow admins to create, edit, and delete expense categories within their organization. Categories are the foundation for policies and expense submissions.

## Acceptance Criteria

- [ ] Database: ExpenseCategory model (name, description, organizationId)
- [ ] Migration created and applied
- [ ] tRPC router: CRUD operations for categories (admin only)
- [ ] UI: Categories management page for admins
- [ ] UI: Create/edit category form
- [ ] UI: Delete category with confirmation
- [ ] Authorization: Only admins can manage categories
- [ ] Tests: Category CRUD procedures tested
- [ ] Data isolation: Categories scoped to organization

## TODOs

- [ ] Add ExpenseCategory model to schema
- [ ] Create migration
- [ ] Create category tRPC router with CRUD procedures
- [ ] Add role-based authorization middleware
- [ ] Build categories list page
- [ ] Build create/edit category form
- [ ] Add delete functionality
- [ ] Write tests for category procedures
- [ ] Test admin-only access

## Completion Checklist

- [ ] All acceptance criteria met
- [ ] Code follows project standards
- [ ] Tests written and passing
- [ ] Admins can manage categories via UI
- [ ] Members cannot access category management

## Notes

Categories will be referenced by policies and expenses in later tasks.
