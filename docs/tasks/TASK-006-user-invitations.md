# Task: User Invitations & Team Management

## Meta Information

- **Task ID**: `TASK-006`
- **Title**: User Invitations & Team Management
- **Status**: `Not Started`
- **Priority**: `P1`
- **Created**: 2025-10-05
- **Updated**: 2025-10-05
- **Estimated Effort**: 5-6 hours

## Related Documents

- **PRD**: docs/product/prd-main.md (FR1: User Management)
- **Dependencies**: TASK-001 (Organization Setup)

## Description

Allow admins to invite users to their organization via email. Users can accept invitations and join with Member role. Includes invitation management and team member list.

## Acceptance Criteria

- [ ] Database: Invitation model (email, organizationId, role, token, expiresAt)
- [ ] Migration created and applied
- [ ] tRPC: Send invitation procedure (admin only)
- [ ] tRPC: List pending invitations query
- [ ] tRPC: Accept invitation procedure
- [ ] tRPC: List organization members query
- [ ] Email: Send invitation email with magic link
- [ ] UI: Team management page for admins
- [ ] UI: Invite member form
- [ ] UI: Accept invitation flow for invitees
- [ ] Tests: Invitation flow tested
- [ ] Security: Validate invitation tokens and expiration

## TODOs

- [ ] Add Invitation model to schema
- [ ] Create migration
- [ ] Create invitation tRPC router
- [ ] Implement send invitation with email
- [ ] Implement accept invitation logic
- [ ] Build team management page
- [ ] Build invite form
- [ ] Build invitation acceptance page
- [ ] Write tests for invitation flow
- [ ] Test token validation and expiration

## Completion Checklist

- [ ] All acceptance criteria met
- [ ] Code follows project standards
- [ ] Tests written and passing
- [ ] Invitations sent and accepted successfully
- [ ] Team members visible to admins

## Notes

This can be done earlier or later depending on testing needs. For early testing, you might create users directly in the database.
