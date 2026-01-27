# Item Availability Notifications - Test Suite

## Overview

Comprehensive unit tests for the Item Availability Notifications feature, covering:
- Database model constraints and relationships
- Email notification service
- API endpoint validation and error handling
- Edge cases and error scenarios

## Test Files

1. **`item-availability-notifications.test.ts`**
   - Database model tests (unique constraints, cascades)
   - Email service tests (grouping, sending, error handling)
   - Edge cases (missing data, special characters, etc.)

2. **`item-availability-api.test.ts`**
   - API endpoint authentication
   - Request validation
   - Duplicate prevention
   - Error handling

## Setup

Before running tests, ensure:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Regenerate Prisma client** (to include new `ItemAvailabilityNotification` model):
   ```bash
   npx prisma generate
   ```

3. **Set up test database** (if using separate test DB):
   - Ensure `DATABASE_URL` in `.env` points to your test database
   - Run migrations: `npx prisma migrate deploy`

## Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run only notification tests
npm run test:notifications

# Run specific test file
npx vitest run tests/item-availability-notifications.test.ts
```

## Test Coverage

### Database Model Tests
- ✅ Create notification
- ✅ Unique constraint enforcement (userId + productId)
- ✅ Multiple users, same product
- ✅ Same user, multiple products
- ✅ Cascade delete on user deletion

### Email Service Tests
- ✅ Send emails to users with pending notifications
- ✅ Group multiple items per user in single email
- ✅ Handle users without email addresses
- ✅ Handle missing product names (fallback)
- ✅ Skip already notified items
- ✅ Handle email service not configured
- ✅ Handle email sending failures gracefully
- ✅ No emails if no pending notifications

### API Endpoint Tests
- ✅ Create notifications for valid productIds
- ✅ Return 401 for unauthenticated requests
- ✅ Return 400 for empty/invalid productIds
- ✅ Skip duplicates (idempotent)
- ✅ Handle single productId
- ✅ Handle large number of productIds
- ✅ Return 500 on database errors

### Edge Cases
- ✅ Empty productIds array
- ✅ Very long product names
- ✅ Special characters in product names

## Notes

- Tests use **Vitest** as the testing framework
- Tests use **real Prisma client** (not mocked) - ensure test database is set up
- Tests clean up after themselves (delete test data in `afterEach`)
- Email sending is **mocked** using `vi.mock("nodemailer")`
- NextAuth is **mocked** for API endpoint tests

## Troubleshooting

### "Cannot find module 'vitest'"
Run: `npm install`

### "Property 'itemAvailabilityNotification' does not exist"
Run: `npx prisma generate`

### Database connection errors
Ensure `DATABASE_URL` is set correctly in `.env`

### Tests failing due to existing data
Tests should clean up, but if issues persist, manually clean test data:
```sql
DELETE FROM "ItemAvailabilityNotification" WHERE "userId" LIKE 'test-%';
DELETE FROM "User" WHERE "email" LIKE 'test-%@example.com';
DELETE FROM "Product" WHERE "id" LIKE 'test-%';
```
