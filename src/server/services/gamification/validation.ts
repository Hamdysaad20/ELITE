/**
 * Validation utilities for gamification services
 */

/**
 * Validate user ID format (UUID)
 */
export function isValidUserId(userId: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(userId);
}

/**
 * Validate achievement code format
 */
export function isValidAchievementCode(code: string): boolean {
  // Alphanumeric, underscore, hyphen, 3-50 chars
  const codeRegex = /^[a-z0-9_-]{3,50}$/i;
  return codeRegex.test(code);
}

/**
 * Validate badge code format
 */
export function isValidBadgeCode(code: string): boolean {
  // Same as achievement code
  return isValidAchievementCode(code);
}

/**
 * Validate points amount
 */
export function isValidPointsAmount(points: number): boolean {
  return Number.isInteger(points) && points > 0 && points <= 1000000; // Max 1M points
}

/**
 * Validate increment amount
 */
export function isValidIncrement(increment: number): boolean {
  return Number.isInteger(increment) && increment > 0 && increment <= 1000; // Max 1000 per increment
}

/**
 * Validate streak type
 */
export function isValidStreakType(streakType: string): boolean {
  const validTypes = ["deal_purchase", "daily_checkin", "combo_purchase"];
  return validTypes.includes(streakType) || streakType.length <= 50;
}

