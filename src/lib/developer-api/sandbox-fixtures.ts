/**
 * Deterministic sandbox mock datasets for Developer B2B testing
 * All photo and slip outputs use raw Base64 strings matching live provider formats.
 */

export interface MockNinData {
  nin: string;
  vnin?: string;
  firstname: string;
  surname: string;
  middlename?: string;
  birthdate: string;
  gender: string;
  telephoneno: string;
  residence_state: string;
  residence_lga: string;
  residence_address: string;
  photo_base64: string;
  trackingId?: string;
}

// Sample 1x1 PNG base64 placeholder for sandbox mock portraits
const SAMPLE_PHOTO_BASE64 = "/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
const SAMPLE_PDF_BASE64 = "JVBERi0xLjQKJcTl8uXrCgoxIDAgb2JqCjw8Ci9UeXBlIC9DYXRhbG9nCi9QYWdlcyAyIDAgUgo+PgplbmRvYmoKMSAwIG9iago8PAovUHJvZHVjZXIgKExvcmFiaXogSWRlbnRpdHkgR2F0ZXdheSkKPj4KZW5kb2JqCnRyYWlsZXIKPDwKL1Jvb3QgMSAwIFIKPj4KJSVFT0YK";

export const SANDBOX_NIN_FIXTURES: Record<string, MockNinData> = {
  // Test Case 1: Standard Active Citizen (Musa Ibrahim Bello)
  "11111111111": {
    nin: "11111111111",
    vnin: "AB11111111111XYZ",
    firstname: "Musa",
    surname: "Bello",
    middlename: "Ibrahim",
    birthdate: "1990-05-12",
    gender: "MALE",
    telephoneno: "08011111111",
    residence_state: "Kano",
    residence_lga: "Nasarawa",
    residence_address: "Plot 14, Gwarzo Road, Kano",
    photo_base64: SAMPLE_PHOTO_BASE64,
  },

  // Test Case 2: Standard Active Citizen (Chidinma Grace Okonkwo)
  "22222222222": {
    nin: "22222222222",
    vnin: "CD22222222222XYZ",
    firstname: "Chidinma",
    surname: "Okonkwo",
    middlename: "Grace",
    birthdate: "1995-11-23",
    gender: "FEMALE",
    telephoneno: "08022222222",
    residence_state: "Lagos",
    residence_lga: "Ikeja",
    residence_address: "24 Allen Avenue, Ikeja, Lagos",
    photo_base64: SAMPLE_PHOTO_BASE64,
  },

  // Test Case 3: Standard Active Citizen (Oluwaseun David Adeleke)
  "33333333333": {
    nin: "33333333333",
    vnin: "EF33333333333XYZ",
    firstname: "Oluwaseun",
    surname: "Adeleke",
    middlename: "David",
    birthdate: "1988-08-15",
    gender: "MALE",
    telephoneno: "08033333333",
    residence_state: "Oyo",
    residence_lga: "Ibadan North",
    residence_address: "12 Bodija Estate, Ibadan, Oyo",
    photo_base64: SAMPLE_PHOTO_BASE64,
  },
};

/**
 * Resolves sandbox NIN record by NIN number, Phone, or vNIN
 */
export function getSandboxNinRecord(identifier: string): MockNinData | null {
  const cleanId = identifier.trim().replace(/\s+/g, "");

  // Match by direct NIN
  if (SANDBOX_NIN_FIXTURES[cleanId]) {
    return SANDBOX_NIN_FIXTURES[cleanId];
  }

  // Match by Phone number
  for (const record of Object.values(SANDBOX_NIN_FIXTURES)) {
    if (record.telephoneno === cleanId || cleanId.endsWith(record.telephoneno.slice(1))) {
      return record;
    }
  }

  // Match by vNIN
  for (const record of Object.values(SANDBOX_NIN_FIXTURES)) {
    if (record.vnin && record.vnin.toLowerCase() === cleanId.toLowerCase()) {
      return record;
    }
  }

  // Special Test Edge Case: 99999999999 simulates NO RECORD FOUND
  if (cleanId.startsWith("99999")) {
    return null;
  }

  // Default fallback for any other 11-digit number in sandbox: Generate consistent pseudo-realistic record
  if (/^\d{11}$/.test(cleanId)) {
    return {
      nin: cleanId,
      vnin: `VN${cleanId.slice(0, 8)}XYZ`,
      firstname: "Sandbox",
      surname: "Developer",
      middlename: "Test",
      birthdate: "1992-01-01",
      gender: "MALE",
      telephoneno: "08012345678",
      residence_state: "Federal Capital Territory",
      residence_lga: "Abuja Municipal",
      residence_address: "Lorabiz Sandbox Test Environment, Abuja",
      photo_base64: SAMPLE_PHOTO_BASE64,
    };
  }

  return null;
}

export function getSandboxPdfBase64(): string {
  return SAMPLE_PDF_BASE64;
}
