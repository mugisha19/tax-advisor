// src/types/application.ts

export enum ApplicationStatus {
  REGISTERED = "REGISTERED",
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum BusinessStatus {
  INDIVIDUAL = "INDIVIDUAL",
  COMPANY = "COMPANY",
}

export enum BachelorDegree {
  ACCOUNTING = "ACCOUNTING",
  LAW = "LAW",
  TAXATION = "TAXATION",
  FINANCE = "FINANCE",
  ECONOMICS = "ECONOMICS",
  COMMERCE = "COMMERCE",
  MANAGEMENT = "MANAGEMENT",
}

export enum ProfessionalQualification {
  CPA = "CPA",
  ACCA = "ACCA",
  CAT = "CAT",
  OTHER = "OTHER",
}

export interface WorkAddress {
  name: string;
}

export interface Application {
  tpin: string;
  tinCompany?: string;
  nid: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  workAddress?: WorkAddress;
  businessStatus: BusinessStatus;
  bachelorDegree?: BachelorDegree;
  mastersDegree?: BachelorDegree;
  professionalQualification?: ProfessionalQualification;
  otherProfessionalDetails?: string;
  applicationDate: string;
  status: ApplicationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  approvalDate?: string;
  expiryDate?: string;
  rejectionReason?: string;
  certificateFilePath?: string;
  problematicDocumentIds?: number[];
  hasReapplied?: boolean;

  // ==================== REAPPLICATION TRACKING FIELDS ====================
  /**
   * Tracks the total number of times this application has been rejected
   * - rejectionCount = 0: New application, never rejected
   * - rejectionCount = 1: First rejection, can resubmit ONCE
   * - rejectionCount = 2+: Second or more rejection, BLOCKED from resubmission
   */
  rejectionCount?: number;

  /**
   * Indicates if this application is a reapplication after rejection
   * True when status changes from REJECTED to PENDING
   */
  isReapplication?: boolean;

  /**
   * Stores the most recent rejection reason before reapplication
   * This preserves history for reference
   */
  previousRejectionReason?: string;

  /**
   * Stores who reviewed the previous rejection
   */
  previousReviewedBy?: string;

  /**
   * Stores when the previous rejection was made
   */
  previousReviewedAt?: string;

  /**
   * Stores the date when the applicant reapplied after rejection
   * Updated when status changes from REJECTED to PENDING
   */
  reapplicationDate?: string;
  // ========================================================================
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Checks if an application can be resubmitted based on rejection count
 * @param application The application to check
 * @returns true if resubmission is allowed, false otherwise
 */
export const canResubmitApplication = (
  application: Application | null
): boolean => {
  if (!application) return false;
  if (application.status !== ApplicationStatus.REJECTED) return false;

  // Allow resubmission only if rejectionCount < 2
  const rejectionCount = application.rejectionCount || 0;
  return rejectionCount < 2;
};

/**
 * Checks if this is a first rejection (can resubmit once)
 * @param application The application to check
 * @returns true if this is the first rejection
 */
export const isFirstRejection = (application: Application | null): boolean => {
  if (!application) return false;
  if (application.status !== ApplicationStatus.REJECTED) return false;

  const rejectionCount = application.rejectionCount || 0;
  return rejectionCount === 1;
};

/**
 * Checks if this is a second rejection (no more resubmissions allowed)
 * @param application The application to check
 * @returns true if this is the second or more rejection
 */
export const isSecondRejection = (application: Application | null): boolean => {
  if (!application) return false;
  if (application.status !== ApplicationStatus.REJECTED) return false;

  const rejectionCount = application.rejectionCount || 0;
  return rejectionCount >= 2;
};

/**
 * Gets the appropriate error message for blocked resubmission
 * @param isCompanyMember Whether this is a company member application
 * @returns The error message string
 */
export const getResubmissionBlockedMessage = (
  isCompanyMember: boolean = false
): string => {
  const applicationType = isCompanyMember
    ? "company member application"
    : "individual application";

  return (
    `Application Rejected - Resubmission Not Available. ` +
    `Your application has been rejected for the second time. ` +
    `You have already used your one-time resubmission opportunity after the first rejection. ` +
    `Unfortunately, no further resubmissions are allowed for this ${applicationType}. ` +
    `Please contact the Rwanda Revenue Authority for guidance on how to proceed with a new application.`
  );
};
