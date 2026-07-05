import crypto from "crypto";

/**
 * Generates a completely randomized, purely numeric tracking ID.
 * Defaults to 6 digits (e.g., "849201"), but supports 7 or 8 digits.
 * * @param length - The number of digits required (recommended: 6 to 8)
 * @returns A randomized numeric string
 */
export function generateNumericId(length: 6 | 7 | 8 = 6): string {
  switch (length) {
    case 6:
      // Generates a number between 100000 and 999999
      return crypto.randomInt(100000, 999999).toString();
    case 7:
      // Generates a number between 1000000 and 9999999
      return crypto.randomInt(1000000, 9999999).toString();
    case 8:
      // Generates a number between 10000000 and 99999999
      return crypto.randomInt(10000000, 99999999).toString();
    default:
      return crypto.randomInt(100000, 999999).toString();
  }
}

/**
 * Generates a formatted 8-digit numeric ID split with a hyphen for easier readability.
 * Example output: "3819-4028"
 */
export function generateSplitNumericId(): string {
  const part1 = crypto.randomInt(1000, 9999).toString();
  const part2 = crypto.randomInt(1000, 9999).toString();
  return `${part1}-${part2}`;
}
