# Task: Organization Creation & Management

## Meta Information

- **Task ID**: `TASK-001`
- **Title**: Organization Creation & Management
- **Status**: `Not Started`
- **Priority**: `P0`
- **Created**: 2025-10-05
- **Updated**: 2025-10-05
- **Estimated Effort**: 4-6 hours

## Related Documents

- **PRD**: docs/product/prd-main.md (FR2: Organization Management)
- **Dependencies**: None

## Description

Build the foundation for organizations: users can create an organization and become its first admin. This includes database models, tRPC API, and UI for creating and viewing organization details.

## Acceptance Criteria

- [ ] Database: Organization model with name, createdAt, updatedAt
- [ ] Database: OrganizationMember join table with userId, organizationId, role (Admin/Member)
- [ ] Migration created and applied
- [ ] tRPC router: createOrganization mutation
- [ ] tRPC router: getMyOrganizations query
- [ ] UI: Create organization page/modal
- [ ] UI: Organization selector/switcher (if user has multiple)
- [ ] Tests: tRPC procedures tested
- [ ] User automatically becomes Admin when creating org

## TODOs

- [ ] Remove placeholder Post model from Prisma schema
- [ ] Remove any Post-related tRPC routes and procedures
- [ ] Remove any Post-related UI components
- [ ] Add Organization and OrganizationMember models to Prisma schema
- [ ] Create and run migration
- [ ] Create organization tRPC router with create/list procedures
- [ ] Add UI for creating new organization
- [ ] Add organization context/switcher to layout
- [ ] Write tests for organization procedures
- [ ] Verify organization-scoped data isolation

## Completion Checklist

- [ ] All acceptance criteria met
- [ ] Code follows project standards
- [ ] Tests written and passing
- [ ] Can create org and see it in UI

## Notes

This is the foundation - all other features will be organization-scoped.
