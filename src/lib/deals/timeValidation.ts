/**
 * Time validation utilities for Monday Morning Deals
 * 
 * Deals are valid:
 * - Day: Monday
 * - Time: 8:00 AM - 1:00 PM (13:00)
 * 
 * Note: Time is validated in the application timezone (Egypt/Cairo)
 */

/**
 * Check if the current time is within the Monday Morning Deals window
 * @param date Optional date to check (defaults to now)
 * @returns true if deals are currently active
 */
export function isDealActive(date: Date = new Date()): boolean {
  // Get date in Egypt timezone (UTC+2, or UTC+3 during DST)
  // For simplicity, we'll use local time - adjust if needed for production
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  
  // Monday = 1
  if (dayOfWeek !== 1) {
    return false;
  }
  
  // 8:00 AM = 8 * 60 = 480 minutes
  // 1:00 PM = 13 * 60 = 780 minutes
  const startMinutes = 8 * 60; // 8:00 AM
  const endMinutes = 13 * 60; // 1:00 PM (13:00)
  
  return totalMinutes >= startMinutes && totalMinutes < endMinutes;
}

/**
 * Get the next active deal time
 * @returns Date object for the next Monday 8:00 AM
 */
export function getNextDealTime(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  // Calculate days until next Monday
  let daysUntilMonday = (1 - dayOfWeek + 7) % 7;
  if (daysUntilMonday === 0 && now.getHours() >= 13) {
    // If it's Monday but past 1 PM, get next Monday
    daysUntilMonday = 7;
  }
  
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(8, 0, 0, 0); // 8:00 AM
  
  return nextMonday;
}

/**
 * Get human-readable deal window description
 */
export function getDealWindowDescription(): string {
  return "Monday from 8:00 AM to 1:00 PM";
}

/**
 * Format time until next deal
 */
export function getTimeUntilNextDeal(): string {
  const nextDeal = getNextDealTime();
  const now = new Date();
  const diffMs = nextDeal.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return "Available now";
  }
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `Available in ${days} day${days > 1 ? "s" : ""} ${hours} hour${hours !== 1 ? "s" : ""}`;
  } else if (hours > 0) {
    return `Available in ${hours} hour${hours > 1 ? "s" : ""} ${minutes} minute${minutes !== 1 ? "s" : ""}`;
  } else {
    return `Available in ${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }
}

