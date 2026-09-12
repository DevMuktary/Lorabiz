export const VALID_NIN_SLIP_TYPES = [
  "nin_basic",
  "nin_vnin",
  "nin_regular",
  "nin_standard",
  "nin_premium",
] as const;

export const VALID_PHONE_SLIP_TYPES = [
  "nin_regular",
  "nin_standard",
  "nin_premium",
] as const;

export type NinSlipType = typeof VALID_NIN_SLIP_TYPES[number];
export type PhoneSlipType = typeof VALID_PHONE_SLIP_TYPES[number];

export const SLIP_DISPLAY_NAMES: Record<string, string> = {
  nin_basic: "Basic Demographic Slip",
  nin_vnin: "Virtual NIN (vNIN) Slip",
  nin_regular: "Regular NIN Slip",
  nin_standard: "Standard Biometric Slip",
  nin_premium: "Premium Card Slip",
};

export const API_PRICING_KEYS_NIN: Record<string, string> = {
  nin_basic: "API_NIN_BASIC",
  nin_vnin: "API_NIN_VNIN",
  nin_regular: "API_NIN_REGULAR",
  nin_standard: "API_NIN_STANDARD",
  nin_premium: "API_NIN_PREMIUM",
};

export const API_PRICING_KEYS_PHONE: Record<string, string> = {
  nin_regular: "API_NIN_PHONE_REGULAR",
  nin_standard: "API_NIN_PHONE_STANDARD",
  nin_premium: "API_NIN_PHONE_PREMIUM",
};

export interface NormalizedDemographicData {
  nin: string;
  firstname: string;
  middlename: string | null;
  surname: string;
  fullname: string;
  gender: string;
  birthdate: string;
  telephoneno: string | null;
  photo: string;
  address: string | null;
  residence_lga: string | null;
  residence_state: string | null;
  self_origin_lga: string | null;
  self_origin_state: string | null;
  tracking_id: string | null;
}

export interface StandardSlipObject {
  slip_type: string;
  display_name: string;
  pdf_base64: string;
}

export interface StandardTransactionObject {
  reference: string;
  client_reference: string | null;
  amount_charged: number;
  currency: "NGN";
  environment: "live" | "test";
  balance_after: number;
}

export interface StandardApiResponse {
  status: "success";
  message: string;
  data: NormalizedDemographicData;
  slip: StandardSlipObject;
  transaction: StandardTransactionObject;
}

/**
 * Normalizes raw upstream provider responses into a clean, uniform Lorabiz contract.
 * Standardizes all demographic keys into clean lowercase.
 */
export function normalizeNinSlipResponse(params: {
  rawResult: any;
  slipType: string;
  reference: string;
  clientReference?: string | null;
  amountCharged: number;
  environment: "LIVE" | "TEST";
  balanceAfter: number;
  includeSlip?: boolean;
}): StandardApiResponse {
  const { rawResult, slipType, reference, clientReference, amountCharged, environment, balanceAfter, includeSlip = true } = params;

  // Extract nested user_data or array payload
  const u = rawResult.userData || rawResult.user_data || rawResult.data || 
    (Array.isArray(rawResult.response) ? rawResult.response[0] : rawResult.response) || {};

  const firstname = (u.firstname || u.first_name || u.firstName || rawResult.firstName || "").toString().trim();
  const middlename = (u.middlename || u.middle_name || u.middleName || rawResult.middleName || null)?.toString().trim() || null;
  const surname = (u.surname || u.lastname || u.last_name || u.lastName || rawResult.lastName || "").toString().trim();

  const rawFullname = (u.fullname || u.full_name || u.fullName || rawResult.fullName || "").toString().trim();
  const constructedFullname = [firstname, middlename, surname].filter(Boolean).join(" ");
  const fullname = constructedFullname || rawFullname || "Verified Citizen";

  const gender = (u.gender || u.sex || rawResult.gender || "Unknown").toString().trim();
  const birthdate = (u.birthdate || u.birth_date || u.birthDate || u.date_of_birth || u.dob || rawResult.dob || "").toString().trim();
  const telephoneno = (u.telephoneno || u.phone_number || u.phone || u.telephoneNo || u.mobile || rawResult.phone || null)?.toString().trim() || null;
  const photo = (u.photo || rawResult.photo || "").toString().trim();

  const address = (u.address || u.residence_address || u.residence_AdressLine1 || rawResult.address || null)?.toString().trim() || null;
  const residence_lga = (u.residence_lga || u.residenceLga || u.lga || null)?.toString().trim() || null;
  const residence_state = (u.residence_state || u.residenceState || u.state || null)?.toString().trim() || null;
  const self_origin_lga = (u.self_origin_lga || u.origin_lga || u.originLga || null)?.toString().trim() || null;
  const self_origin_state = (u.self_origin_state || u.origin_state || u.originState || null)?.toString().trim() || null;
  const tracking_id = (u.trackingId || u.tracking_id || u.trackingID || null)?.toString().trim() || null;

  const nin = (u.nin || u.vnin || rawResult.nin || "").toString().trim();

  const rawPdf = rawResult.pdfBase64 || rawResult.pdf_base64 || "";

  return {
    status: "success",
    message: "NIN verification slip generated successfully.",
    data: {
      nin,
      firstname,
      middlename,
      surname,
      fullname,
      gender,
      birthdate,
      telephoneno,
      photo,
      address,
      residence_lga,
      residence_state,
      self_origin_lga,
      self_origin_state,
      tracking_id,
    },
    slip: {
      slip_type: slipType,
      display_name: SLIP_DISPLAY_NAMES[slipType] || "NIN Slip",
      pdf_base64: rawPdf,
    },
    transaction: {
      reference,
      client_reference: clientReference || null,
      amount_charged: amountCharged,
      currency: "NGN",
      environment: environment.toLowerCase() as "live" | "test",
      balance_after: balanceAfter,
    },
  };
}

