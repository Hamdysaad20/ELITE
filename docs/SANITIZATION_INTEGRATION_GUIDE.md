# Input Sanitization Integration Guide

## Overview

The `src/lib/sanitization.ts` module provides comprehensive input sanitization utilities to prevent XSS and injection attacks. This guide shows how to integrate these utilities into your API routes.

## Quick Start

```typescript
import { sanitizeInput, sanitizeObject, sanitizeEmail } from '@/lib/sanitization';
```

## Integration Examples

### 1. Review API Route

**File:** `src/app/api/reviews/route.ts`

```typescript
import { sanitizeInput } from '@/lib/sanitization';

export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  const raw = await parseRequestBody(request);
  const body = CreateReviewSchema.parse(raw);

  // Sanitize user inputs before storing
  const review = await prisma.review.create({
    data: {
      userId: user.id,
      productId: body.productId,
      productName: sanitizeInput(body.productName), // Sanitize product name
      rating: body.rating,
      comment: body.comment ? sanitizeInput(body.comment) : null, // Sanitize comment
      status: 'pending',
    },
  });

  return jsonResponse(successResponse(review));
}
```

### 2. Address API Route

**File:** `src/app/api/addresses/route.ts`

```typescript
import { sanitizeObject } from '@/lib/sanitization';

export async function POST(req: NextRequest) {
  const session = await getServerSession(getAuthOptions());
  const body = await req.json();
  
  // Validate with Zod
  const validationResult = createAddressSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
  }

  // Sanitize all string fields in the address
  const sanitizedData = sanitizeObject(validationResult.data);

  const address = await prisma.address.create({
    data: {
      userId: session.user.id,
      ...sanitizedData,
    },
  });

  return NextResponse.json({ success: true, address });
}
```

### 3. Profile Update API Route

**File:** `src/app/api/auth/profile/route.ts`

```typescript
import { sanitizeInput, sanitizePhone } from '@/lib/sanitization';

export async function PATCH(request: NextRequest) {
  const user = await requireAuth(request);
  const body = await request.json();

  const validation = UpdateProfileSchema.safeParse(body);
  if (!validation.success) {
    return jsonResponse(errorResponse('Invalid input'), 400);
  }

  const { name, phone } = validation.data;

  // Sanitize inputs before updating
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(name !== undefined && { name: sanitizeInput(name) }),
      ...(phone !== undefined && { phone: sanitizePhone(phone) }),
      updatedAt: new Date(),
    },
  });

  return jsonResponse(successResponse(updatedUser));
}
```

### 4. Search API Route

**File:** `src/app/api/products/search/route.ts`

```typescript
import { sanitizeSearchQuery } from '@/lib/sanitization';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawQuery = searchParams.get('q') || '';
  
  // Sanitize search query to prevent regex injection
  const query = sanitizeSearchQuery(rawQuery);

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
  });

  return NextResponse.json({ products });
}
```

## Available Sanitization Functions

### Core Functions

- **`sanitizeInput(input: string)`** - Remove HTML tags and dangerous characters
- **`sanitizeObject(obj: object)`** - Recursively sanitize all string values
- **`sanitizeHTML(html: string, allowedTags?: string[])`** - Preserve safe HTML tags

### Specialized Functions

- **`sanitizeEmail(email: string)`** - Validate and sanitize email addresses
- **`sanitizePhone(phone: string)`** - Clean phone numbers (keeps only digits and + at start)
- **`sanitizeURL(url: string, allowedProtocols?: string[])`** - Validate and sanitize URLs
- **`sanitizePath(path: string)`** - Prevent path traversal attacks
- **`sanitizeSearchQuery(query: string)`** - Escape regex special characters
- **`sanitizeNumber(input: any, min?: number, max?: number)`** - Validate and clamp numbers
- **`sanitizeBoolean(input: any)`** - Convert to boolean safely
- **`sanitizeArray(arr: string[])`** - Sanitize array of strings
- **`sanitizeJSON(input: string)`** - Parse and sanitize JSON

### Advanced Functions

- **`sanitizeRequestBody(body: object)`** - Sanitize entire request body
- **`sanitizeWithSchema(data: any, schema: object)`** - Schema-based sanitization

## Best Practices

### 1. Always Sanitize User Input

```typescript
// ❌ BAD - Direct storage without sanitization
await prisma.user.update({
  data: { name: body.name }
});

// ✅ GOOD - Sanitize before storage
await prisma.user.update({
  data: { name: sanitizeInput(body.name) }
});
```

### 2. Combine with Validation

```typescript
// First validate with Zod
const validation = schema.safeParse(body);
if (!validation.success) {
  return error response;
}

// Then sanitize validated data
const sanitized = sanitizeObject(validation.data);

// Finally store
await prisma.model.create({ data: sanitized });
```

### 3. Use Specialized Functions

```typescript
// ❌ BAD - Generic sanitization for specific types
const email = sanitizeInput(body.email);

// ✅ GOOD - Use specialized function
const email = sanitizeEmail(body.email);
if (!email) {
  return error('Invalid email');
}
```

### 4. Sanitize Display Data

```typescript
// Sanitize when displaying user-generated content
<div dangerouslySetInnerHTML={{ 
  __html: sanitizeHTML(userComment, ['b', 'i', 'em', 'strong']) 
}} />
```

## Migration Checklist

- [ ] Review API - Sanitize review comments and product names
- [ ] Address API - Sanitize address fields
- [ ] Profile API - Sanitize name and phone
- [ ] Order API - Sanitize order notes
- [ ] Search API - Sanitize search queries
- [ ] Any other user input endpoints

## Security Notes

1. **XSS Prevention**: All HTML tags are removed by default
2. **SQL Injection**: Use Prisma's parameterized queries (already implemented)
3. **Path Traversal**: Use `sanitizePath()` for file operations
4. **Regex Injection**: Use `sanitizeSearchQuery()` for search functionality

## Testing

```typescript
import { sanitizeInput, sanitizePhone } from '@/lib/sanitization';

// Test XSS prevention
expect(sanitizeInput('<script>alert("xss")</script>Hello')).toBe('Hello');

// Test phone sanitization
expect(sanitizePhone('+20 123-456-7890')).toBe('+201234567890');
expect(sanitizePhone('++123++456')).toBe('+123456');
```

## Related Documentation

- [Security Best Practices](./SECURITY_VALIDATION_REENABLED.md)
- [API Design Guidelines](./API_CONTRACT_V1.md)
- [Input Validation](./VALIDATION_POINTS.md)