# Task: Expense Categories Management

## Meta Information

- **Task ID**: `TASK-002`
- **Title**: Expense Categories Management
- **Status**: `Completed`
- **Priority**: `P0`
- **Created**: 2025-10-05
- **Updated**: 2025-10-05
- **Completed**: 2025-10-05
- **Estimated Effort**: 3-4 hours

## Related Documents

- **PRD**: docs/product/prd-main.md (FR3: Expense Categories)
- **Dependencies**: TASK-001 (Organization Setup)

## Description

Allow admins to create, edit, and delete expense categories within their organization. Categories are the foundation for policies and expense submissions.

## Acceptance Criteria

- [x] Database: ExpenseCategory model (name, description, organizationId)
- [x] Migration created and applied
- [x] tRPC router: CRUD operations for categories (admin only)
- [x] UI: Categories management page for admins
- [x] UI: Create/edit category form
- [x] UI: Delete category with confirmation
- [x] Authorization: Only admins can manage categories
- [x] Tests: Category CRUD procedures tested
- [x] Data isolation: Categories scoped to organization

## TODOs

- [x] Add ExpenseCategory model to schema
- [x] Create migration
- [x] Create category tRPC router with CRUD procedures
- [x] Add role-based authorization middleware
- [x] Build categories list page
- [x] Build create/edit category form
- [x] Add delete functionality
- [x] Write tests for category procedures
- [x] Test admin-only access

## Completion Checklist

- [x] All acceptance criteria met
- [x] Code follows project standards
- [x] Tests written and passing
- [x] Admins can manage categories via UI
- [x] Members cannot access category management

## Notes

Categories will be referenced by policies and expenses in later tasks.
