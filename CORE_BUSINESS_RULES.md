20. CORE BUSINESS RULES

1. Ownership (Bảo mật sở hữu):
   - Candidates may only view and interact with Support Tickets they created.
   - Backend MUST return 404 Not Found for requests to access tickets not owned by the caller.

2. Internal notes (Ẩn note nội bộ):
   - Any support message marked with `isInternalNote = true` is strictly internal and MUST NOT be shown to candidate-facing UIs.
   - Frontend components rendering ticket threads must filter messages to exclude internal notes.

3. Role-based permissions (Phân quyền Role):
   - `admin` role has full system permissions.
   - `support` role may view and act on support tickets only; `support` MUST NOT be able to access billing, revenue, or user configuration screens.
   - UI SHOULD hide/disable actions unavailable to the current role; server must perform authoritative authorization checks.

4. Dev promote (Dev promote):
   - Developer-only promotion endpoints and UI MUST be gated to development/local environments only.
   - Frontend MUST NOT call dev-promote endpoints in production. Runtime checks are required in the frontend to prevent accidental usage.

Implementation notes:
- Frontend responsibilities: hide internal notes, hide admin-only UI for non-admin roles, enforce runtime checks before calling dev-only endpoints.
- Backend responsibilities: enforce ownership, return 404 for unauthorized ticket access, perform role authorization checks server-side.

Revision: 2026-05-27
