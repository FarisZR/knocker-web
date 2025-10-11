# Knocker Web Design Document

## Overview
Knocker Web is a client-side web application for interacting with Knocker, a token-based IP whitelisting solution.

## Architecture

### Technology Stack
- **Framework**: React 19 with Vite
- **State Management**: TanStack Query for server state
- **Form Management**: Session Storage for persistence
- **Testing**: Vitest + Testing Library + MSW for API mocking
- **Styling**: Tailwind CSS v4
- **Type Safety**: TypeScript with Valibot for runtime validation

### Key Design Decisions

1. **Client-Side Only**: All logic runs in the browser, no backend required
2. **Session Persistence**: Form inputs stored in sessionStorage for convenience
3. **Auto-Knock**: Automatically performs knock on load if session data exists
4. **TDD Approach**: Tests written before implementation following repository patterns

## UI/UX Design

### Color Scheme
- **Accent Color**: #fde562 (golden yellow)
- **Light Mode**: White background with dark text
- **Dark Mode**: Dark background (#1f2937) with light text
- **Visual Feedback**: 
  - Success: Green checkmark with accent color glow
  - Failure: Red error message with clear explanation

### Form Layout
The main interface consists of:
1. Required inputs (Knocker Endpoint URL, Token)
2. Optional inputs (TTL, IP/CIDR to whitelist)
3. Submit button with loading state
4. Result display area

### Responsive Design
- Mobile-first approach
- Single column layout on mobile
- Centered form with maximum width on desktop

## API Integration

### Endpoint: POST /knock

**Request Body**:
```json
{
  "ip_address": "string (optional)",
  "ttl": "number (optional)"
}
```

**Headers**:
- `X-Api-Key`: API token for authentication

**Response (Success - 200)**:
```json
{
  "whitelisted_entry": "string",
  "expires_at": "number",
  "expires_in_seconds": "number"
}
```

**Error Responses**:
- 400: Bad request (invalid parameters)
- 401: Unauthorized (invalid/missing API key)
- 403: Forbidden (insufficient permissions)
- 500: Internal server error

### TTL Cap Warning
When the requested TTL exceeds the token's maximum allowed TTL, the server caps the actual TTL. The response will show a lower `expires_in_seconds` than requested, triggering a warning to the user.

## Session Storage Schema

```typescript
{
  "knocker_endpoint": "string",
  "knocker_token": "string", 
  "knocker_ttl": "number | null",
  "knocker_ip": "string | null"
}
```

## Testing Strategy

### Unit Tests
- Form validation logic
- Session storage helpers
- API client functions

### Integration Tests
- Complete knock flow (success/failure)
- Session persistence and auto-knock
- TTL warning display
- Form input validation

### E2E Tests
- User journey: fill form → submit → see result
- Auto-knock on page reload
- Error handling scenarios
