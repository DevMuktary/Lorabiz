export type AffidavitCategoryType = 
  | "CAC_CORPORATE"
  | "CHANGE_OF_NAME"
  | "AGE_DECLARATION"
  | "LOSS_OF_ITEM"
  | "PROOF_OF_OWNERSHIP"
  | "GENERAL_PURPOSE";

export type CacSubType =
  | "CAC_LOSS_OF_CERTIFICATE"
  | "CAC_SIGNATURE_CHANGE"
  | "CAC_DIRECTOR_CORRECTION";

export type AffidavitSealTier = "STANDARD" | "HIGH_COURT_ATTESTED";

export interface DeponentInfo {
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  passportUrl: string | null;
  gender: "MALE" | "FEMALE" | "OTHER";
  dob: string;
  calculatedAge: number | null;
  religion: string;
  nationality: string;
  stateOfResidence: string;
  lgaOfResidence: string;
  streetAddress: string;
  occupation?: string;
  signatureUrl: string | null;
  sealTier: AffidavitSealTier;
}

export interface CacFacts {
  subType: CacSubType;
  companyName: string;
  rcBnNumber: string;
  positionInCompany: string; // e.g. "Director", "Proprietor", "Secretary", "Shareholder"
  documentLost?: string;
  lossDate?: string;
  lossCircumstances?: string;
  policeReportNo?: string;
  oldSignatureUrl?: string | null; // Old specimen signature
  newSignatureUrl?: string | null; // New specimen signature
  signatureChangeReason?: string;
  erroneousDetail?: string;
  correctDetail?: string;
}

export interface ChangeOfNameFacts {
  formerFirstName: string;
  formerMiddleName?: string;
  formerLastName: string;
  newFirstName: string;
  newMiddleName?: string;
  newLastName: string;
  oldName: string;
  newName: string;
  reason: string;
  usageDestination: string;
}

export interface AgeDeclarationFacts {
  declaredDob: string;
  placeOfBirth: string;
  stateOfBirth: string;
  reason: string;
}

export interface LossOfItemFacts {
  itemLost: string;
  identifyingNumber: string;
  lossDate: string;
  lossLocation: string;
  policeReportNo?: string;
}

export interface ProofOfOwnershipFacts {
  subject: string;
  identifyingNumber: string;
  details: string;
}

export interface GeneralPurposeFacts {
  title: string;
  statements: string[];
}

export interface AffidavitFormData {
  category: AffidavitCategoryType;
  deponent: DeponentInfo;
  cacFacts: CacFacts;
  nameChangeFacts: ChangeOfNameFacts;
  ageFacts: AgeDeclarationFacts;
  lossFacts: LossOfItemFacts;
  ownershipFacts: ProofOfOwnershipFacts;
  generalFacts: GeneralPurposeFacts;
}
