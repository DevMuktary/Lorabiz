/**
 * Normalizes Nigerian and international phone numbers to E.164 format without the '+' symbol
 * Required by Meta WhatsApp Cloud API (e.g., "08012345678" -> "2348012345678")
 */
export function formatWhatsAppPhone(phone: string, defaultCountryCode = "234"): string {
  if (!phone) return "";

  // 1. Remove all non-numeric characters (spaces, dashes, plus signs, brackets)
  let cleaned = phone.replace(/\D/g, "");

  // 2. If it starts with '0' (e.g., 08012345678), replace '0' with the country code
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = defaultCountryCode + cleaned.slice(1);
  }

  // 3. If it already starts with '234' and is 13 digits, keep it
  // 4. If someone entered a 10-digit number without leading zero (e.g., 8012345678), prepend country code
  if (cleaned.length === 10 && !cleaned.startsWith(defaultCountryCode)) {
    cleaned = defaultCountryCode + cleaned;
  }

  return cleaned;
}
