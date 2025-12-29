# Comprehensive Validation Points Reference

This document lists all validation points implemented in the address validation system.

## 📋 Table of Contents

1. [Length Validations](#length-validations)
2. [Pattern Validations](#pattern-validations)
3. [Security Validations](#security-validations)
4. [Format Validations](#format-validations)
5. [Business Logic Validations](#business-logic-validations)
6. [Country-Specific Validations](#country-specific-validations)
7. [Data Type Validations](#data-type-validations)
8. [Completeness Validations](#completeness-validations)

---

## 1. Length Validations

### Minimum Lengths
- **Label**: 1 character
- **Street**: 3 characters
- **Apartment**: 1 character (if provided)
- **City**: 2 characters
- **State**: 2 characters (if provided)
- **Zip Code**: 3 characters (if provided)
- **Phone**: 8 digits (if provided)
- **Notes**: 1 character (if provided)

### Maximum Lengths
- **Label**: 20 characters
- **Street**: 200 characters
- **Apartment**: 50 characters
- **City**: 100 characters
- **State**: 100 characters
- **Zip Code**: 20 characters
- **Phone**: 20 characters
- **Notes**: 500 characters

**Validation Point**: Ensures data fits database constraints and prevents buffer overflow attacks.

---

## 2. Pattern Validations

### Street Address
- **Pattern**: `/^[A-Za-z0-9\s\-\'\.\,\#\/]+$/`
- **Allows**: Letters, numbers, spaces, hyphens, apostrophes, periods, commas, hash, forward slash
- **Requires**: At least one letter (not just numbers)
- **Purpose**: Valid street addresses with building numbers and names

### City Name
- **Pattern**: `/^[A-Za-z\s\-\'\.]+$/`
- **Allows**: Letters, spaces, hyphens, apostrophes, periods
- **Blocks**: Numbers and special characters
- **Purpose**: City names should be text-only

### State/Province
- **Pattern**: `/^[A-Za-z\s\-\'\.]+$/`
- **Allows**: Letters, spaces, hyphens, apostrophes, periods
- **Purpose**: State names should be text-only

### Apartment/Unit
- **Pattern**: `/^[A-Za-z0-9\s\-\#\/]+$/`
- **Allows**: Letters, numbers, spaces, hyphens, hash, forward slash
- **Purpose**: Apartment numbers and unit identifiers

### Phone Number (International)
- **Pattern**: `/^[\+]?[1-9][\d\s\-\(\)]{7,19}$/`
- **Format**: Optional `+`, country code starting with 1-9, 7-19 digits with spaces/dashes/parentheses
- **Examples**: 
  - ✅ `+20 123 456 7890`
  - ✅ `01234567890`
  - ✅ `+1 (555) 123-4567`
  - ❌ `abc123` (contains letters)
  - ❌ `123` (too short)

### Phone Number (Egyptian)
- **Pattern**: `/^(\+20|0)?1[0-9]{9}$/`
- **Format**: Optional `+20` or `0`, followed by `1` and 9 more digits
- **Examples**:
  - ✅ `+20 123 456 7890`
  - ✅ `01234567890`
  - ✅ `11234567890`
  - ❌ `0123456789` (doesn't start with 1 after country code)

### Zip/Postal Code (International)
- **Pattern**: `/^[A-Za-z0-9\s\-]{3,20}$/`
- **Allows**: Alphanumeric, spaces, hyphens
- **Length**: 3-20 characters
- **Examples**:
  - ✅ `12345`
  - ✅ `SW1A 1AA` (UK format)
  - ✅ `K1A-0B1` (Canadian format)
  - ❌ `12` (too short)
  - ❌ `@#$` (invalid characters)

### Zip/Postal Code (Egyptian)
- **Pattern**: `/^\d{5}$/`
- **Format**: Exactly 5 digits
- **Examples**:
  - ✅ `12345`
  - ✅ `00000`
  - ❌ `1234` (too short)
  - ❌ `123456` (too long)
  - ❌ `ABC12` (contains letters)

**Validation Point**: Ensures data matches expected formats and prevents invalid characters.

---

## 3. Security Validations

### XSS (Cross-Site Scripting) Prevention
- **Pattern**: `/<script|javascript:|onerror=|onload=|eval\(|expression\(/i`
- **Blocks**: Script tags, JavaScript protocol, event handlers, eval functions
- **Purpose**: Prevents injection of malicious scripts

### SQL Injection Prevention
- **Pattern**: `/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/i`
- **Blocks**: SQL keywords and commands
- **Purpose**: Prevents SQL injection attacks

### Input Sanitization
- **Removes**: Leading/trailing whitespace
- **Normalizes**: Multiple spaces to single space
- **Removes**: Null bytes and control characters
- **Purpose**: Cleans input before processing

**Validation Point**: Protects against common web security vulnerabilities.

---

## 4. Format Validations

### Address Label
- **Enum**: `["Home", "Work", "Office", "Other"]`
- **Type**: Must be one of the predefined values
- **Purpose**: Standardizes address categorization

### Country
- **Allowed**: `["Egypt", "EG", "EGY"]`
- **Default**: `"Egypt"`
- **Case-insensitive**: Matching
- **Purpose**: Validates supported countries

### Boolean Fields
- **isDefault**: Must be `true` or `false`
- **Default**: `false`
- **Purpose**: Type safety for boolean operations

**Validation Point**: Ensures data conforms to expected formats and types.

---

## 5. Business Logic Validations

### Address Completeness
- **Required Fields**: Street, City
- **Additional Fields**: At least one of:
  - Apartment
  - State
  - Zip Code
  - Phone
- **Purpose**: Ensures address has minimum information for delivery

### Duplicate Address Prevention
- **Comparison**: Case-insensitive
- **Fields Compared**: Street, City, Apartment
- **Scope**: Per user
- **Purpose**: Prevents duplicate addresses in address book

### Default Address Management
- **Single Default**: Only one address can be default per user
- **Auto-assignment**: First address becomes default automatically
- **Purpose**: Ensures consistent default address handling

**Validation Point**: Enforces business rules and data integrity.

---

## 6. Country-Specific Validations

### Egypt-Specific Rules

#### Phone Number
- **Format**: `+20` or `0` prefix, followed by `1` and 9 digits
- **Total Length**: 11-13 characters (with country code)
- **Examples**:
  - ✅ `+20 123 456 7890`
  - ✅ `01234567890`
  - ❌ `+20 234 567 8901` (doesn't start with 1)

#### Postal Code
- **Format**: Exactly 5 digits
- **Examples**:
  - ✅ `12345`
  - ❌ `1234` (too short)
  - ❌ `123456` (too long)

**Validation Point**: Adapts validation rules based on country context.

---

## 7. Data Type Validations

### String Types
- **Required**: All string fields must be strings
- **Trimming**: Automatic whitespace removal
- **Null Handling**: Optional fields can be `null` or empty string
- **Transformation**: Input sanitization applied

### Boolean Types
- **isDefault**: Must be boolean, defaults to `false`
- **Type Safety**: Prevents string/number coercion

### Enum Types
- **label**: Must match predefined enum values
- **Type Safety**: Compile-time type checking

**Validation Point**: Ensures correct data types prevent runtime errors.

---

## 8. Completeness Validations

### Address Completeness Score
Calculates a score (0-100) based on filled fields:

- **Required Fields** (40 points):
  - Street: 20 points
  - City: 20 points

- **Optional Fields** (60 points):
  - Apartment: 10 points
  - State: 10 points
  - Zip Code: 15 points
  - Phone: 15 points
  - Country: 10 points

### Completeness Levels
- **Complete** (90-100): All important fields filled
- **Good** (70-89): Most fields filled
- **Fair** (50-69): Basic fields filled
- **Poor** (<50): Missing critical information

**Validation Point**: Helps identify incomplete addresses and guide users.

---

## Validation Flow

```
Input → Sanitization → Type Check → Length Check → Pattern Check → Security Check → Business Logic → Database
```

### Step-by-Step Process

1. **Input Sanitization**
   - Trim whitespace
   - Normalize spaces
   - Remove control characters

2. **Type Validation**
   - Ensure correct data types
   - Handle null/undefined
   - Apply defaults

3. **Length Validation**
   - Check minimum lengths
   - Check maximum lengths
   - Prevent buffer overflows

4. **Pattern Validation**
   - Regex pattern matching
   - Format verification
   - Character restrictions

5. **Security Validation**
   - XSS prevention
   - SQL injection prevention
   - Malicious content detection

6. **Business Logic Validation**
   - Completeness checks
   - Duplicate detection
   - Default address rules

7. **Country-Specific Validation**
   - Phone format by country
   - Postal code format by country
   - Regional rules

---

## Usage Examples

### Frontend Validation
```typescript
import { validateAddressField } from "@/lib/validators/addressValidator";

const result = validateAddressField("phone", "+20 123 456 7890");
if (!result.isValid) {
  console.error(result.message);
}
```

### Backend Validation
```typescript
import { createAddressSchema } from "@/server/validators/addressSchemas";

const result = createAddressSchema.safeParse(requestBody);
if (!result.success) {
  return { errors: result.error.errors };
}
```

### Security Validation
```typescript
import { validateInputSecurity } from "@/lib/validators/validationUtils";

const result = validateInputSecurity(userInput, "street");
if (!result.isValid) {
  console.error(result.errors);
}
```

### Completeness Check
```typescript
import { calculateAddressCompleteness } from "@/lib/validators/validationUtils";

const score = calculateAddressCompleteness(address);
const level = getAddressCompletenessLevel(score);
```

---

## Error Messages

All validation errors provide clear, user-friendly messages:

- **Length Errors**: "Field must be at least X characters" / "Field must be less than X characters"
- **Pattern Errors**: "Please enter a valid [field] (e.g., [example])"
- **Security Errors**: "Field contains invalid characters"
- **Business Logic Errors**: "This address already exists in your address book"
- **Completeness Errors**: "Address must include street, city, and at least one additional field"

---

## Testing Checklist

When adding new validation points, test:

- [ ] Minimum length validation
- [ ] Maximum length validation
- [ ] Pattern matching
- [ ] Security checks (XSS, SQL injection)
- [ ] Country-specific rules
- [ ] Type coercion
- [ ] Null/undefined handling
- [ ] Empty string handling
- [ ] Whitespace handling
- [ ] Special character handling
- [ ] Unicode character handling
- [ ] Edge cases (boundary values)

---

## Future Enhancements

1. **International Address Formats**: Support for more countries
2. **Address Autocomplete**: Integration with address validation APIs
3. **Geocoding Validation**: Verify addresses against maps
4. **Real-time Validation**: API-based validation during input
5. **Custom Validation Rules**: User-configurable validation
6. **Validation History**: Track validation failures for analytics
7. **Multi-language Support**: Localized error messages
8. **Address Normalization**: Standardize address formats

