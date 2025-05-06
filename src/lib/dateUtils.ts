import { format, formatDistanceToNow, parseISO, differenceInDays } from 'date-fns';

/**
 * Converts a UTC timestamp to local time
 * @param utcTimestamp - ISO 8601 timestamp string
 * @returns Date object in local time
 */
export function convertUTCToLocal(utcTimestamp: string): Date {
  try {
    // Create a date object from the UTC timestamp
    const date = new Date(utcTimestamp);
    
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${utcTimestamp}`);
    }
    
    // Get the timezone offset in minutes
    const timezoneOffset = date.getTimezoneOffset();
    
    // Convert to local time by adding the timezone offset
    // Note: getTimezoneOffset returns minutes west of UTC, so we subtract to convert to local
    const localDate = new Date(date.getTime() - timezoneOffset * 60000);
    
    return localDate;
  } catch (error) {
    console.error('Error converting UTC to local:', error);
    return new Date(); // Return current date as fallback
  }
}

/**
 * Formats a UTC timestamp to the local timezone with both date and time
 * @param timestamp - ISO 8601 timestamp string
 * @returns Formatted date and time string in local timezone
 */
export function formatLocalDateTime(timestamp: string): string {
  try {
    // Convert UTC to local time
    const localDate = convertUTCToLocal(timestamp);
    
    // Format: "Jan 31, 2025, 10:41 AM" in local timezone
    return format(localDate, 'MMM d, yyyy, h:mm a');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Formats a UTC timestamp to a relative time string (e.g., "2 hours ago")
 * @param timestamp - ISO 8601 timestamp string
 * @returns Relative time string
 */
export function formatRelativeTime(timestamp: string): string {
  try {
    // Convert UTC to local time
    const localDate = convertUTCToLocal(timestamp);
    
    // Compare with current time
    const now = new Date();
    const diff = now.getTime() - localDate.getTime();
    
    // Format based on time difference
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) {
      return 'just now';
    } else if (minutes === 1) {
      return '1 minute ago';
    } else if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else if (hours === 1) {
      return '1 hour ago';
    } else if (hours < 24) {
      return `${hours} hours ago`;
    } else if (days === 1) {
      return 'yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return formatLocalDateTime(timestamp);
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid date';
  }
}

/**
 * Calculates the number of days since a given timestamp
 * @param timestamp - ISO 8601 timestamp string
 * @returns Number of days since the timestamp
 */
export function getDaysSinceTimestamp(timestamp: string): number {
  try {
    const localDate = convertUTCToLocal(timestamp);
    if (isNaN(localDate.getTime())) {
      return 0;
    }
    return differenceInDays(new Date(), localDate);
  } catch (error) {
    console.error('Error calculating days since timestamp:', error);
    return 0;
  }
}

/**
 * Format a date string to a format suitable for datetime-local input
 * @param timestamp - ISO 8601 timestamp string
 * @returns Formatted date string in YYYY-MM-DDThh:mm format
 */
export function formatDateForInput(timestamp: string): string {
  try {
    const localDate = convertUTCToLocal(timestamp);
    if (isNaN(localDate.getTime())) {
      return '';
    }
    
    // Format to local date-time string without seconds
    // Format: YYYY-MM-DDThh:mm (HTML datetime-local input format)
    return format(localDate, "yyyy-MM-dd'T'HH:mm");
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
}

/**
 * Convert local date-time to UTC ISO string
 * @param localDateString - Local date string in YYYY-MM-DDThh:mm format
 * @returns UTC ISO string
 */
export function convertToUTC(localDateString: string): string {
  try {
    // Parse the local date string to a Date object
    const localDate = new Date(localDateString);
    
    if (isNaN(localDate.getTime())) {
      throw new Error('Invalid date');
    }
    
    // Convert to UTC ISO string
    return localDate.toISOString();
  } catch (error) {
    console.error('Error converting to UTC:', error);
    return new Date().toISOString();
  }
}

/**
 * Returns the day part of a timestamp in local timezone (YYYY-MM-DD)
 * @param timestamp - ISO 8601 timestamp string
 * @returns Day string in YYYY-MM-DD format
 */
export function getLocalDay(timestamp: string): string {
  try {
    const localDate = convertUTCToLocal(timestamp);
    if (isNaN(localDate.getTime())) {
      return '';
    }
    return format(localDate, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error getting local day:', error);
    return '';
  }
}

/**
 * Get formatted date for display (e.g., "Monday, January 15, 2024")
 * @param dayString - String in YYYY-MM-DD format
 * @returns Formatted date string
 */
export function formatDay(dayString: string): string {
  try {
    const date = new Date(dayString);
    if (isNaN(date.getTime())) {
      return dayString;
    }
    return format(date, 'EEEE, MMMM d, yyyy');
  } catch (error) {
    console.error('Error formatting day:', error);
    return dayString;
  }
}

/**
 * Debug function to show timezone offset
 * @param timestamp - ISO 8601 timestamp string
 * @returns Formatted string with timezone information
 */
export function getTimezoneInfo(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const offset = date.getTimezoneOffset();
    const offsetHours = Math.abs(Math.floor(offset / 60));
    const offsetMinutes = Math.abs(offset % 60);
    const offsetSign = offset > 0 ? '-' : '+';
    
    return `UTC${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;
  } catch (error) {
    return 'Invalid timezone';
  }
}

/**
 * Get the browser's timezone information as a formatted string
 * @returns Formatted string with browser timezone information
 */
export function getBrowserTimezoneInfo(): string {
  const offset = new Date().getTimezoneOffset();
  const offsetHours = Math.abs(Math.floor(offset / 60));
  const offsetMinutes = Math.abs(offset % 60);
  const offsetSign = offset > 0 ? '-' : '+';
  const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
  
  return `${timezoneName} (UTC${offsetSign}${offsetHours}:${offsetMinutes.toString().padStart(2, '0')})`;
}