export const SANDBOX_NOT_FOUND_NINS = ["00000000000", "00000000001", "99999999999"];
export const SANDBOX_NOT_FOUND_PHONES = ["00000000000", "07000000000", "08000000000"];

/**
 * Generates high-fidelity simulated response for TEST environment queries.
 * Allows developers to test their integration, decode base64 PDF, and parse JSON
 * without burning real DataVerify balance.
 */
export function generateMockNinResponse(params: {
  identifier: string;
  searchType: "NIN" | "PHONE";
  slipType: string;
  reference: string;
  clientReference?: string | null;
  amountCharged: number;
  balanceAfter: number;
  includeSlip?: boolean;
}): StandardApiResponse {
  const { identifier, searchType, slipType, reference, clientReference, amountCharged, balanceAfter, includeSlip = true } = params;

  // Minimal standard valid 1-page PDF binary in Base64 (starts with %PDF-1.4)
  const mockPdfBase64 =
    "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDM0Ny9GaWx0ZXIvRmxhdGVEZWNvZGU+PnN0cmVhbQp4nH2Q" +
    "wW6DMBBE7/4Kj3toZde7A1Uq9VS1SkqVqnupgAM0YmFsh37+vjZq6yGHnWY1b7QeaE/bL2c7i8vB1/7kWw6m0g8+u6F7dG2/" +
    "9wG3H+7wUe1cR1d07Xh0kY9m7G2f8/u4Z+u1b7r766t5sMvY+vM+eR/k7cvrf76+5c8g2gMbhFhFkQvPqEQmQ/8R0W4FkI0P" +
    "G1n4wzT8V3v43xX7+b96+Pz5/v3663/7+vv/7/9+/v//+P7//f3///b//9///37//v//+/f/77///3///v3//f/9///37//7" +
    "///3//f/9///37//7///37//f/9///37//7///37//f/9///37//7///37//f/9///37//7///37//f/9///37//7///37//";

  const mockNin = searchType === "NIN" ? identifier : "23456789012";
  const mockPhone = searchType === "PHONE" ? identifier : "08023456789";

  const isMaleProfile = identifier === "12345678901" || identifier === "08012345678";

  const profileData: NormalizedDemographicData = isMaleProfile
    ? {
        nin: mockNin,
        firstname: "MUSA",
        middlename: "IBRAHIM",
        surname: "BELLO",
        fullname: "MUSA IBRAHIM BELLO",
        gender: "Male",
        birthdate: "1994-05-18",
        telephoneno: mockPhone,
        photo: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/",
        address: "14 Adeola Odeku Street, Victoria Island",
        residence_lga: "Eti-Osa",
        residence_state: "Lagos",
        self_origin_lga: "Kano Municipal",
        self_origin_state: "Kano",
        tracking_id: "TRK-984210",
      }
    : {
        nin: mockNin,
        firstname: "FATIMA",
        middlename: "ZAHRA",
        surname: "ABUBAKAR",
        fullname: "FATIMA ZAHRA ABUBAKAR",
        gender: "Female",
        birthdate: "1996-08-14",
        telephoneno: mockPhone,
        photo: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/",
        address: "Plot 42 Ahmadu Bello Way, Central Business District",
        residence_lga: "Abuja Municipal",
        residence_state: "FCT",
        self_origin_lga: "Kano Municipal",
        self_origin_state: "Kano",
        tracking_id: "TRK-881920",
      };

  return {
    status: "success",
    message: `[TEST SANDBOX] NIN verification slip generated successfully.`,
    data: profileData,
    slip: {
      slip_type: slipType,
      display_name: SLIP_DISPLAY_NAMES[slipType] || "Standard Biometric Slip",
      pdf_base64: mockPdfBase64,
    },
    transaction: {
      reference,
      client_reference: clientReference || null,
      amount_charged: amountCharged,
      currency: "NGN",
      environment: "test",
      balance_after: balanceAfter,
    },
  };
}
