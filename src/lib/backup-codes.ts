import crypto from "crypto";

/**
 * Generates an array of secure, human-friendly single-use backup recovery codes.
 * Format: 8 codes, each 8 characters split into two 4-character blocks (e.g., "7K9A-4B2D").
 */
export function generateBackupCodes(count: number = 8): string[] {
  const characters = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // excludes ambiguous chars like 0/O, 1/I
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    let part1 = "";
    let part2 = "";

    for (let j = 0; j < 4; j++) {
      part1 += characters[crypto.randomInt(characters.length)];
      part2 += characters[crypto.randomInt(characters.length)];
    }

    codes.push(`${part1}-${part2}`);
  }

  return codes;
}

/**
 * Normalizes a backup code for comparison (case-insensitive, trims hyphens & spaces).
 */
export function normalizeBackupCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
