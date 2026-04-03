# Technical Specification: [Feature Name]

## 1. Summary
Explain the feature in simple language.

Answer:
- what is being built
- why it is needed
- who it helps

## 2. Scope

### In Scope
- Item 1
- Item 2

### Out of Scope
- Item 1
- Item 2

## 3. Goals
- Goal 1
- Goal 2

## 4. Non-Goals
- Non-goal 1
- Non-goal 2

## 5. Users And Roles
- `Admin`:
- `User`:
- `Guest`:

## 6. Functional Requirements
- Requirement 1
- Requirement 2
- Requirement 3

## 7. Proposed Design

### Affected Modules
- Module:
- Responsibility:

### Request Flow
Describe the step-by-step request lifecycle from controller to service to persistence layer.

### Data Flow
Describe how data enters, is validated, is processed, and is returned.

### Validation Rules
- Input validation:
- Business validation:
- Error cases:

## 8. API Impact

### Endpoints
- Method:
- Path:
- Purpose:
- Request DTO:
- Response DTO:
- Error responses:

### Auth And Access Rules
- Who can call it:
- Guard or auth strategy:
- Permission rules:

## 9. Database Impact
- Tables or collections affected:
- New fields:
- Relationships:
- Indexes:
- Migration needed: `yes/no`

## 10. Scalability And Operational Notes
- Expected traffic:
- Pagination or filtering:
- Caching:
- Queue or async work:
- Logging and monitoring:

## 11. Security Considerations
- Authentication:
- Authorization:
- Input validation:
- Rate limiting:
- Sensitive data handling:

## 12. Testing Strategy

### Unit Tests
- What should be covered:

### Integration Tests
- What should be covered:

### Manual Test Steps
1. Step 1
2. Step 2
3. Step 3

## 13. Documentation Updates
- API docs:
- Database docs:
- Workflow docs:
- Feature docs:
- ADR needed: `yes/no`

## 14. Rollout Plan
- Environment variables:
- Migration steps:
- Deployment order:
- Rollback plan:

## 15. Risks And Mitigations
- Risk:
  Mitigation:
- Risk:
  Mitigation:

## 16. Open Questions
- Question 1
- Question 2
