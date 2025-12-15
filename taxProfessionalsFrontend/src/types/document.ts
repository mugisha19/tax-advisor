// src/types/document.ts

export enum DocumentType {
  SIGNEDLETTER = "SIGNEDLETTER",
  CRIMINALRECORD = "CRIMINALRECORD",
  EDUCERTIFICATE = "EDUCERTIFICATE",
  RECOMMENDATIONLETTER = "RECOMMENDATIONLETTER",
  NONREFUNDFEES = "NONREFUNDFEES",
  CV = "CV",
  TAXCLEARANCECERTIFICATE = "TAXCLEARANCECERTIFICATE",
  BUSINESSREGISTRATIONCERT = "BUSINESSREGISTRATIONCERT",
  EBMCERTIFICATE = "EBMCERTIFICATE",
}

export interface Document {
  docId: number;
  tpin: string;
  documentType: DocumentType;
  filePath: string;
  uploadedAt: string;
  isVerified: boolean;
  // Optional metadata fields for education certificates
  certificateType?: "BACHELOR" | "PROFESSIONAL_QUALIFICATION" | "MASTERS";
  bachelorDegree?: string;
  professionalQualification?: string;
  otherProfessionalQualification?: string;
  mastersDegreeName?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Friendly names for document types
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  [DocumentType.SIGNEDLETTER]: "Signed Letter",
  [DocumentType.CRIMINALRECORD]: "Criminal Record Certificate",
  [DocumentType.EDUCERTIFICATE]: "Education Certificate",
  [DocumentType.RECOMMENDATIONLETTER]: "Recommendation Letter",
  [DocumentType.NONREFUNDFEES]: "Payment Proof",
  [DocumentType.CV]: "Curriculum Vitae (CV)",
  [DocumentType.TAXCLEARANCECERTIFICATE]: "Tax Clearance Certificate",
  [DocumentType.BUSINESSREGISTRATIONCERT]: "Business Registration Certificate",
  [DocumentType.EBMCERTIFICATE]: "EBM Certificate",
};
