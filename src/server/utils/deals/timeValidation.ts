/**
 * Server-side time validation for deals
 * Uses Egypt/Cairo timezone for accurate validation
 *
 * All time validation happens on the server to prevent manipulation
 * and ensure consistency between POS and website.
 */

import { formatInTimeZone } from "date-fns-tz";

const TIMEZONE = "Africa/Cairo"; // Egypt timezone

export interface TimeWindow {
  days?: number[]; // 0 = Sunday, 1 = Monday, etc.
  startHour?: number; // 0-23
  startMinute?: number; // 0-59
  endHour?: number; // 0-23
  endMinute?: number; // 0-59
}

/**
 * Check if current time matches the time window
 * @param window Time window configuration
 * @param date Optional date to check (defaults to now)
 * @returns true if the time window is currently active
 */
export function isTimeWindowActive(
  window: TimeWindow,
  date: Date = new Date(),
): boolean {
  try {
    // Get current time in Egypt timezone
    const egyptTime = formatInTimeZone(date, TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    const [dateStr, timeStr] = egyptTime.split(" ");
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hour, minute, second] = timeStr.split(":").map(Number);

    // Create date object in Egypt timezone to get day of week
    const egyptDate = new Date(year, month - 1, day, hour, minute, second);
    const dayOfWeek = egyptDate.getDay();

    // Check day of week restriction
    if (window.days && window.days.length > 0) {
      if (!window.days.includes(dayOfWeek)) {
        return false;
      }
    }

    // Check time window restriction
    if (window.startHour !== undefined && window.endHour !== undefined) {
      const currentMinutes = hour * 60 + minute;
      const startMinutes =
        (window.startHour || 0) * 60 + (window.startMinute || 0);
      let endMinutes = (window.endHour || 0) * 60 + (window.endMinute || 0);

      // Handle midnight wrap-around (e.g., 10 PM - 12 AM)
      if (endMinutes < startMinutes) {
        // End time is next day (e.g., 12 AM = 1440 minutes)
        endMinutes += 24 * 60;
        const currentMinutesAdjusted =
          currentMinutes < startMinutes
            ? currentMinutes + 24 * 60
            : currentMinutes;
        return (
          currentMinutesAdjusted >= startMinutes &&
          currentMinutesAdjusted < endMinutes
        );
      }

      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }

    // No time restriction = always active (if day matches)
    return true;
  } catch (error) {
    console.error("[TimeValidation] Error validating time window:", error);
    return false;
  }
}

/**
 * Deal time windows configuration
 * Maps pricelist names to their time restrictions
 */
export const DEAL_TIME_WINDOWS: Record<string, TimeWindow> = {
  "Monday Morning Deals": {
    days: [1], // Monday
    startHour: 8,
    startMinute: 0,
    endHour: 13,
    endMinute: 0,
  },
  "Happy Hour Deals": {
    days: [0, 1, 2, 3, 4, 5, 6], // All days
    startHour: 15, // 3 PM
    startMinute: 0,
    endHour: 18, // 6 PM
    endMinute: 0,
  },
  "Weekend Specials": {
    days: [6, 0], // Saturday & Sunday
  },
  "Late Night Deals": {
    days: [1, 4], // Monday & Thursday
    startHour: 22, // 10 PM
    startMinute: 0,
    endHour: 0, // 12 AM (midnight) - wraps to next day
    endMinute: 0,
  },
  "Flash Sales": {
    days: [0, 1, 2, 3, 4, 5, 6], // All days
    startHour: 14, // 2 PM (example - can be configurable)
    startMinute: 0,
    endHour: 15, // 3 PM (1 hour window)
    endMinute: 0,
  },
  // Seasonal Promotions - handled by Odoo date_from/date_to
  "Summer Promotions": {
    // Odoo handles date validation
  },
  "Winter Promotions": {
    // Odoo handles date validation
  },
  "Spring Promotions": {
    // Odoo handles date validation
  },
  "Fall Promotions": {
    // Odoo handles date validation
  },
  // Holiday Specials - handled by Odoo date_from/date_to
  "Holiday Specials Christmas Specials": {
    // Odoo handles date validation
  },
  "Holiday Specials New Year Specials": {
    // Odoo handles date validation
  },
  // New Product Launch - handled by product creation date
  "New Product Launch": {
    // Always active (products auto-removed after 7 days)
  },
  // Elite Yearly University Event - handled by Odoo date_from/date_to
  "Elite Yearly University Event": {
    // Odoo handles date validation (June 1st annually)
  },
};

/**
 * Check if a deal is currently active based on its pricelist name
 * @param pricelistName Name of the pricelist
 * @param date Optional date to check (defaults to now)
 * @returns true if the deal is currently active
 */
export function isDealActive(
  pricelistName: string,
  date: Date = new Date(),
): boolean {
  const timeWindow = DEAL_TIME_WINDOWS[pricelistName];

  // If no time window configured, deal is always active
  if (!timeWindow) {
    return true;
  }

  return isTimeWindowActive(timeWindow, date);
}

/**
 * Get human-readable description of a deal's time window
 * @param pricelistName Name of the pricelist
 * @returns Human-readable time window description
 */
export function getDealTimeWindowDescription(pricelistName: string): string {
  const window = DEAL_TIME_WINDOWS[pricelistName];

  if (!window) {
    return "Always available";
  }

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  let description = "";

  // Day description
  if (window.days && window.days.length > 0) {
    if (window.days.length === 7) {
      description = "Every day";
    } else if (
      window.days.length === 2 &&
      window.days.includes(6) &&
      window.days.includes(0)
    ) {
      description = "Weekends";
    } else if (
      window.days.length === 5 &&
      !window.days.includes(6) &&
      !window.days.includes(0)
    ) {
      description = "Weekdays";
    } else {
      description = window.days.map((d) => dayNames[d]).join(" & ");
    }
  }

  // Time description
  if (window.startHour !== undefined && window.endHour !== undefined) {
    const formatTime = (hour: number, minute: number) => {
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
    };

    const startTime = formatTime(window.startHour, window.startMinute || 0);
    const endTime = formatTime(window.endHour, window.endMinute || 0);

    if (description) {
      description += ` from ${startTime} to ${endTime}`;
    } else {
      description = `${startTime} to ${endTime}`;
    }
  }

  return description || "Always available";
}
