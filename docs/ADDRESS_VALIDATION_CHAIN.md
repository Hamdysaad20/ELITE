# Address Validation Chain

This document describes the comprehensive validation chain implemented for address forms, ensuring data integrity on both frontend (FE) and backend (BE).

## Overview

We use a **shared validation schema** approach where:
1. **Single Source of Truth**: Validation rules are defined once in `src/server/validators/addressSchemas.ts`
2. **Frontend Validation**: Uses the same rules via `src/lib/validators/addressValidator.ts`
3. **Backend Validation**: Uses Zod schema validation in API routes
4. **Type Safety**: TypeScript types are inferred from the schema

## Architecture

```
┌─────────────────────────────────────────┐
│  addressSchemas.ts (Shared Schema)     │
│  - ADDRESS_VALIDATION constants         │
│  - addressSchema (Zod)                  │
│  - createAddressSchema                  │
│  - updateAddressSchema                  │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌──────────────┐  ┌──────────────┐
│   Frontend   │  │   Backend    │
│  Validator   │  │  API Routes  │
│              │  │              │
│ - Real-time  │  │ - Zod.parse  │
│ - Field-level│  │ - Type check │
│ - Form-level │  │ - Error resp │
└──────────────┘  ┌──────────────┘
```

## Validation Rules

### Field Constraints

| Field | Required | Max Length | Pattern | Notes |
|-------|----------|------------|---------|-------|
| `label` | ✅ | 20 | Enum: Home/Work/Office/Other | - |
| `street` | ✅ | 200 | - | Required field |
| `apartment` | ❌ | 50 | - | Optional |
| `city` | ✅ | 100 | `^[A-Za-z\s\-\']+$` | No numbers allowed |
| `state` | ❌ | 100 | - | Optional |
| `zipCode` | ❌ | 20 | `^[A-Za-z0-9\s\-]{3,20}$` | Alphanumeric, 3-20 chars |
| `phone` | ❌ | 20 | `^[\+]?[1-9][\d\s\-\(\)]{7,19}$` | International format |
| `notes` | ❌ | 500 | - | Optional |
| `country` | ❌ | - | - | Defaults to "Egypt" |

### Validation Patterns

#### Phone Number
- **Pattern**: `/^[\+]?[1-9][\d\s\-\(\)]{7,19}$/`
- **Examples**: 
  - ✅ `+20 123 456 7890`
  - ✅ `01234567890`
  - ❌ `abc123` (contains letters)
  - ❌ `123` (too short)

#### Zip/Postal Code
- **Pattern**: `/^[A-Za-z0-9\s\-]{3,20}$/`
- **Examples**:
  - ✅ `12345`
  - ✅ `SW1A 1AA` (UK format)
  - ❌ `12` (too short)
  - ❌ `@#$` (invalid characters)

#### City
- **Pattern**: `/^[A-Za-z\s\-\']+$/`
- **Examples**:
  - ✅ `Cairo`
  - ✅ `New York`
  - ✅ `Saint-Denis`
  - ❌ `Cairo123` (contains numbers)
  - ❌ `Cairo@` (invalid characters)

## Implementation

### 1. Shared Schema (`src/server/validators/addressSchemas.ts`)

```typescript
export const ADDRESS_VALIDATION = {
  STREET_MAX_LENGTH: 200,
  CITY_MAX_LENGTH: 100,
  PHONE_REGEX: /^[\+]?[1-9][\d\s\-\(\)]{7,19}$/,
  // ... other constants
} as const;

export const addressSchema = z.object({
  street: z.string().min(1).max(200).trim(),
  city: z.string().min(1).max(100).regex(CITY_REGEX).trim(),
  // ... other fields
});
```

### 2. Frontend Validator (`src/lib/validators/addressValidator.ts`)

```typescript
export function validateAddress(data: Partial<Address>): {
  isValid: boolean;
  errors: ValidationError[];
} {
  const result = addressSchema.safeParse(addressData);
  // Returns validation result
}

export function validateAddressField(
  field: string,
  value: string | null | undefined
): { isValid: boolean; message?: string } {
  // Field-level validation using same rules
}
```

### 3. Backend API (`src/app/api/addresses/route.ts`)

```typescript
const validationResult = createAddressSchema.safeParse(body);
if (!validationResult.success) {
  return NextResponse.json({
    success: false,
    error: "Validation failed",
    errors: validationResult.error.errors,
  }, { status: 400 });
}
```

### 4. Frontend Component (`src/components/AddressManager.tsx`)

```typescript
// Real-time validation
const validateField = (name: string, value: string) => {
  const validation = validateAddressField(name, value);
  // Update error state
};

// Form submission validation
const handleSubmit = async (e: React.FormEvent) => {
  const validation = validateAddress(formData);
  if (!validation.isValid) {
    // Show errors, prevent submission
    return;
  }
  // Submit to API
};
```

## Validation Flow

### Frontend Flow

1. **User Input** → Field onChange handler
2. **Real-time Validation** → `validateAddressField()` called
3. **Error Display** → Red border + error message if invalid
4. **Form Submit** → `validateAddress()` called (full form validation)
5. **API Call** → Only if validation passes

### Backend Flow

1. **Request Received** → API route handler
2. **Zod Validation** → `createAddressSchema.safeParse()`
3. **Type Checking** → Zod ensures correct types
4. **Error Response** → Returns structured errors if invalid
5. **Duplicate Check** → Additional business logic validation
6. **Database Save** → Only if all validations pass

## Benefits

### 1. **Type Safety**
- TypeScript types inferred from Zod schema
- Compile-time type checking
- No type mismatches between FE and BE

### 2. **Consistency**
- Same validation rules on FE and BE
- Same error messages
- No discrepancies

### 3. **Security**
- Backend validation prevents malicious data
- Frontend validation improves UX
- Defense in depth approach

### 4. **Maintainability**
- Single source of truth for validation rules
- Easy to update rules in one place
- Changes propagate automatically

### 5. **User Experience**
- Real-time feedback
- Clear error messages
- Prevents invalid submissions

## Error Handling

### Frontend Errors
- **Field-level**: Shown inline below each field
- **Form-level**: Shown before submission
- **Visual**: Red border + error text

### Backend Errors
- **Status Code**: 400 Bad Request
- **Response Format**:
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    {
      "field": "city",
      "message": "City name cannot contain numbers or special characters"
    }
  ]
}
```

## Testing Recommendations

1. **Frontend Tests**
   - Test each validation rule
   - Test real-time validation
   - Test form submission validation

2. **Backend Tests**
   - Test Zod schema validation
   - Test type coercion
   - Test error responses

3. **Integration Tests**
   - Test FE → BE validation chain
   - Test error message consistency
   - Test duplicate address prevention

## Future Enhancements

1. **Internationalization**: Support multiple countries' address formats
2. **Address Autocomplete**: Integration with address validation APIs
3. **Postal Code Validation**: Country-specific postal code validation
4. **Phone Number Formatting**: Auto-format based on country code

